import { test as base, expect } from '@playwright/test';
import { HealthClient } from '../../src/api/health-client.ts';

const baseURL = process.env.KAILY_MAIN_API_BASE_URL?.trim();

base.describe.serial('Health concurrent (deep)', () => {
  base.skip(!baseURL, 'KAILY_MAIN_API_BASE_URL is not set; concurrent health probe skipped.');
  const client = new HealthClient(baseURL ?? 'https://invalid.invalid');

  base('5 concurrent _healthz calls return 200 in <2000ms total @api', async () => {
    const started = Date.now();
    const bodies = await Promise.all([
      client.healthz(), client.healthz(), client.healthz(), client.healthz(), client.healthz()
    ]);
    const elapsed = Date.now() - started;
    expect(bodies).toHaveLength(5);
    for (const body of bodies) {
      expect(typeof body).toBe('object');
    }
    expect(elapsed).toBeLessThan(2000);
  });
});
