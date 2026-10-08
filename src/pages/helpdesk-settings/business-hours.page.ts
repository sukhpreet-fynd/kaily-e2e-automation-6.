import { expect, type Page } from '@playwright/test';
import { coreConfig } from '../../config/env.ts';

export class BusinessHoursPage {
  private readonly page: Page;
  constructor(page: Page) { this.page = page; }
  async goto() {
    const config = coreConfig();
    // trinity/src/pages/Helpdesk/Settings/index.js:394 — <Route path="business-hours">.
    await this.page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk/settings/business-hours`, { waitUntil: 'domcontentloaded' });
  }
  // trinity/src/pages/Helpdesk/Settings/BusinessHours/index.js:498 — <Body_S_Bold>Business Hours</Body_S_Bold>.
  // No wrapper data-testid on the list screen; detail-page testids (business-hours-name-row, etc.) only
  // mount after drilling into a row and are not reliable landmarks for the index view.
  async expectLoaded() {
    const anchor = this.page.getByRole('button', { name: 'Back to settings', exact: true })
      .or(this.page.getByText('Business Hours', { exact: true }).first());
    await expect(anchor.first()).toBeVisible();
  }
}
