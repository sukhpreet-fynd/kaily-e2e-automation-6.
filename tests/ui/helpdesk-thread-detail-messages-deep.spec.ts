import { expect, test } from '../../src/fixtures/helpdesk.ts';
import { coreConfig } from '../../src/config/env.ts';

// Opens the first thread and asserts either a message bubble renders
// (trinity/src/pages/Helpdesk/Threads/Chat/MessageBubble.js:749 data-testid="message-bubble-row")
// or an empty-conversation landmark. Also asserts the composer input is present but does NOT type.
test('Helpdesk thread detail renders messages (or empty) and shows read-only composer @ui', async ({ helpdeskPage, page }) => {
  const config = coreConfig();
  await page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?view=table`, { waitUntil: 'domcontentloaded' });
  await helpdeskPage.assertLoaded();
  const threadId = await helpdeskPage.openFirstThread();
  if (!threadId) throw new Error('Could not resolve thread id from URL after opening first row.');
  const messagesOrEmpty = helpdeskPage.messageBubbles().first()
    .or(page.getByText(/no messages|no conversation/i).first());
  await expect(messagesOrEmpty.first()).toBeVisible();
  await expect(helpdeskPage.composerLocator()).toBeVisible();
});
