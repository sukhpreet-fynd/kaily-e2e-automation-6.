import { expect, type Page, type Locator } from '@playwright/test';
import { coreConfig } from '../config/env.ts';

export class AgentsPage {
  private readonly page: Page;
  constructor(page: Page) { this.page = page; }
  async goto() {
    const config = coreConfig();
    await this.page.goto(`${config.baseURL}accounts/${config.orgId}/cp`, { waitUntil: 'domcontentloaded' });
  }
  // trinity/src/pages/MyAgents/index.js:1033 — <... data-testid="agent-card-list">
  // and :903 — <MobileListToolbar data-testid="agents-mobile-toolbar">
  async expectLoaded() {
    const anchor = this.page.getByTestId('agent-card-list').or(this.page.getByTestId('agents-mobile-toolbar'));
    await expect(anchor.first()).toBeVisible();
  }
  // trinity/src/pages/MyAgents/index.js:746 — data-testid={`agent-card-${agent.id}`}
  agentRows(): Locator {
    return this.page.locator('[data-testid^="agent-card-"]:not([data-testid="agent-card-list"])');
  }
}
