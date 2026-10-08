import { test, expect } from '../../src/fixtures/api.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

test.describe.serial('Helpdesk thread detail API', () => {
  test('fetches first thread detail with tenant assertion @api', async ({ api }) => {
    const page = await api.helpdesk.listThreadsFiltered({ limit: 1 });
    if (!page.items.length) test.skip(true, 'No threads provisioned; cannot assert detail shape.');
    const first = page.items[0];
    const id = String(first.id);
    const detail = await api.helpdesk.thread(id);
    expect(detail.id).toBe(id);
    if (detail.accountId != null) expect(detail.accountId).toBe(APPROVED_ORG);
  });
});
