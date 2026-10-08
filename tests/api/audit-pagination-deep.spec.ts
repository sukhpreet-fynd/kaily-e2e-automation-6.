import { test, expect } from '../../src/fixtures/api.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';
import { HttpFailure } from '../../src/api/transport.ts';

test.describe.serial('Audit pagination (deep)', () => {
  test('follows nextCursor and emits no duplicate ids across pages @api', async ({ api }) => {
    let first;
    try {
      first = await api.audit.listAuditPage({ limit: 5 });
    } catch (error) {
      if (error instanceof HttpFailure && error.status === 403) {
        test.skip(true, 'Audit log requires admin role for this account.');
      }
      throw error;
    }
    expect(Array.isArray(first.data)).toBe(true);
    expect(first.data.length).toBeLessThanOrEqual(5);
    for (const row of first.data) {
      if (row && typeof row === 'object' && 'accountId' in row && (row as Record<string, unknown>).accountId != null) {
        expect((row as Record<string, unknown>).accountId).toBe(APPROVED_ORG);
      }
    }
    if (!first.nextCursor) test.skip(true, 'No nextCursor; dataset fits one page.');

    const second = await api.audit.listAuditPage({ limit: 5, cursor: first.nextCursor as string });
    expect(Array.isArray(second.data)).toBe(true);
    expect(second.data.length).toBeLessThanOrEqual(5);

    const firstIds = new Set<string>();
    for (const row of first.data) {
      if (row && typeof row === 'object' && 'id' in row) firstIds.add(String((row as Record<string, unknown>).id));
    }
    for (const row of second.data) {
      if (row && typeof row === 'object' && 'id' in row) {
        expect(firstIds.has(String((row as Record<string, unknown>).id))).toBe(false);
      }
      if (row && typeof row === 'object' && 'accountId' in row && (row as Record<string, unknown>).accountId != null) {
        expect((row as Record<string, unknown>).accountId).toBe(APPROVED_ORG);
      }
    }
  });
});
