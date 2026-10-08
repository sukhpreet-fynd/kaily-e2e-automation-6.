import { test, expect } from '../../src/fixtures/api.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

// Thread list shape contract. Trinity's Helpdesk/Threads list renders each
// row with id, status, priority chip, assignee bubble and created/updated
// timestamps — the fields below are the floor; adding more is fine, missing
// any of them breaks the UI.
const REQUIRED_STRING: readonly string[] = ['id', 'accountId', 'status'];
const REQUIRED_ISO: readonly string[] = ['createdAt', 'updatedAt'];

function fail (field: string, reason: string): never {
  throw new Error(`contract: threads[*].${field} ${reason}`);
}

test.describe.serial('Contract: thread list', () => {
  test('each item carries the fields trinity renders @contract', async ({ api }) => {
    const rows = await api.helpdesk.listThreads();
    expect(Array.isArray(rows)).toBe(true);
    if (!rows.length) test.skip(true, 'No threads provisioned; cannot assert contract.');

    for (const row of rows) {
      for (const key of REQUIRED_STRING) {
        if (typeof row[key] !== 'string' || !(row[key] as string).length) fail(key, 'must be a non-empty string');
      }
      if (row.accountId !== APPROVED_ORG) fail('accountId', `must equal APPROVED_ORG (${APPROVED_ORG})`);
      // priority may be string or null; UI handles both.
      if (row.priority != null && typeof row.priority !== 'string') fail('priority', 'must be string or null');
      for (const key of REQUIRED_ISO) {
        const value = row[key];
        if (typeof value !== 'string') fail(key, 'must be an ISO string');
        if (Number.isNaN(Date.parse(value as string))) fail(key, 'must be parseable as a Date');
      }
    }
  });
});
