import { test, expect } from '../../src/fixtures/api.ts';

// Keys shape per neo developers.route.js:serializeKey — explicitly excludes any
// hash or secret material. We assert the schema and double-check no field name
// smelling of secrets is present.
const SECRET_FIELD_NAMES = new Set(['token', 'secret', 'hash', 'secretKey', 'apiSecret', 'rawKey']);

test.describe.serial('Developers API shape (deep)', () => {
  test('GET /developers/scopes returns scopes[] + presets object @api', async ({ api }) => {
    const body = await api.developers.listScopes();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body.scopes)).toBe(true);
    // neo defines ALL_SCOPES as a plain string array (e.g. 'aiagents:read'),
    // so we only assert each scope is a non-empty string.
    for (const scope of body.scopes as unknown[]) {
      expect(typeof scope).toBe('string');
      expect((scope as string).length).toBeGreaterThan(0);
    }
    // presets may be an object (preset-name -> scopes[]) or an array of preset
    // records depending on future rollout; both are allowed.
    expect(body.presets != null).toBe(true);
    expect(typeof body.presets).toBe('object');
  });

  test('GET /developers/keys returns keys[] with no secret material leaked @api', async ({ api }) => {
    const body = await api.developers.listKeys();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body.keys)).toBe(true);
    for (const key of body.keys as unknown[]) {
      expect(key && typeof key === 'object').toBe(true);
      const row = key as Record<string, unknown>;
      expect(typeof row.id).toBe('string');
      expect(typeof row.name).toBe('string');
      for (const field of SECRET_FIELD_NAMES) {
        expect(Object.prototype.hasOwnProperty.call(row, field)).toBe(false);
      }
    }
  });
});
