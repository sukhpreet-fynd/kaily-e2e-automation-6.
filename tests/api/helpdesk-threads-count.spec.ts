import { test, expect } from '../../src/fixtures/api.ts';

// Separate spec file so count-only probes run with their own rate-limit budget.
test.describe.serial('Helpdesk thread count API', () => {
  test('GET /threads/count unfiltered returns non-negative integer @api', async ({ api }) => {
    const body = await api.helpdesk.countThreads({});
    expect(typeof body).toBe('object');
    expect(typeof body.count).toBe('number');
    expect(Number.isInteger(body.count)).toBe(true);
    expect(body.count as number).toBeGreaterThanOrEqual(0);
  });

  test('GET /threads/count with status=open returns non-negative integer @api', async ({ api }) => {
    const body = await api.helpdesk.countThreads({ status: ['open'] });
    expect(typeof body.count).toBe('number');
    expect(Number.isInteger(body.count)).toBe(true);
    expect(body.count as number).toBeGreaterThanOrEqual(0);
  });
});
