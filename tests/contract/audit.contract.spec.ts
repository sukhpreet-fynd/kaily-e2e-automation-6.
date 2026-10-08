import { test, expect } from '../../src/fixtures/api.ts';
import { HttpFailure } from '../../src/api/transport.ts';

// Audit list shape contract. Documented by neo audit.route.js:133 as
// `res.json({ data: rows, nextCursor, total })`. nextCursor is base64 of
// (createdAt, id) or null when no next page. total is a number (count).
// Admin-only; non-admin bearers return 403 which we skip (not a shape fail).
function fail (field: string, reason: string): never {
  throw new Error(`contract: audit.${field} ${reason}`);
}

test.describe.serial('Contract: audit list', () => {
  test('audit returns { data, nextCursor, total } @contract', async ({ api }) => {
    let page;
    try {
      page = await api.audit.listAudit({ limit: 5 });
    } catch (error) {
      if (error instanceof HttpFailure && error.status === 403) test.skip(true, 'Audit log requires admin role for this account.');
      throw error;
    }
    if (!Array.isArray(page.data)) fail('data', 'must be an array');
    if (!(page.nextCursor === null || typeof page.nextCursor === 'string')) fail('nextCursor', 'must be string or null');
    if (typeof page.total !== 'number' || !Number.isFinite(page.total)) fail('total', 'must be a finite number');
    expect(Array.isArray(page.data)).toBe(true);
  });
});
