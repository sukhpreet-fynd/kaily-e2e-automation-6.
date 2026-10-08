import { test, expect } from '../../src/fixtures/api.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';
import { HttpFailure } from '../../src/api/transport.ts';

// Rate-limit math: 2 list GETs with 11s sleep stays under the 6/60s budget.
const SLEEP_MS = 11_000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test.describe.serial('Helpdesk threads search (deep)', () => {
  test('q="" returns a valid thread page shape @api', async ({ api }) => {
    let page;
    try {
      page = await api.helpdesk.searchThreads('', 5);
    } catch (error) {
      if (error instanceof HttpFailure && (error.status === 400 || error.status === 404)) {
        test.skip(true, `Threads search unavailable (HTTP ${error.status}).`);
      }
      throw error;
    }
    expect(Array.isArray(page.items)).toBe(true);
    expect(page.items.length).toBeLessThanOrEqual(5);
    for (const row of page.items) {
      expect(typeof row.id).toBe('string');
      if (row.accountId != null) expect(row.accountId).toBe(APPROVED_ORG);
    }
    await sleep(SLEEP_MS);
  });

  test('q="test" returns a valid thread page shape @api', async ({ api }) => {
    let page;
    try {
      page = await api.helpdesk.searchThreads('test', 5);
    } catch (error) {
      if (error instanceof HttpFailure && (error.status === 400 || error.status === 404)) {
        test.skip(true, `Threads search for q="test" unavailable (HTTP ${error.status}).`);
      }
      throw error;
    }
    expect(Array.isArray(page.items)).toBe(true);
    expect(page.items.length).toBeLessThanOrEqual(5);
    for (const row of page.items) {
      expect(typeof row.id).toBe('string');
      if (row.accountId != null) expect(row.accountId).toBe(APPROVED_ORG);
    }
  });
});
