import { test } from '@playwright/test';
import { installOrganizationGuard } from '../../src/auth/scope.ts';
import { enterKaily } from '../../src/auth/enter-kaily.ts';
test('MFA session enters the approved Kaily organization', async ({ page, context }) => {
  await installOrganizationGuard(context);
  await enterKaily(page);
});
