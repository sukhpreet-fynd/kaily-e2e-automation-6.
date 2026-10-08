import { test, expect } from '../../src/fixtures/security.ts';

const publicBase = process.env.KAILY_PUBLIC_API_BASE_URL;

test.describe('public API bearer auth @security', () => {
  test.skip(!publicBase, 'Set KAILY_PUBLIC_API_BASE_URL to run public-API checks.');

  const specUrl = () => `${publicBase!.replace(/\/$/, '')}/api/publicapi/v1/openapi.json`;

  test('missing Authorization is rejected (or documented as intentionally public)', async ({ probe }) => {
    const { status } = await probe(specUrl(), {});
    // Record the finding either way; 401 is the expected locked-down behavior.
    const acceptable = status === 401 || status === 200;
    expect(acceptable, `unexpected status ${status} for unauthenticated spec fetch`).toBe(true);
    test.info().annotations.push({ type: 'finding', description: `unauthenticated openapi.json -> ${status}` });
  });

  test('invalid Bearer is rejected with 401', async ({ probe }) => {
    const { status } = await probe(specUrl(), { authorization: 'Bearer invalid-key' });
    expect(status).toBe(401);
  });

  test('query-string credentials are rejected with 401', async ({ probe }) => {
    const url = `${specUrl()}?authorization=${encodeURIComponent('Bearer invalid-key')}`;
    const { status } = await probe(url, {});
    expect(status).toBe(401);
  });
});
