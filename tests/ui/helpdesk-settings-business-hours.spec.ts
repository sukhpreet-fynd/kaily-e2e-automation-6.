import { test } from '../../src/fixtures/helpdesk.ts';

test('Business Hours settings loads for authenticated session @ui', async ({ businessHoursPage }) => {
  await businessHoursPage.goto();
  await businessHoursPage.expectLoaded();
});
