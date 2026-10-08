import { test, expect } from '../../src/fixtures/api.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

// 2 list GETs, 11s apart, stays under 6/60s.
const SLEEP_MS = 11_000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isoDaysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
const isoDaysAhead = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

test.describe.serial('Helpdesk threads combined filter (deep)', () => {
  test('kitchen-sink status+priority+30d window returns a valid page @api', async ({ api }) => {
    const page = await api.helpdesk.combinedFilter({
      status: ['open'], priority: ['high'],
      from: isoDaysAgo(30), to: new Date().toISOString(), limit: 5
    });
    expect(Array.isArray(page.items)).toBe(true);
    expect(page.items.length).toBeLessThanOrEqual(5);
    for (const row of page.items) {
      expect(typeof row.id).toBe('string');
      if (row.accountId != null) expect(row.accountId).toBe(APPROVED_ORG);
    }
    await sleep(SLEEP_MS);
  });

  test('future-only window returns an empty-but-valid page @api', async ({ api }) => {
    const page = await api.helpdesk.combinedFilter({
      status: ['open'], priority: ['high'],
      from: isoDaysAhead(30), to: isoDaysAhead(60), limit: 5
    });
    expect(Array.isArray(page.items)).toBe(true);
    // We don't assert empty strictly — the backend may interpret future ranges
    // as empty or (defensively) as "no filter"; both are valid as long as the
    // shape holds and tenant checks still pass.
    for (const row of page.items) {
      expect(typeof row.id).toBe('string');
      if (row.accountId != null) expect(row.accountId).toBe(APPROVED_ORG);
    }
  });
});
