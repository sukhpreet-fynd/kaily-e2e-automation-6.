import type { BrowserContext } from '@playwright/test';
import { APPROVED_ORG } from '../config/env.ts';

export function isOtherOrganization(rawUrl: string): boolean {
  const path = decodeURIComponent(new URL(rawUrl).pathname);
  const match = path.match(/\/(?:accounts|v1\/org|token)\/([^/]+)/);
  return Boolean(match && match[1] !== APPROVED_ORG);
}

export async function installOrganizationGuard(context: BrowserContext) {
  await context.route('**/*', async route => {
    try {
      if (isOtherOrganization(route.request().url())) return await route.abort('blockedbyclient');
    } catch { return await route.abort('blockedbyclient'); }
    await route.continue();
  });
}
