import { test } from '../../src/fixtures/helpdesk.ts';

test('Groups settings loads for authenticated session @ui', async ({ groupsPage }) => {
  await groupsPage.goto();
  await groupsPage.expectLoaded();
});
