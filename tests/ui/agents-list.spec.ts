import { test } from '../../src/fixtures/ui.ts';
test('My Agents list loads for authenticated session @ui', async ({ agentsPage }) => {
  await agentsPage.goto();
  await agentsPage.expectLoaded();
});
