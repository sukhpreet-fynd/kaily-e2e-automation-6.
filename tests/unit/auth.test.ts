import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp, writeFile, stat, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { errors, type Page } from '@playwright/test';
import { AuthenticationRequiredError, withSessionGuard } from '../../src/auth/session-guard.ts';
import { requireAuthState, saveAuthState } from '../../src/auth/state.ts';
import { manualLogin } from '../../src/auth/enter-kaily.ts';
import { coreConfig, APPROVED_BASE, APPROVED_ORG } from '../../src/config/env.ts';
import { HelpdeskClient } from '../../src/api/helpdesk-client.ts';

const forever = () => new Promise<never>(() => {});
const response = (url: string, status: number, body: unknown = {}) => ({
  url: () => url, status: () => status, json: async () => body, request: () => ({ method: () => 'GET' }),
});
const sessionUrl = 'https://auth.example.invalid/v1.0/session';
const tokenUrl = `https://auth.example.invalid/token/${APPROVED_ORG}`;

test('missing, malformed and empty storage state give a secret-free setup instruction', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'kaily-auth-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'user.json');
  await assert.rejects(requireAuthState(path), /npm run auth:setup again/);
  await writeFile(path, 'malformed-private-value');
  await assert.rejects(requireAuthState(path), error => error instanceof AuthenticationRequiredError && !error.message.includes('malformed-private-value'));
  await writeFile(path, JSON.stringify({ cookies: [], origins: [] }));
  await assert.rejects(requireAuthState(path), /empty or invalid/);
});

test('storage state is owner-only, replaced atomically and shared at the requested path', async t => {
  assert.equal(coreConfig({}).authFile, resolve('.auth/user.json'));
  const directory = await mkdtemp(join(tmpdir(), 'kaily-auth-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'user.json');
  const state = { cookies: [], origins: [{ origin: 'https://example.invalid', localStorage: [{ name: 'fixture', value: 'offline-only' }] }] };
  await saveAuthState(state, path);
  assert.deepEqual(await requireAuthState(path), state);
  assert.equal((await stat(path)).mode & 0o777, 0o600);
  assert.equal((await stat(directory)).mode & 0o777, 0o700);
  await saveAuthState(state, path);
  assert.deepEqual(await readdir(directory), ['user.json']);
});

test('revoked server session fails immediately even when a state file exists', async () => {
  const page = new EventEmitter();
  await assert.rejects(withSessionGuard(page as unknown as Page, async () => {
    page.emit('response', response(sessionUrl, 401));
    return forever();
  }), /npm run auth:setup again/);
  assert.equal(page.listenerCount('response'), 0);
  assert.equal(page.listenerCount('framenavigated'), 0);
});

test('sign-in redirects trigger renewal; unrelated resource failures do not', async () => {
  const frame = { url: () => `${APPROVED_BASE}auth/login?private=must-not-be-logged` };
  const page = Object.assign(new EventEmitter(), { mainFrame: () => frame });
  await assert.rejects(withSessionGuard(page as unknown as Page, async () => {
    page.emit('framenavigated', frame);
    return forever();
  }), error => error instanceof AuthenticationRequiredError && !error.message.includes('must-not-be-logged'));
  const result = await withSessionGuard(page as unknown as Page, async () => {
    page.emit('response', response('https://example.invalid/image.png', 401));
    return 'still-authenticated';
  });
  assert.equal(result, 'still-authenticated');
});

test('Helpdesk API session expiry during a test instructs the user to run setup again', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('private-response', { status: 401 }));
  const client = new HelpdeskClient({ mainBase: 'https://example.invalid', orgId: APPROVED_ORG }, {});
  await assert.rejects(client.listThreads(), error => error instanceof AuthenticationRequiredError && !error.message.includes('private-response'));
});

test('manual setup tolerates slow navigation, waits for the human, and finishes only after dashboard readiness', async () => {
  const visits: string[] = [];
  const page = new EventEmitter();
  const dashboard = `${APPROVED_BASE}accounts/${APPROVED_ORG}/dashboard`;
  let currentUrl = 'about:blank';
  let makeDashboardVisible!: () => void;
  const visible = new Promise<void>(resolveVisible => { makeDashboardVisible = resolveVisible; });
  const frame = { url: () => currentUrl };
  const fake = Object.assign(page, {
    isClosed: () => false,
    mainFrame: () => frame,
    waitForResponse: (predicate: (value: unknown) => boolean) => new Promise(resolveResponse => {
      const handler = (value: unknown) => {
        if (predicate(value)) { page.off('response', handler); resolveResponse(value); }
      };
      page.on('response', handler);
    }),
    goto: async (url: string) => {
      visits.push(url); currentUrl = url;
      if (url.endsWith('/auth/login')) throw new errors.TimeoutError('offline simulated slow document');
      if (url === dashboard) {
        page.emit('response', response(sessionUrl, 200, { user: { id: 'offline-user' } }));
        page.emit('response', response(tokenUrl, 200, { data: { token: 'offline-only' } }));
      }
    },
    waitForURL: async (predicate: (url: URL) => boolean) => { assert.equal(predicate(new URL(currentUrl)), true); },
    getByText: (text: string) => {
      assert.equal(text, 'See overview of all your stats here');
      return { waitFor: () => visible };
    },
  });
  let complete = false;
  const login = manualLogin(fake as unknown as Page).then(() => { complete = true; });
  await new Promise<void>(resolveTurn => setImmediate(resolveTurn));
  assert.deepEqual(visits, [`${APPROVED_BASE}auth/login`]);
  page.emit('response', response(sessionUrl, 401));
  assert.equal(complete, false);
  // Simulated successful manual MFA. No password fill, OTP generation or submission API exists in this fake.
  page.emit('response', response(sessionUrl, 200, { user: { id: 'offline-user' } }));
  await new Promise<void>(resolveTurn => setImmediate(resolveTurn));
  assert.equal(visits.at(-1), dashboard);
  assert.equal(complete, false);
  makeDashboardVisible();
  await login;
  assert.equal(complete, true);
});
