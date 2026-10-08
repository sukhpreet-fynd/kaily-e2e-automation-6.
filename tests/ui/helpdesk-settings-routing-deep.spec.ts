import { expect, test } from '../../src/fixtures/helpdesk.ts';

// Routing (Automations) settings: assert either an automation rule renders or the empty
// state landmark ("No automation rules yet" at
// trinity/src/pages/Helpdesk/Settings/Routing/index.js:591).
test('Routing shows automation rules or empty state landmark @ui', async ({ routingRulesPage, page }) => {
  await routingRulesPage.goto();
  await routingRulesPage.expectLoaded();
  const listOrEmpty = page.getByText('No automation rules yet', { exact: true })
    .or(page.getByText('No ticket update rules', { exact: true }))
    .or(page.getByRole('row').nth(1));
  await expect(listOrEmpty.first()).toBeVisible();
});
