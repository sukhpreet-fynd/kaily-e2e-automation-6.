import { test } from '../../src/fixtures/helpdesk.ts';
import { coreConfig } from '../../src/config/env.ts';

test('Helpdesk opens first thread, detail panel renders, back returns to list @ui', async ({ helpdeskPage, page }) => {
  const config = coreConfig();
  await page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?view=table`, { waitUntil: 'domcontentloaded' });
  await helpdeskPage.assertLoaded();
  const threadId = await helpdeskPage.openFirstThread();
  if (!threadId) throw new Error('Could not resolve thread id from URL after opening first row.');
  await helpdeskPage.assertThreadDetailPanel();
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await helpdeskPage.assertLoaded();
});
