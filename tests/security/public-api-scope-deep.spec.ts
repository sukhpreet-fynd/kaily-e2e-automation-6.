import { test, expect } from '../../src/fixtures/security.ts';

// Public-API scope enforcement probe. Takes a scoped key from env in the form
// `scope:value` (e.g. `threads:read:actual-key-material`) and asserts the read
// scope succeeds while a write via the same key is rejected. If the write
// succeeds, we flag a scope-enforcement bypass finding.
const PUBLIC_BASE = process.env.KAILY_PUBLIC_API_BASE_URL;
const SCOPED_RAW = process.env.KAILY_PUBLIC_API_SCOPED_KEY;

function parseScopedKey(raw: string | undefined): { scope: string; key: string } | null {
  if (!raw) return null;
  // Format: `<resource>:<action>:<key>`; the key itself may contain colons so we
  // split only the first two separators.
  const firstColon = raw.indexOf(':');
  if (firstColon < 0) return null;
  const secondColon = raw.indexOf(':', firstColon + 1);
  if (secondColon < 0) return null;
  const scope = raw.slice(0, secondColon);
  const key = raw.slice(secondColon + 1);
  if (!scope || !key) return null;
  return { scope, key };
}

test.describe('public API scope deep @security', () => {
  test.skip(!PUBLIC_BASE, 'Set KAILY_PUBLIC_API_BASE_URL to run public-API scope checks.');
  test.skip(!SCOPED_RAW, 'Set KAILY_PUBLIC_API_SCOPED_KEY=scope:key to run scope enforcement checks.');

  const base = () => `${PUBLIC_BASE!.replace(/\/$/, '')}/api/publicapi/v1`;

  test('scoped key succeeds on allowed read endpoint', async ({ probe }) => {
    const parsed = parseScopedKey(SCOPED_RAW);
    test.skip(!parsed, 'KAILY_PUBLIC_API_SCOPED_KEY not in `scope:key` form; skipping.');
    const { status } = await probe(`${base()}/threads?limit=1`, { authorization: `Bearer ${parsed!.key}` });
    test.info().annotations.push({ type: 'finding', description: `scope=${parsed!.scope} GET /threads -> ${status}` });
    expect(status, `expected 200 for in-scope read, got ${status}`).toBe(200);
  });

  test('scoped key is rejected on write endpoint it does not cover', async ({ probeMethod }) => {
    const parsed = parseScopedKey(SCOPED_RAW);
    test.skip(!parsed, 'KAILY_PUBLIC_API_SCOPED_KEY not in `scope:key` form; skipping.');
    const { status } = await probeMethod(`${base()}/threads`, 'POST', { authorization: `Bearer ${parsed!.key}` });
    test.info().annotations.push({ type: 'finding', description: `scope=${parsed!.scope} POST /threads -> ${status}` });
    if (status >= 200 && status < 300) {
      test.info().annotations.push({ type: 'bypass', description: 'Scoped read key accepted a write — scope enforcement bypass.' });
    }
    expect(status, 'read-only scope must not permit writes').toBe(403);
  });
});
