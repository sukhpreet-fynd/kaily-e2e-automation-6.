import { test } from '../../src/fixtures/ui.ts';
test('Teams settings loads for authenticated session @ui', async ({ teamsPage }) => {
  await teamsPage.goto();
  await teamsPage.expectLoaded();
});
