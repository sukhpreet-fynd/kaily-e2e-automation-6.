import { test } from '../../src/fixtures/helpdesk.ts';

// Trinity labels this "Automations" in the UI; the route is still /settings/routing.
test('Routing (Automations) settings loads for authenticated session @ui', async ({ routingRulesPage }) => {
  await routingRulesPage.goto();
  await routingRulesPage.expectLoaded();
});
