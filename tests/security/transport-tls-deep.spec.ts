import { test, expect } from '../../src/fixtures/security.ts';
import { apiConfig } from '../../src/config/env.ts';

// Safety-net transport tests. The config layer already enforces https on the
// allowlist, but we verify at runtime and additionally confirm the http:// variant
// is not silently answered (which would indicate a plain-text listener leaking
// behind the TLS fronting).
test.describe('transport TLS deep @security', () => {
  test('mainBase uses https', () => {
    const url = new URL(apiConfig().mainBase);
    expect(url.protocol, `mainBase must be https, got ${url.protocol}`).toBe('https:');
  });

  test('mainBase has no credentials or query embedded', () => {
    const url = new URL(apiConfig().mainBase);
    expect(url.username, 'mainBase must not carry a username').toBe('');
    expect(url.password, 'mainBase must not carry a password').toBe('');
    expect(url.search, 'mainBase must not carry a query string').toBe('');
    expect(url.hash, 'mainBase must not carry a hash fragment').toBe('');
  });

  test('http:// variant of the API base does not serve traffic', async ({ probeFull }) => {
    const url = new URL(apiConfig().mainBase);
    const httpUrl = `http://${url.host}${url.pathname}`;
    const { status } = await probeFull(httpUrl, { timeoutMs: 5_000 });
    test.info().annotations.push({ type: 'finding', description: `http:// probe status=${status}` });
    // Acceptable outcomes: connection refused (status=0), 301/308 redirect to https,
    // or an explicit 4xx. A 2xx on plain http would be a transport-security regression.
    const succeeded2xx = status >= 200 && status < 300;
    expect(succeeded2xx, `plain http must not return 2xx; saw ${status}`).toBe(false);
  });
});
