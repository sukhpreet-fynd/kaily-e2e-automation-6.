import { test } from '../../src/fixtures/helpdesk.ts';
import { coreConfig } from '../../src/config/env.ts';

// Selects 2-3 rows via per-row checkboxes and asserts the bulk action bar announces the selection.
// NEVER triggers Close/Bulk Update/Assign — those are mutations.
test('Helpdesk bulk-select reveals selection toolbar without mutating @ui', async ({ helpdeskPage, page }) => {
  const config = coreConfig();
  await page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?view=table`, { waitUntil: 'domcontentloaded' });
  await helpdeskPage.assertLoaded();
  await helpdeskPage.selectThreadsForBulk(2);
});
