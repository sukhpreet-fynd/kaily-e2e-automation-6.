import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coreConfig, inboundConfig, APPROVED_ORG, APPROVED_BASE } from '../../src/config/env.ts';
import { isOtherOrganization } from '../../src/auth/scope.ts';
import { eventually } from '../../src/polling/eventually.ts';
import { HttpFailure, jsonRequest } from '../../src/api/transport.ts';
import { HelpdeskClient } from '../../src/api/helpdesk-client.ts';
import { IntegrationInbound } from '../../src/channels/integration-inbound.ts';
import { testMessage } from '../../src/data/test-message.ts';

const env = {
  KAILY_ORG_ID: APPROVED_ORG, KAILY_BASE_URL: APPROVED_BASE,
  KAILY_MAIN_API_BASE_URL: 'https://api.example.invalid/panel',
  KAILY_API_ORIGINS: 'https://api.example.invalid',
  KAILY_INTEGRATIONS_API_BASE_URL: 'https://api.example.invalid/integrations',
  KAILY_COPILOT_APP_ID: 'test-app', KAILY_INTEGRATION_ID: 'test-integration',
  KAILY_INTEGRATION_TOKEN: 'unit-fixture-only',
  KAILY_ENABLE_INBOUND: 'true', KAILY_SIDE_EFFECTS_ISOLATED: 'true',
};

test('configuration rejects other organizations, hosts, unsafe state paths and unconfirmed writes', () => {
  assert.equal(coreConfig({}).orgId, APPROVED_ORG);
  assert.throws(() => coreConfig({ KAILY_ORG_ID: 'other-org' }), /scope/);
  assert.throws(() => coreConfig({ KAILY_BASE_URL: 'https://other.example.invalid/' }), /scope/);
  assert.throws(() => coreConfig({ KAILY_AUTH_STATE_PATH: '/tmp/agent.json' }), /Auth state/);
  assert.throws(() => coreConfig({ KAILY_POLL_TIMEOUT_MS: 'Infinity' }), /timeout/);
  assert.throws(() => inboundConfig({ ...env, KAILY_SIDE_EFFECTS_ISOLATED: 'false' }), /isolation/);
  assert.throws(() => inboundConfig({ ...env, KAILY_ENABLE_INBOUND: 'false' }), /enablement/);
  assert.throws(() => inboundConfig({ ...env, KAILY_MAIN_API_BASE_URL: 'https://unapproved.example.invalid/' }), /approved/);
  assert.throws(() => inboundConfig({ ...env, KAILY_MAIN_API_BASE_URL: 'https://user:password@api.example.invalid/' }), /HTTPS/);
});

test('browser scope detects cross-account navigation and API/token requests', () => {
  for (const prefix of ['accounts', 'v1/org', 'token']) {
    assert.equal(isOtherOrganization(`https://example.invalid/${prefix}/${APPROVED_ORG}/threads`), false);
    assert.equal(isOtherOrganization(`https://example.invalid/${prefix}/other-org/threads`), true);
  }
  assert.equal(isOtherOrganization('https://example.invalid/auth/sign-in'), false);
  assert.equal(isOtherOrganization('https://example.invalid/v1%2Forg%2Fother-org/threads'), true);
});

test('polling tolerates explicitly allowed propagation delay and returns persisted data', async () => {
  let reads = 0;
  const result = await eventually(async () => {
    reads++;
    if (reads === 1) throw new HttpFailure(404);
    return reads === 3;
  }, Boolean, { timeoutMs: 1000, intervalMs: 1, allowNotFound: true });
  assert.equal(result, true);
  assert.equal(reads, 3);
});

test('polling fails immediately on permission errors and stops at its deadline', async () => {
  let reads = 0;
  await assert.rejects(eventually(async () => { reads++; throw new HttpFailure(403); }, Boolean,
    { timeoutMs: 1000, intervalMs: 1, allowNotFound: true }), /HTTP 403/);
  assert.equal(reads, 1);
  await assert.rejects(eventually(async () => false, Boolean, { timeoutMs: 10, intervalMs: 1 }), /did not become available/);
});

test('transport refuses redirects and omits response secrets from failures', async t => {
  let options: RequestInit | undefined;
  t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    options = init;
    return new Response('must-not-be-logged', { status: 302 });
  });
  await assert.rejects(jsonRequest('https://example.invalid', '/v1/users', {}), error => {
    assert.equal((error as Error).message.includes('must-not-be-logged'), false);
    return error instanceof HttpFailure && error.status === 302;
  });
  assert.equal(options?.redirect, 'manual');
});

test('integration preflight rejects mismatched app ownership before any writes', async t => {
  const methods: string[] = [];
  t.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    methods.push(options.method!);
    return Response.json({ id: env.KAILY_INTEGRATION_ID, copilotAppId: 'wrong-app', active: true });
  });
  const client = new HelpdeskClient({ orgId: APPROVED_ORG, mainBase: env.KAILY_MAIN_API_BASE_URL }, {});
  await assert.rejects(client.verifyIntegration('test-app', 'test-integration', 'unit-fixture-only'), /preflight failed/);
  assert.deepEqual(methods, ['GET']);
});

test('inbound adapter sends only source-derived payloads after ownership validation', async t => {
  const previous = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]));
  Object.assign(process.env, env);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  const calls: { url: string; method: string; body?: Record<string, unknown> }[] = [];
  const data = testMessage();
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    const body = options.body ? JSON.parse(String(options.body)) : undefined;
    calls.push({ url, method: options.method!, body });
    if (url.endsWith('/integrations/test-integration')) return Response.json({
      id: 'test-integration', copilotAppId: 'test-app', token: 'unit-fixture-only', active: true,
      operations: ['users/create', 'conversations/create', 'conversations/messages/create'],
    });
    if (url.endsWith('/v1/users')) return Response.json({ id: 'user-1' });
    if (url.endsWith('/v1/conversations')) return Response.json({ id: 'thread-1' });
    if (url.endsWith('/threads/thread-1')) return Response.json({ copilotAppId: 'test-app', userId: 'user-1', meta: { surface: 'web' } });
    if (url.endsWith('/conversations/thread-1/messages')) return Response.json({ id: `ext-${data.messageId}` });
    throw new Error('Unexpected offline request.');
  });
  const receipt = await new IntegrationInbound(new HelpdeskClient({ orgId: APPROVED_ORG, mainBase: env.KAILY_MAIN_API_BASE_URL }, {})).createInbound(data);
  assert.equal(receipt.messageId, `ext-${data.messageId}`);
  assert.equal(calls.filter(call => call.method === 'POST').length, 3);
  assert.equal(calls.some(call => call.url.includes('generateAssistantMessage')), false);
  assert.deepEqual(calls[2].body, { title: data.title, userId: 'user-1', meta: { surface: 'web' }, appendMeta: true });
  assert.deepEqual(calls[4].body, { id: data.messageId, userId: 'user-1', role: 'user', content: data.content });
});

test('each run produces distinct synthetic identifiers without real contact details', () => {
  const first = testMessage();
  assert.notEqual(first.runId, testMessage().runId);
  assert.equal(first.content.includes(first.runId), true);
});
