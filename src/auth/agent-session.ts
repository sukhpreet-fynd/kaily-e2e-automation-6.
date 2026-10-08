import type { Page } from '@playwright/test';
import { apiConfig } from '../config/env.ts';
import { HelpdeskClient } from '../api/helpdesk-client.ts';
import { makeApiClients, type ApiClients } from '../api/client-factory.ts';
import { AuthenticationRequiredError, withSessionGuard } from './session-guard.ts';

export async function openAgentSession(page: Page): Promise<HelpdeskClient> {
  return withSessionGuard(page, async () => (await loadApiSession(page)).helpdesk);
}

export async function openApiSession(page: Page): Promise<ApiClients> {
  return withSessionGuard(page, () => loadApiSession(page));
}

async function loadApiSession(page: Page): Promise<ApiClients> {
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
  const headers: Record<string, string> = { authorization: all.authorization };
  // Credentials stay in memory; neither the request nor headers are attached to reports.
  for (const key of ['cookie', 'boltic-ssid']) if (all[key]) headers[key] = all[key];
  const clients = makeApiClients(config, headers);
  await clients.helpdesk.listThreads();
  return clients;
}
