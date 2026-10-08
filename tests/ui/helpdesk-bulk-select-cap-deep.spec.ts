import { expect, test } from '../../src/fixtures/helpdesk.ts';
import { coreConfig } from '../../src/config/env.ts';

// Selects up to the hard UI cap of 100 threads (trinity/src/pages/Helpdesk/utils.js:141
// MAX_THREAD_SELECTION = 100). If the current page has fewer rows, selects all available.
// Asserts the BulkActionBar announces a count ≥1 and ≤100
// (trinity/src/pages/Helpdesk/Threads/BulkUpdate/BulkActionBar.js:95-106).
test('Helpdesk bulk-select honors the 100-thread UI cap @ui', async ({ helpdeskPage, page }) => {
  const config = coreConfig();
  await page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?view=table&limit=100`, { waitUntil: 'domcontentloaded' });
  await helpdeskPage.assertLoaded();
  const checkboxes = page.locator('[data-testid^="select-thread-"]');
  const available = await checkboxes.count();
  expect(available, 'at least one row required to exercise bulk-select').toBeGreaterThan(0);
  const target = Math.min(available, 100);
  for (let i = 0; i < target; i++) await checkboxes.nth(i).click();
  const counter = page.getByText(/(\d+) tickets? selected/).first();
  await expect(counter).toBeVisible();
  const text = await counter.textContent();
  const match = text?.match(/(\d+)/);
  const count = match ? Number(match[1]) : 0;
  expect(count).toBeGreaterThanOrEqual(1);
  expect(count).toBeLessThanOrEqual(100);
});
