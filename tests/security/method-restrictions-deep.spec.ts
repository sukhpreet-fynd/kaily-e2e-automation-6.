import { test, expect } from '../../src/fixtures/security.ts';
import { apiConfig, APPROVED_ORG } from '../../src/config/env.ts';

// Probes method whitelisting on /v1/org/{org}/threads with a VALID bearer. No
// bodies are sent — we only verify the server never accepts a mutation via an
// unlisted verb. 2xx on any of these would indicate an authorization or router
// misconfiguration.
const url = () => `${apiConfig().mainBase}/v1/org/${APPROVED_ORG}/threads`;

function isClientError(status: number): boolean { return status >= 400 && status < 500; }
function isClientOrServerError(status: number): boolean { return status >= 400 && status < 600; }

test.describe('method restrictions deep @security', () => {
  test('POST without a body is rejected with 4xx (never 2xx)', async ({ probeMethod, bearer }) => {
    const { status } = await probeMethod(url(), 'POST', { authorization: bearer });
    expect(status, `POST should not succeed; saw ${status}`).not.toBeGreaterThanOrEqual(200);
    // Second assertion kept explicit for clarity: must be a client error (400/404/405/415).
    expect(isClientError(status), `expected 4xx on empty POST, got ${status}`).toBe(true);
  });

  test('DELETE on the collection URL is rejected with 4xx', async ({ probeMethod, bearer }) => {
    const { status } = await probeMethod(url(), 'DELETE', { authorization: bearer });
    expect(isClientError(status), `expected 4xx on DELETE, got ${status}`).toBe(true);
  });

  test('TRACE is rejected (never 2xx)', async ({ probeMethod, bearer }) => {
    const { status } = await probeMethod(url(), 'TRACE', { authorization: bearer });
    // TRACE may be rejected at gateway (4xx) or runtime (5xx); either is acceptable.
    expect(isClientOrServerError(status) || status === 0, `expected non-2xx on TRACE, got ${status}`).toBe(true);
    expect(status < 200 || status >= 300, `TRACE must not succeed; saw ${status}`).toBe(true);
  });

  test('CONNECT is rejected (never 2xx)', async ({ probeMethod, bearer }) => {
    const { status } = await probeMethod(url(), 'CONNECT', { authorization: bearer });
    expect(isClientOrServerError(status) || status === 0, `expected non-2xx on CONNECT, got ${status}`).toBe(true);
    expect(status < 200 || status >= 300, `CONNECT must not succeed; saw ${status}`).toBe(true);
  });
});
