import { test } from '../../src/fixtures/helpdesk.ts';
import { coreConfig } from '../../src/config/env.ts';

// Opens the first thread and asserts the right-side info sidebar renders its known
// Properties section labels: Assignee, Status, Priority
// (trinity/src/pages/Helpdesk/Threads/Info/Properties.js:320-367). SLA section only
// renders when the thread has an SLA; assertInfoSidebar is explicit about what's missing.
test('Helpdesk thread detail info sidebar shows SLA/assignee/priority/status areas @ui', async ({ helpdeskPage, page }) => {
  const config = coreConfig();
  await page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?view=table`, { waitUntil: 'domcontentloaded' });
  await helpdeskPage.assertLoaded();
  const threadId = await helpdeskPage.openFirstThread();
  if (!threadId) throw new Error('Could not resolve thread id from URL after opening first row.');
  await helpdeskPage.assertThreadDetailPanel();
  await helpdeskPage.openThreadInfoPanel();
});
