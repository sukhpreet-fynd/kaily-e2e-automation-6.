import { expect, type Page } from '@playwright/test';
import { coreConfig } from '../../config/env.ts';

// Trinity exposes "custom fields" as per-entity screens; the contact-side route is `/settings/contact-fields`
// (trinity/src/pages/Helpdesk/Settings/index.js:399). There is no `/settings/custom-fields` route.
export class CustomFieldsPage {
  private readonly page: Page;
  constructor(page: Page) { this.page = page; }
  async goto() {
    const config = coreConfig();
    await this.page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk/settings/contact-fields`, { waitUntil: 'domcontentloaded' });
  }
  // trinity/src/pages/Helpdesk/Settings/ContactFields/index.js:545 — data-testid="field-left-panel".
  async expectLoaded() {
    await expect(this.page.getByTestId('field-left-panel')).toBeVisible();
  }
}
