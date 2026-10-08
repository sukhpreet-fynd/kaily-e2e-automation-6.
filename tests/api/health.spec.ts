import { test as base, expect } from '@playwright/test';
import { HealthClient } from '../../src/api/health-client.ts';

const baseURL = process.env.KAILY_MAIN_API_BASE_URL?.trim();

base.describe.serial('API health probes', () => {
  base.skip(!baseURL, 'KAILY_MAIN_API_BASE_URL is not set; health probes skipped.');
  const client = new HealthClient(baseURL ?? 'https://invalid.invalid');

  base('GET /_healthz @api', async () => {
    const body = await client.healthz();
    expect(typeof body).toBe('object');
  });
  base('GET /_livez @api', async () => {
    const body = await client.livez();
    expect(typeof body).toBe('object');
  });
  base('GET /_readyz @api', async () => {
    const body = await client.readyz();
    expect(typeof body).toBe('object');
  });
});
