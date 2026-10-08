import { expect, type Page } from '@playwright/test';
import { coreConfig } from '../../config/env.ts';

export class InboxNotificationsPage {
  private readonly page: Page;
  constructor(page: Page) { this.page = page; }
  async goto() {
    const config = coreConfig();
    // trinity/src/pages/Helpdesk/Settings/index.js:407 — <Route path="inbox-notifications">.
    await this.page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk/settings/inbox-notifications`, { waitUntil: 'domcontentloaded' });
  }
  // trinity/src/pages/Helpdesk/Settings/InboxNotifications/index.js:513 — data-testid="inbox-notifications-list"
  // when rules exist; empty state renders only the header, so also anchor on the back-to-settings button.
  async expectLoaded() {
    const anchor = this.page.getByTestId('inbox-notifications-list')
      .or(this.page.getByRole('button', { name: 'Back to settings', exact: true }));
    await expect(anchor.first()).toBeVisible();
  }
}
