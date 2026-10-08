import { test, expect } from '../../src/fixtures/security.ts';
import { apiConfig, APPROVED_ORG } from '../../src/config/env.ts';

// Deepens tenant-isolation by probing object-level paths: with a thread (and
// optional appId) resolved from the approved org, swap the org segment in the
// URL and assert the account-parser middleware still rejects at the URL level —
// before any resource lookup.
const WRONG_ORG = '00000000-0000-0000-0000-000000000000';
type JsonValue = unknown;
type JsonObject = Record<string, JsonValue>;

async function fetchJson(url: string, bearer: string, timeoutMs = 10_000): Promise<JsonObject | null> {
  try {
    const res = await fetch(url, { method: 'GET', headers: { authorization: bearer }, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const body = await res.json() as unknown;
    if (!body || typeof body !== 'object') return null;
    return body as JsonObject;
  } catch { return null; }
}

function firstString(obj: JsonObject | null, key: string): string | null {
  if (!obj) return null;
  const val = obj[key];
  return typeof val === 'string' && val.length > 0 ? val : null;
}

async function resolveThread(bearer: string): Promise<{ threadId: string | null; appId: string | null }> {
  const base = apiConfig().mainBase;
  const listUrl = `${base}/v1/org/${APPROVED_ORG}/threads?limit=1`;
  const body = await fetchJson(listUrl, bearer);
  const items = Array.isArray(body?.items) ? body!.items as JsonValue[] : [];
  const first = (items[0] && typeof items[0] === 'object') ? items[0] as JsonObject : null;
  const threadId = firstString(first, 'id');
  const appId = firstString(first, 'copilotAppId') ?? firstString(first, 'appId');
  return { threadId, appId };
}

test.describe('cross-tenant by id deep @security', () => {
  test('cross-tenant GET on a thread id returns 403', async ({ probe, bearer }) => {
    const { threadId } = await resolveThread(bearer);
    test.skip(!threadId, 'No thread id resolvable from approved org; nothing to probe.');
    const url = `${apiConfig().mainBase}/v1/org/${WRONG_ORG}/threads/${threadId}`;
    const { status } = await probe(url, { authorization: bearer });
    expect(status, 'account-parser must reject cross-tenant thread lookup').toBe(403);
  });

  test('cross-tenant GET on nested messages path returns 403', async ({ probe, bearer }) => {
    const { threadId, appId } = await resolveThread(bearer);
    test.skip(!threadId || !appId, 'No {threadId, appId} resolvable; nothing to probe.');
    const url = `${apiConfig().mainBase}/v1/org/${WRONG_ORG}/copilotapps/${appId}/threads/${threadId}/messages`;
    const { status } = await probe(url, { authorization: bearer });
    expect(status, 'account-parser must reject nested cross-tenant path').toBe(403);
  });
});
