import type { Page } from '@playwright/test';
import { apiConfig } from '../config/env.ts';
import { HelpdeskClient } from '../api/helpdesk-client.ts';

export async function openAgentSession(page: Page): Promise<HelpdeskClient> {
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
  if (!all.authorization?.startsWith('Bearer ')) throw new Error('No account bearer token observed. Renew the approved agent session.');
  const headers: Record<string, string> = { authorization: all.authorization };
  // Credentials stay in memory; neither the request nor headers are attached to reports.
  for (const key of ['cookie', 'boltic-ssid']) if (all[key]) headers[key] = all[key];
  const client = new HelpdeskClient(config, headers);
  await client.listThreads();
  return client;
}
