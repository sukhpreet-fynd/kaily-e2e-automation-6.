import { test, expect } from '../../src/fixtures/api.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

// /threads list is rate-limited at 6/60s per account; this spec issues at most
// 2 list calls and sleeps between them.
const SLEEP_MS = 11_000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test.describe.serial('Helpdesk threads pagination (deep)', () => {
  test('follows next cursor and emits no duplicate ids across pages @api', async ({ api }) => {
    const first = await api.helpdesk.listThreadsPage({ limit: 5 });
    expect(Array.isArray(first.items)).toBe(true);
    expect(first.items.length).toBeLessThanOrEqual(5);
    for (const row of first.items) {
      expect(typeof row.id).toBe('string');
      if (row.accountId != null) expect(row.accountId).toBe(APPROVED_ORG);
    }
    if (!first.next) test.skip(true, 'No next cursor; dataset fits one page.');

    await sleep(SLEEP_MS);
    const second = await api.helpdesk.listThreadsPage({ limit: 5, next: first.next ?? undefined });
    expect(Array.isArray(second.items)).toBe(true);
    expect(second.items.length).toBeLessThanOrEqual(5);

    const firstIds = new Set(first.items.map(r => String(r.id)));
    for (const row of second.items) {
      expect(typeof row.id).toBe('string');
      if (row.accountId != null) expect(row.accountId).toBe(APPROVED_ORG);
      expect(firstIds.has(String(row.id))).toBe(false);
    }
  });
});
