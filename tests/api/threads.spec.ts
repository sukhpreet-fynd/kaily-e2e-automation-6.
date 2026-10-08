import { test, expect } from '../../src/fixtures/api.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

test.describe.serial('Threads API', () => {
  test('lists threads with required shape @api', async ({ api }) => {
    const threads = await api.helpdesk.listThreads();
    expect(Array.isArray(threads)).toBe(true);
    if (!threads.length) test.skip(true, 'No threads provisioned; cannot assert thread shape.');
    for (const row of threads) {
      expect(typeof row.id).toBe('string');
      if (row.accountId != null) expect(row.accountId).toBe(APPROVED_ORG);
    }
  });

  test('fetches a single thread detail @api', async ({ api }) => {
    const threads = await api.helpdesk.listThreads();
    if (!threads.length) test.skip(true, 'No threads to fetch.');
    const first = threads[0];
    const detail = await api.helpdesk.thread(String(first.id));
    expect(detail.id).toBe(first.id);
    if (detail.accountId != null) expect(detail.accountId).toBe(APPROVED_ORG);
  });
});
