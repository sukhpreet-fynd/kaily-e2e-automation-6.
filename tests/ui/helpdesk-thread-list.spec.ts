import { expect, test } from '../../src/fixtures/helpdesk.ts';
import { coreConfig } from '../../src/config/env.ts';

test('Helpdesk thread list renders, accepts search, opens filters @ui', async ({ helpdeskPage, page }) => {
  const config = coreConfig();
  await page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?view=table`, { waitUntil: 'domcontentloaded' });
  await helpdeskPage.assertLoaded();
  await expect(helpdeskPage.threadRows().first()).toBeVisible();
  await helpdeskPage.searchFor('qa-ui-sanity');
  await helpdeskPage.openFiltersPanel();
});
