import { expect, type Page } from '@playwright/test';
import { coreConfig } from '../config/env.ts';

export class InsightsPage {
  private readonly page: Page;
  constructor(page: Page) { this.page = page; }
  async goto() {
    const config = coreConfig();
    await this.page.goto(`${config.baseURL}accounts/${config.orgId}/insights`, { waitUntil: 'domcontentloaded' });
  }
  // trinity/src/pages/HomeInsights/index.js:339 — <Wrapper data-testid="home-insights-wrapper">
  async expectLoaded() {
    await expect(this.page.getByTestId('home-insights-wrapper')).toBeVisible();
  }
}
