import { expect, test } from '../../src/fixtures/helpdesk.ts';

// Business Hours settings: assert either a list row renders or the empty state landmark
// shows ("Set support availability" from trinity/src/pages/Helpdesk/Settings/BusinessHours/index.js:531).
// Does not drill into any row.
test('Business Hours shows list rows or empty state landmark @ui', async ({ businessHoursPage, page }) => {
  await businessHoursPage.goto();
  await businessHoursPage.expectLoaded();
  const listOrEmpty = page.getByRole('row').nth(1)
    .or(page.getByText('Set support availability', { exact: true }));
  await expect(listOrEmpty.first()).toBeVisible();
});
