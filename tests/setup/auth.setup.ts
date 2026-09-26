import { test } from '../../src/fixtures/test.ts';
test('approved organization session is valid', async ({ helpdeskPage }) => {
  await helpdeskPage.assertLoaded();
});
