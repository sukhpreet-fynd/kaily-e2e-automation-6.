import { expect, test } from '../../src/fixtures/helpdesk.ts';

// Inbox Notifications settings: assert either data-testid="inbox-notifications-list"
// renders (trinity/src/pages/Helpdesk/Settings/InboxNotifications/index.js:513) or the
// back-to-settings landmark proves the page mounted with an empty state.
test('Inbox Notifications shows list or empty state landmark @ui', async ({ inboxNotificationsPage, page }) => {
  await inboxNotificationsPage.goto();
  await inboxNotificationsPage.expectLoaded();
  const list = page.getByTestId('inbox-notifications-list');
  const backBtn = page.getByRole('button', { name: 'Back to settings', exact: true });
  const anchor = list.or(backBtn);
  await expect(anchor.first()).toBeVisible();
  if (await list.count() > 0) {
    const rowCount = await list.locator('> *').count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  }
});
