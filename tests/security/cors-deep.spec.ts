import { test, expect } from '../../src/fixtures/security.ts';
import { apiConfig, APPROVED_ORG, APPROVED_BASE } from '../../src/config/env.ts';

// CORS preflight probing. Verifies the API does not echo arbitrary origins
// (which would relax browser same-origin protections for every attacker-controlled
// page) and does send the console origin back for legitimate preflights.
const EVIL_ORIGIN = 'https://evil.example.invalid';

function consoleOrigin(): string { return new URL(APPROVED_BASE).origin; }
function url(): string { return `${apiConfig().mainBase}/v1/org/${APPROVED_ORG}/threads`; }

test.describe('cors deep @security', () => {
  test('preflight does not echo an untrusted origin', async ({ probeMethod }) => {
    const { status, headers } = await probeMethod(url(), 'OPTIONS', {
      origin: EVIL_ORIGIN,
      'access-control-request-method': 'GET',
      'access-control-request-headers': 'authorization,content-type',
    });
    const allow = headers['access-control-allow-origin'] ?? '';
    test.info().annotations.push({ type: 'finding', description: `evil preflight status=${status} allow-origin=${allow || '(absent)'}` });
    expect(allow, 'wildcard CORS must not be returned').not.toBe('*');
    expect(allow.toLowerCase(), 'evil origin must not be echoed').not.toBe(EVIL_ORIGIN.toLowerCase());
  });

  test('preflight for the legitimate console origin is reflected (not wildcard)', async ({ probeMethod }) => {
    const legit = consoleOrigin();
    const { status, headers } = await probeMethod(url(), 'OPTIONS', {
      origin: legit,
      'access-control-request-method': 'GET',
      'access-control-request-headers': 'authorization,content-type',
    });
    const allow = headers['access-control-allow-origin'] ?? '';
    test.info().annotations.push({ type: 'finding', description: `console preflight status=${status} allow-origin=${allow || '(absent)'}` });
    // If the gateway strips CORS, we only annotate; otherwise it should reflect the specific origin.
    if (allow) {
      expect(allow, 'must not use wildcard when credentials are allowed').not.toBe('*');
      expect(allow.toLowerCase(), 'should reflect the console origin exactly').toBe(legit.toLowerCase());
    } else {
      test.info().annotations.push({ type: 'warning', description: 'no Access-Control-Allow-Origin on legit preflight (gateway may strip)' });
    }
  });
});
