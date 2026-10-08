import { test, expect } from '../../src/fixtures/security.ts';
import { apiConfig, APPROVED_ORG } from '../../src/config/env.ts';

// A fixed, non-approved org UUID. The org-scope route guard aborts outbound
// browser traffic to foreign orgs, but server-side probing via fetch is still
// subject to the account-parser middleware which must respond with 403.
const WRONG_ORG = '00000000-0000-0000-0000-000000000000';
const wrongUrl = () => `${apiConfig().mainBase}/v1/org/${WRONG_ORG}/threads?limit=1`;
const rightUrl = () => `${apiConfig().mainBase}/v1/org/${APPROVED_ORG}/threads?limit=1`;

test.describe('tenant isolation @security', () => {
  test('cross-tenant GET returns 403', async ({ probe, bearer }) => {
    const { status } = await probe(wrongUrl(), { authorization: bearer });
    expect(status, 'account-parser must reject mismatched accountId').toBe(403);
  });

  test('approved-tenant GET returns 200 (control)', async ({ probe, bearer }) => {
    const { status } = await probe(rightUrl(), { authorization: bearer });
    expect(status).toBe(200);
  });
});
