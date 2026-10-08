import { test, expect } from '../../src/fixtures/security.ts';
import { apiConfig, APPROVED_ORG } from '../../src/config/env.ts';

// Confirms the JSON API serves JSON. HTML responses would indicate an upstream
// proxy misroute or an error page bleeding through the API path — both
// security-relevant signals.
const url = () => `${apiConfig().mainBase}/v1/org/${APPROVED_ORG}/threads?limit=1`;

test.describe('content-type deep @security', () => {
  test('GET /threads responds with application/json', async ({ probeFull, bearer }) => {
    const { status, contentType } = await probeFull(url(), { headers: { authorization: bearer } });
    expect(status, `expected 200, got ${status}`).toBe(200);
    expect(contentType, 'Content-Type must be present').not.toBeNull();
    expect((contentType ?? '').toLowerCase()).toContain('application/json');
  });

  test('GET /threads is not served as text/html', async ({ probeFull, bearer }) => {
    const { contentType } = await probeFull(url(), { headers: { authorization: bearer } });
    const ct = (contentType ?? '').toLowerCase();
    expect(ct.includes('text/html'), `API path leaked HTML content-type: ${ct}`).toBe(false);
  });
});
