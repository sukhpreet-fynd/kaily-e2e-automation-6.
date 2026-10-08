import { expect, type Page } from '@playwright/test';
import { coreConfig } from '../config/env.ts';

export class TeamsPage {
  private readonly page: Page;
  constructor(page: Page) { this.page = page; }
  async goto() {
    const config = coreConfig();
    await this.page.goto(`${config.baseURL}accounts/${config.orgId}/account/teams`, { waitUntil: 'domcontentloaded' });
  }
  // No stable data-testid wraps the Teams list.
  // trinity/src/pages/Settings/Teams/TeamList/index.js:311 renders <Body_S_Bold>Team</Body_S_Bold>
  // in the header; use that as the landmark.
  async expectLoaded() {
    await expect(this.page.getByText('Team', { exact: true }).first()).toBeVisible();
  }
}
