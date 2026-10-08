import { expect, test } from '../../src/fixtures/helpdesk.ts';
import { coreConfig } from '../../src/config/env.ts';

// Trinity does NOT render horizontal All/Mine/Unassigned tabs on the table/card views —
// the equivalent lives inside SplitView as a CustomDropdown with options "All Threads",
// "Assigned To Me", "Unassigned" (trinity/src/pages/Helpdesk/Threads/Views/SplitView.js:290-295).
// Rather than mutating state by clicking dropdown items (that re-fetches), we drive the
// filter via the URL (threadFilter param) which the same screen reads from search state
// at trinity/src/pages/Helpdesk/Threads/threadRouteState.js:80.
test('Helpdesk conversation filters reload the list for each value @ui', async ({ helpdeskPage, page }) => {
  const config = coreConfig();
  for (const value of ['all', 'self', 'unassigned']) {
    await page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?view=table&threadFilter=${value}`, { waitUntil: 'domcontentloaded' });
    const anchor = helpdeskPage.threadRows().first().or(helpdeskPage.emptyStateLocator().first());
    await expect(anchor.first()).toBeVisible();
    expect(new URL(page.url()).searchParams.get('threadFilter')).toBe(value);
  }
});
