import { expect, type Page } from '@playwright/test';
import { coreConfig } from '../../config/env.ts';

// Trinity exposes ticket statuses as choices on the Status ticket-field; the dedicated settings
// screen is "Ticket Fields" (trinity/src/pages/Helpdesk/Settings/index.js:220-227, mounted at
// `/settings/ticket-fields` per index.js:396). No standalone /ticket-statuses route exists.
export class TicketStatusesPage {
  private readonly page: Page;
  constructor(page: Page) { this.page = page; }
  async goto() {
    const config = coreConfig();
    await this.page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk/settings/ticket-fields`, { waitUntil: 'domcontentloaded' });
  }
  // trinity/src/pages/Helpdesk/Settings/TicketFields/index.js:898 — data-testid="field-left-panel".
  async expectLoaded() {
    await expect(this.page.getByTestId('field-left-panel')).toBeVisible();
  }
}
