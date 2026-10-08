import { expect, type Page } from '@playwright/test';
import { coreConfig } from '../config/env.ts';

export class ApiKeysPage {
  private readonly page: Page;
  constructor(page: Page) { this.page = page; }
  async goto() {
    const config = coreConfig();
    // Real path per trinity/src/pages/Helpdesk/Settings/index.js:405 (<Route path="api-keys">).
    // Task spec referenced /account/api-keys which does not exist in trinity routes.
    await this.page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk/settings/api-keys`, { waitUntil: 'domcontentloaded' });
  }
  // trinity/src/pages/Helpdesk/Settings/ApiKeys/index.js:359 header-create-key-content
  // and :415 empty-create-key-content — one is always rendered.
  async expectLoaded() {
    const anchor = this.page.getByTestId('header-create-key-content').or(this.page.getByTestId('empty-create-key-content'));
    await expect(anchor.first()).toBeVisible();
  }
}
