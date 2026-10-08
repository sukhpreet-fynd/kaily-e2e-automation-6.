import { expect, test } from '../../src/fixtures/helpdesk.ts';
import { coreConfig } from '../../src/config/env.ts';

// Navigates to ?view=split and asserts both the list sidebar (thread tiles or empty state)
// and the right pane (either a selected-thread detail or the "Choose Conversation" landmark
// at trinity/src/pages/Helpdesk/Threads/Views/SplitView.js:649-657) render.
test('Helpdesk split view renders both list and detail panes @ui', async ({ page }) => {
  const config = coreConfig();
  await page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?view=split`, { waitUntil: 'domcontentloaded' });
  const listSide = page.getByText('All Threads', { exact: true })
    .or(page.getByText('No Conversations Yet', { exact: true }));
  const detailSide = page.getByText('Choose Conversation', { exact: true })
    .or(page.getByPlaceholder('Write a reply…').first());
  await expect(listSide.first()).toBeVisible();
  await expect(detailSide.first()).toBeVisible();
});
