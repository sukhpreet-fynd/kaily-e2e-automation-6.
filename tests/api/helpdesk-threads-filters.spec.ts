import { test, expect } from '../../src/fixtures/api.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

// /threads list is rate-limited at 6/60s per account. We keep this spec at
// <=5 GETs total and prefer countThreads (lighter) where only filter wiring
// is being verified. Sleep between calls stays below the window.
const SLEEP_MS = 11_000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sevenDaysAgoIso = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const nowIso = () => new Date().toISOString();

test.describe.serial('Helpdesk thread filters API', () => {
  test('count unfiltered returns non-negative integer @api', async ({ api }) => {
    const body = await api.helpdesk.countThreads({});
    expect(typeof body.count).toBe('number');
    expect(Number.isInteger(body.count)).toBe(true);
    expect(body.count as number).toBeGreaterThanOrEqual(0);
    await sleep(SLEEP_MS);
  });

  test('count with status=open filter returns non-negative integer @api', async ({ api }) => {
    const body = await api.helpdesk.countThreads({ status: ['open'] });
    expect(typeof body.count).toBe('number');
    expect(body.count as number).toBeGreaterThanOrEqual(0);
    await sleep(SLEEP_MS);
  });

  test('count with priority=high filter returns non-negative integer @api', async ({ api }) => {
    const body = await api.helpdesk.countThreads({ priority: ['high'] });
    expect(typeof body.count).toBe('number');
    expect(body.count as number).toBeGreaterThanOrEqual(0);
    await sleep(SLEEP_MS);
  });

  test('count with created-date range (last 7d) returns non-negative integer @api', async ({ api }) => {
    const body = await api.helpdesk.countThreads({ fromDate: sevenDaysAgoIso(), toDate: nowIso() });
    expect(typeof body.count).toBe('number');
    expect(body.count as number).toBeGreaterThanOrEqual(0);
    await sleep(SLEEP_MS);
  });

  test('filtered list limit=5 respects shape and tenant @api', async ({ api }) => {
    const page = await api.helpdesk.listThreadsFiltered({ status: ['open'], limit: 5 });
    expect(Array.isArray(page.items)).toBe(true);
    expect(page.items.length).toBeLessThanOrEqual(5);
    for (const row of page.items) {
      expect(typeof row.id).toBe('string');
      if (row.accountId != null) expect(row.accountId).toBe(APPROVED_ORG);
    }
    if (page.next != null) expect(typeof page.next).toBe('string');
  });
});
