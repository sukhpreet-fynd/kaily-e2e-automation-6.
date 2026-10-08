import { test } from '../../src/fixtures/ui.ts';
test('Insights dashboard loads for authenticated session @ui', async ({ insightsPage }) => {
  await insightsPage.goto();
  await insightsPage.expectLoaded();
});
