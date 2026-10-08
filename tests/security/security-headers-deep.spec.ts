import { test, expect } from '../../src/fixtures/security.ts';
import { apiConfig, APPROVED_ORG } from '../../src/config/env.ts';

// Soft-check for recommended transport/response security headers. These may be
// set by the API gateway rather than the app, so we annotate findings rather
// than hard-failing — the goal is a diffable record of what's present.
const RECOMMENDED = ['strict-transport-security', 'x-content-type-options', 'x-frame-options'] as const;

function reportHeaders(target: string, headers: Record<string, string>): void {
  const findings = RECOMMENDED.map(name => `${name}=${headers[name] ?? '(missing)'}`).join('; ');
  test.info().annotations.push({ type: 'finding', description: `security-headers ${target}: ${findings}` });
  // Also record which are missing explicitly for scanability.
  const missing = RECOMMENDED.filter(name => !headers[name]);
  if (missing.length) {
    test.info().annotations.push({ type: 'warning', description: `${target} missing recommended headers: ${missing.join(', ')}` });
  }
}

test.describe('security headers deep @security', () => {
  test('healthz exposes recommended headers (soft-check)', async ({ probeFull }) => {
    const base = apiConfig().mainBase;
    // _healthz lives at the service root, not under the console-scoped path. We
    // probe the hostname root; the service either responds (then we inspect) or
    // the probe returns status 0 (connection refused) and we annotate.
    const origin = new URL(base).origin;
    const { status, headers } = await probeFull(`${origin}/_healthz`);
    test.info().annotations.push({ type: 'finding', description: `healthz status=${status}` });
    reportHeaders('_healthz', headers);
    // Soft assertion only — this test exists to record the shape, not gate on it.
    expect(true).toBe(true);
  });

  test('authenticated threads endpoint exposes recommended headers (soft-check)', async ({ probeFull, bearer }) => {
    const url = `${apiConfig().mainBase}/v1/org/${APPROVED_ORG}/threads?limit=1`;
    const { status, headers } = await probeFull(url, { headers: { authorization: bearer } });
    test.info().annotations.push({ type: 'finding', description: `threads status=${status}` });
    reportHeaders('/v1/org/{org}/threads', headers);
    expect(true).toBe(true);
  });
});
