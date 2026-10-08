import { expect, test } from '../../src/fixtures/helpdesk.ts';
import { coreConfig } from '../../src/config/env.ts';

// Verifies filter query params survive navigation and the list still renders.
// threadFilter and priority are both legal keys per
// trinity/src/pages/Helpdesk/Threads/threadRouteState.js:78-86,111-125.
test('Helpdesk preserves status + priority filters in URL state @ui', async ({ helpdeskPage, page }) => {
  const config = coreConfig();
  const query = 'view=table&threadFilter=open&priority=high';
  await page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?${query}`, { waitUntil: 'domcontentloaded' });
  const search = helpdeskPage.urlFilterState();
  expect(search).toContain('threadFilter=open');
  expect(search).toContain('priority=high');
  // The list should either render rows or the empty-state landmark; both prove the page did not crash.
  const anchor = helpdeskPage.threadRows().first().or(helpdeskPage.emptyStateLocator().first());
  await expect(anchor.first()).toBeVisible();
});
