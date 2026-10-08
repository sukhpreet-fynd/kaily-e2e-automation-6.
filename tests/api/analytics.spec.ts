import { test, expect } from '../../src/fixtures/api.ts';

test.describe.serial('Analytics API', () => {
  test('GET overview with a 7-day window @api', async ({ api }) => {
    const to = new Date();
    const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fromDate = from.toISOString().slice(0, 10);
    const toDate = to.toISOString().slice(0, 10);
    const overview = await api.analytics.getOverview({ from: fromDate, to: toDate, timezone: 'Asia/Kolkata' });
    expect(typeof overview).toBe('object');
  });
});
