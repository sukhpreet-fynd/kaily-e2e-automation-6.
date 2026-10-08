import type { Page } from '@playwright/test';
import { apiConfig } from '../config/env.ts';
import { AuthenticationRequiredError, withSessionGuard } from '../auth/session-guard.ts';

// Captures the live Bearer token off the first helpdesk list request. The token
// stays in-memory for the test process and is never attached to traces or logs.
export async function captureBearerForTests(page: Page): Promise<string> {
  return withSessionGuard(page, async () => {
    const config = apiConfig();
    const listPath = `/v1/org/${config.orgId}/threads`;
    const requestPromise = page.waitForRequest(request => {
      const url = new URL(request.url());
      return request.method() === 'GET' && `${url.origin}${url.pathname}` === `${config.mainBase}${listPath}`;
    }, { timeout: 30_000 });
    const [request] = await Promise.all([
      requestPromise,
      page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?view=table`, { waitUntil: 'domcontentloaded' }),
    ]);
    const all = await request.allHeaders();
    if (!all.authorization?.startsWith('Bearer ')) throw new AuthenticationRequiredError('Account bearer token was not available.');
    return all.authorization;
  });
}
