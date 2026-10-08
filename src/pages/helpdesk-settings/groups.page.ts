import { expect, type Page } from '@playwright/test';
import { coreConfig } from '../../config/env.ts';

export class GroupsPage {
  private readonly page: Page;
  constructor(page: Page) { this.page = page; }
  async goto() {
    const config = coreConfig();
    // trinity/src/pages/Helpdesk/Settings/index.js:392 — <Route path="groups">, mounted under /settings/*.
    await this.page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk/settings/groups`, { waitUntil: 'domcontentloaded' });
  }
  // trinity/src/pages/Helpdesk/Settings/Groups/index.js:652 — <Body_S_Bold>Groups</Body_S_Bold>
  // header title (no stable data-testid on the wrapper); fall back to the aria-label on the back arrow.
  async expectLoaded() {
    const anchor = this.page.getByRole('button', { name: 'Back to settings', exact: true })
      .or(this.page.getByText('Groups', { exact: true }).first());
    await expect(anchor.first()).toBeVisible();
  }
}
