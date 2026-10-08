import { expect, test } from '../../src/fixtures/helpdesk.ts';
import { coreConfig } from '../../src/config/env.ts';

// Applies a far-future custom date range to force zero results, then asserts the
// NoDataFound empty state renders (trinity/src/pages/Helpdesk/Threads/index.js:1768-1773)
// and the URL preserves the filter params unchanged.
test('Helpdesk shows empty state and preserves date filter in URL @ui', async ({ helpdeskPage, page }) => {
  const config = coreConfig();
  const query = 'view=table&date=Custom&startDate=2099-01-01&endDate=2099-01-02';
  await page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?${query}`, { waitUntil: 'domcontentloaded' });
  await expect(helpdeskPage.emptyStateLocator().first()).toBeVisible();
  const url = new URL(page.url());
  expect(url.searchParams.get('startDate')).toBe('2099-01-01');
  expect(url.searchParams.get('endDate')).toBe('2099-01-02');
  expect(url.searchParams.get('date')).toBe('Custom');
});
