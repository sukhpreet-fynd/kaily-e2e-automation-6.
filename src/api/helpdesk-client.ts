import { APPROVED_ORG } from '../config/env.ts';
import { jsonRequest, items, object, type JsonObject } from './transport.ts';

export class HelpdeskClient {
  private readonly base: string;
  private readonly headers: Record<string, string>;
  private readonly prefix: string;
  constructor(config: { mainBase: string; orgId: string }, headers: Record<string, string>) {
    if (config.orgId !== APPROVED_ORG) throw new Error('Unauthorized organization.');
    this.base = config.mainBase; this.headers = headers;
    this.prefix = `/v1/org/${APPROVED_ORG}`;
  }
  async listThreads(query: { id?: string } = {}, timeoutMs?: number) {
    return items(await jsonRequest(this.base, `${this.prefix}/threads?${new URLSearchParams({ limit: '20', ...query })}`, this.headers, 'GET', undefined, timeoutMs));
  }
  async thread(id: string, timeoutMs?: number) {
    return object(await jsonRequest(this.base, `${this.prefix}/threads/${encodeURIComponent(id)}`, this.headers, 'GET', undefined, timeoutMs));
  }
  async messages(appId: string, threadId: string, timeoutMs?: number) {
    return items(await jsonRequest(this.base, `${this.appPath(appId)}/threads/${encodeURIComponent(threadId)}/messages`, this.headers, 'GET', undefined, timeoutMs));
  }
  async verifyIntegration(appId: string, integrationId: string, expectedToken: string): Promise<void> {
    const integration: JsonObject = object(await jsonRequest(this.base,
      `${this.appPath(appId)}/integrations/${encodeURIComponent(integrationId)}`, this.headers));
    const needed = ['users/create', 'conversations/create', 'conversations/messages/create'];
    if (integration.id !== integrationId || integration.copilotAppId !== appId || integration.active !== true ||
        integration.token !== expectedToken || !Array.isArray(integration.operations) ||
        !needed.every(op => (integration.operations as unknown[]).includes(op))) {
      throw new Error('Integration ownership, credential or operation preflight failed; no writes allowed.');
    }
  }
  private appPath(appId: string) { return `${this.prefix}/copilotapps/${encodeURIComponent(appId)}`; }
}
