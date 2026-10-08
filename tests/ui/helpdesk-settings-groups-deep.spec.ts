import { expect, test } from '../../src/fixtures/helpdesk.ts';

// Groups settings: assert either a GroupsTable row renders or the empty-state landmark
// ("Divide team by departments" at trinity/src/pages/Helpdesk/Settings/Groups/index.js:682).
test('Groups shows list rows or empty state landmark @ui', async ({ groupsPage, page }) => {
  await groupsPage.goto();
  await groupsPage.expectLoaded();
  const listOrEmpty = page.getByRole('row').nth(1)
    .or(page.getByText('Divide team by departments', { exact: true }));
  await expect(listOrEmpty.first()).toBeVisible();
});
