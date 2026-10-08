import { test } from '../../src/fixtures/ui.ts';
test('API Keys settings loads for authenticated session @ui', async ({ apiKeysPage }) => {
  await apiKeysPage.goto();
  await apiKeysPage.expectLoaded();
});
