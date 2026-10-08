import { expect, type Page } from '@playwright/test';
import { coreConfig } from '../../config/env.ts';

// Trinity labels the automation/routing settings as "Automations" but the route is still `/settings/routing`
// (trinity/src/pages/Helpdesk/Settings/index.js:400). The brief's "routing-rules" maps to this screen.
export class RoutingRulesPage {
  private readonly page: Page;
  constructor(page: Page) { this.page = page; }
  async goto() {
    const config = coreConfig();
    await this.page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk/settings/routing`, { waitUntil: 'domcontentloaded' });
  }
  // trinity/src/pages/Helpdesk/Settings/Routing/index.js:553 — <Body_S_Bold>Automations</Body_S_Bold>.
  async expectLoaded() {
    const anchor = this.page.getByRole('button', { name: 'Back to settings', exact: true })
      .or(this.page.getByText('Automations', { exact: true }).first());
    await expect(anchor.first()).toBeVisible();
  }
}
