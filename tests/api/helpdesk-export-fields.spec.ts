import { test, expect } from '../../src/fixtures/api.ts';

// neo returns { fields: [{ key, label, defaultChecked }, ...] }. The list is a
// concatenation of system EXPORT_FIELDS and non-archived custom ticket fields.
// We require the array and at least one well-known system field to be present.
const SYSTEM_FIELD_KEYS = new Set([
  'ticketId', 'referenceNumber', 'subject', 'description', 'status', 'priority',
  'channel', 'group', 'requesterName', 'requesterEmail', 'agent',
  'createdTime', 'lastUpdatedTime', 'product'
]);

test.describe.serial('Helpdesk export fields API', () => {
  test('GET /threads/export/fields returns system and (optionally) custom entries @api', async ({ api }) => {
    const body = await api.helpdesk.exportFields();
    expect(Array.isArray(body.fields)).toBe(true);
    const fields = body.fields as Array<Record<string, unknown>>;
    expect(fields.length).toBeGreaterThan(0);
    let systemHits = 0;
    for (const field of fields) {
      expect(typeof field.key).toBe('string');
      expect(typeof field.label).toBe('string');
      expect(typeof field.defaultChecked).toBe('boolean');
      if (SYSTEM_FIELD_KEYS.has(String(field.key))) systemHits += 1;
    }
    expect(systemHits).toBeGreaterThan(0);
  });
});
