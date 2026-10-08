import { test, expect } from '../../src/fixtures/api.ts';
import { HttpFailure } from '../../src/api/transport.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

test.describe.serial('Audit API', () => {
  test('GET audit list with limit=10 @api', async ({ api }) => {
    let page;
    try {
      page = await api.audit.listAudit({ limit: 10 });
    } catch (error) {
      if (error instanceof HttpFailure && error.status === 403) test.skip(true, 'Audit log requires admin role for this account.');
      throw error;
    }
    expect(typeof page).toBe('object');
    const rows = Array.isArray(page.data) ? page.data : [];
    expect(rows.length).toBeLessThanOrEqual(10);
    for (const row of rows) {
      if (row && typeof row === 'object' && 'accountId' in row && row.accountId != null) {
        expect(row.accountId).toBe(APPROVED_ORG);
      }
    }
  });
});
