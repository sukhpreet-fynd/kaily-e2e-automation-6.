import { test } from '../../src/fixtures/helpdesk.ts';

test('Inbox Notifications settings loads for authenticated session @ui', async ({ inboxNotificationsPage }) => {
  await inboxNotificationsPage.goto();
  await inboxNotificationsPage.expectLoaded();
});
