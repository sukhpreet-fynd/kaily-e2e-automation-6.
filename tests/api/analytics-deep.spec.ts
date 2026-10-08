import { test, expect } from '../../src/fixtures/api.ts';

const dateOnly = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (days: number) => {
  const d = new Date(); d.setUTCDate(d.getUTCDate() - days); return d;
};

test.describe.serial('Analytics overview (deep)', () => {
  test('runs two time windows (7d then 30d) sequentially @api', async ({ api }) => {
    const now = new Date();
    const results = await api.analytics.getOverviewMultiRange({
      windows: [
        { from: dateOnly(daysAgo(7)), to: dateOnly(now) },
        { from: dateOnly(daysAgo(30)), to: dateOnly(now) }
      ],
      timezone: 'Asia/Kolkata'
    });
    expect(results).toHaveLength(2);
    for (const body of results) {
      expect(body).not.toBeNull();
      expect(typeof body).toBe('object');
    }
  });

  test('explicit tz=America/New_York does not error and returns an object @api', async ({ api }) => {
    const now = new Date();
    const body = await api.analytics.getOverviewWithTimezone({
      from: dateOnly(daysAgo(7)), to: dateOnly(now), timezone: 'America/New_York'
    });
    expect(typeof body).toBe('object');
  });
});
