import { test, expect } from '../../src/fixtures/security.ts';
import { apiConfig, APPROVED_ORG } from '../../src/config/env.ts';

const probeUrl = () => `${apiConfig().mainBase}/v1/org/${APPROVED_ORG}/threads?limit=1`;
const ENABLED = process.env.KAILY_PROBE_RATE_LIMITS === 'true';

test.describe('rate limit probe @security', () => {
  test.skip(!ENABLED, 'Opt-in only. Set KAILY_PROBE_RATE_LIMITS=true to run read-only rate-limit probe.');

  test('10 serial GETs produce either all 200 or at least one 429 with Retry-After', async ({ probe, bearer }) => {
    const results: Array<{ status: number; retryAfter: string | null }> = [];
    for (let i = 0; i < 10; i++) {
      results.push(await probe(probeUrl(), { authorization: bearer }));
    }
    const statuses = results.map(r => r.status);
    const throttled = results.find(r => r.status === 429);
    const allOk = statuses.every(s => s === 200);
    expect(throttled !== undefined || allOk, `expected 200s or at least one 429; saw ${statuses.join(',')}`).toBe(true);
    if (throttled) {
      expect(throttled.retryAfter, 'rate-limited response must include Retry-After').not.toBeNull();
      expect(/^\d+$/.test(throttled.retryAfter ?? ''), 'Retry-After should be a non-negative integer').toBe(true);
    }
    test.info().annotations.push({ type: 'finding', description: `rate-limit probe statuses: ${statuses.join(',')}` });
  });
});
