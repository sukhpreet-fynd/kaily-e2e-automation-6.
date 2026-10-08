import { test } from '../../src/fixtures/ui.ts';
test('Contacts page loads for authenticated session @ui', async ({ contactsPage }) => {
  await contactsPage.goto();
  await contactsPage.expectLoaded();
});
