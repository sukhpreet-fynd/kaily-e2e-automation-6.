import { test, expect } from '../../src/fixtures/security.ts';
import { apiConfig, APPROVED_ORG } from '../../src/config/env.ts';

const threadsUrl = () => `${apiConfig().mainBase}/v1/org/${APPROVED_ORG}/threads?limit=1`;

test.describe('account API bearer auth @security', () => {
  test('rejects missing bearer with 401 or sign-in redirect', async ({ probe }) => {
    const { status } = await probe(threadsUrl(), {});
    const unauthenticated = status === 401 || (status >= 300 && status < 400);
    expect(unauthenticated, `expected 401 or 3xx redirect, got ${status}`).toBe(true);
  });

  test('rejects wrong-shape bearer with 401', async ({ probe }) => {
    const { status } = await probe(threadsUrl(), { authorization: 'Bearer invalid.token.value' });
    expect(status).toBe(401);
  });

  test('rejects expired/revoked bearer with 401', async ({ probe }) => {
    const revoked = process.env.KAILY_REVOKED_BEARER;
    test.skip(!revoked, 'Set KAILY_REVOKED_BEARER to run this check.');
    const { status } = await probe(threadsUrl(), { authorization: `Bearer ${revoked}` });
    expect(status).toBe(401);
  });
});
