import { APPROVED_ORG } from '../config/env.ts';
import { jsonRequest, items, object, HttpFailure } from './transport.ts';
import { AuthenticationRequiredError } from '../auth/session-guard.ts';

// Verified neo routes (nested under /copilotapps/:id):
//   GET /actions                -> copilotapps/actions.route.js
//   GET /topics                 -> copilotapps/topics/root.route.js (returns bare array)
//   GET /memory?userId=...      -> copilotapps/memory.route.js (userId required)
//   GET /traces                 -> copilotapps/traces.route.js
//   GET /variables              -> copilotapps.route.js (returns { data: [...] })
//   GET /sentiment              -> copilotapps.route.js (startDate/endDate)
// No top-level /actions-tools route is modelled here; /tools is a sub-route of actions.

export class AgentsClient {
  private readonly base: string;
  private readonly headers: Record<string, string>;
  private readonly prefix: string;
  constructor(config: { mainBase: string; orgId: string }, headers: Record<string, string>) {
    if (config.orgId !== APPROVED_ORG) throw new Error('Unauthorized organization.');
    this.base = config.mainBase; this.headers = headers;
    this.prefix = `/v1/org/${APPROVED_ORG}`;
  }
  async listCopilotApps(query: { limit?: number; active?: boolean } = {}, timeoutMs?: number) {
    const params = new URLSearchParams({ limit: String(query.limit ?? 20) });
    if (query.active != null) params.set('active', String(query.active));
    return items(await this.read(`${this.prefix}/copilotapps?${params}`, timeoutMs));
  }
  async getCopilotApp(id: string, timeoutMs?: number) {
    return object(await this.read(`${this.appPath(id)}`, timeoutMs));
  }
  async getAgentStats(id: string, timeoutMs?: number) {
    return object(await this.read(`${this.appPath(id)}/stats`, timeoutMs));
  }
  async listAgentIntegrations(appId: string, timeoutMs?: number) {
    return items(await this.read(`${this.appPath(appId)}/integrations`, timeoutMs));
  }
  async listAgentSurfaces(appId: string, timeoutMs?: number) {
    return object(await this.read(`${this.appPath(appId)}/surfaces`, timeoutMs));
  }
  async listAgentTopics(appId: string, timeoutMs?: number) {
    return object(await this.read(`${this.appPath(appId)}/topics`, timeoutMs));
  }
  // Returns raw unknown so specs can handle both {items,page} and bare arrays.
  async getActions(appId: string, timeoutMs?: number): Promise<unknown> {
    return this.read(`${this.appPath(appId)}/actions`, timeoutMs);
  }
  // Topics returns a bare array per neo topics/root.route.js.
  async getTopics(appId: string, timeoutMs?: number): Promise<unknown> {
    return this.read(`${this.appPath(appId)}/topics`, timeoutMs);
  }
  // Memory requires a userId; without one neo returns 400. Specs soft-skip.
  async getMemory(appId: string, query: { userId?: string } = {}, timeoutMs?: number): Promise<unknown> {
    const params = new URLSearchParams();
    if (query.userId) params.set('userId', query.userId);
    const qs = params.toString();
    return this.read(`${this.appPath(appId)}/memory${qs ? `?${qs}` : ''}`, timeoutMs);
  }
  async getTraces(appId: string, query: { limit?: number } = {}, timeoutMs?: number): Promise<unknown> {
    const params = new URLSearchParams();
    if (query.limit != null) params.set('limit', String(query.limit));
    const qs = params.toString();
    return this.read(`${this.appPath(appId)}/traces${qs ? `?${qs}` : ''}`, timeoutMs);
  }
  async getVariables(appId: string, timeoutMs?: number) {
    return object(await this.read(`${this.appPath(appId)}/variables`, timeoutMs));
  }
  async getSentiment(appId: string, query: { from?: string; to?: string } = {}, timeoutMs?: number) {
    const params = new URLSearchParams();
    if (query.from) params.set('startDate', query.from);
    if (query.to) params.set('endDate', query.to);
    const qs = params.toString();
    return object(await this.read(`${this.appPath(appId)}/sentiment${qs ? `?${qs}` : ''}`, timeoutMs));
  }
  private async read(path: string, timeoutMs?: number) {
    try { return await jsonRequest(this.base, path, this.headers, 'GET', undefined, timeoutMs); }
    catch (error) {
      if (error instanceof HttpFailure && error.status === 401) throw new AuthenticationRequiredError();
      throw error;
    }
  }
  private appPath(appId: string) { return `${this.prefix}/copilotapps/${encodeURIComponent(appId)}`; }
}
