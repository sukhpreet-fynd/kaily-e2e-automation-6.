import { test, expect } from '../../src/fixtures/api.ts';

// Health contract. Neo's _healthz historically returns { ok: 'ok' } exactly
// and the service treats that as the invariant orchestrators probe for. We
// assert the full shape (no extra required keys, exact value) because a
// drift here would silently break downstream readiness logic.
test.describe.serial('Contract: health', () => {
  test('_healthz returns { ok: "ok" } exactly @contract', async ({ api }) => {
    const body = await api.health.healthz();
    expect(body).toEqual({ ok: 'ok' });
  });
});
