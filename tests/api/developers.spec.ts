import { test, expect } from '../../src/fixtures/api.ts';

test.describe.serial('Developers API', () => {
  test('GET scopes @api', async ({ api }) => {
    const body = await api.developers.listScopes();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body.scopes)).toBe(true);
  });

  test('GET keys list @api', async ({ api }) => {
    const body = await api.developers.listKeys();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body.keys)).toBe(true);
    expect((body.keys as unknown[]).length).toBeGreaterThanOrEqual(0);
  });
});
