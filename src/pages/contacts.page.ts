import { expect, type Page } from '@playwright/test';
import { coreConfig } from '../config/env.ts';

export class ContactsPage {
  private readonly page: Page;
  constructor(page: Page) { this.page = page; }
  async goto() {
    const config = coreConfig();
    await this.page.goto(`${config.baseURL}accounts/${config.orgId}/contacts`, { waitUntil: 'domcontentloaded' });
  }
  // trinity/src/pages/Helpdesk/Contacts/index.js:583 — <ContentContainer data-testid="contacts-content">
  // and :551 — <MobileListToolbar data-testid="contacts-mobile-toolbar">
  async expectLoaded() {
    const anchor = this.page.getByTestId('contacts-content').or(this.page.getByTestId('contacts-mobile-toolbar'));
    await expect(anchor.first()).toBeVisible();
  }
}
