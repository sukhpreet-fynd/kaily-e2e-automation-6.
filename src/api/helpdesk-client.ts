import { APPROVED_ORG } from '../config/env.ts';
import { jsonRequest, items, object, HttpFailure, type JsonObject } from './transport.ts';
import { AuthenticationRequiredError } from '../auth/session-guard.ts';

// Thread filter query shape. Only fields exercised in tests are modelled; the
// neo buildFilters accepts csv strings for list-ish values, so we keep the
// client input as string arrays and serialise once.
export type ThreadFilters = {
  status?: string[];
  priority?: string[];
  assigneeIds?: string[];
  surfaces?: string[];
  copilotAppIds?: string[];
  fromDate?: string;
  toDate?: string;
  q?: string;
  limit?: number;
  next?: string;
};

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
    return items(await this.read(`${this.prefix}/threads?${new URLSearchParams({ limit: '20', ...query })}`, timeoutMs));
  }
  async listThreadsFiltered(filters: ThreadFilters = {}, timeoutMs?: number): Promise<{ items: JsonObject[]; next: string | null }> {
    const body = object(await this.read(`${this.prefix}/threads?${this.serialiseFilters(filters)}`, timeoutMs));
    const list = Array.isArray(body.items) ? body.items.map(object) : [];
    const next = typeof body.next === 'string' ? body.next : null;
    return { items: list, next };
  }
  // Cursor pagination exposure. `next` is the opaque cursor returned from a
  // prior page; neo's threads route accepts it via the standard paginationParser.
  async listThreadsPage(query: { limit: number; next?: string }, timeoutMs?: number): Promise<{ items: JsonObject[]; next: string | null }> {
    return this.listThreadsFiltered({ limit: query.limit, next: query.next }, timeoutMs);
  }
  async searchThreads(q: string, limit = 10, timeoutMs?: number): Promise<{ items: JsonObject[]; next: string | null }> {
    return this.listThreadsFiltered({ q, limit }, timeoutMs);
  }
  async listByCopilotApp(appIds: string[], limit = 10, timeoutMs?: number): Promise<{ items: JsonObject[]; next: string | null }> {
    return this.listThreadsFiltered({ copilotAppIds: appIds, limit }, timeoutMs);
  }
  async listByAssignee(staffUserIds: string[], limit = 10, timeoutMs?: number): Promise<{ items: JsonObject[]; next: string | null }> {
    return this.listThreadsFiltered({ assigneeIds: staffUserIds, limit }, timeoutMs);
  }
  async listBySurface(surfaces: string[], limit = 10, timeoutMs?: number): Promise<{ items: JsonObject[]; next: string | null }> {
    return this.listThreadsFiltered({ surfaces, limit }, timeoutMs);
  }
  async combinedFilter(input: { status?: string[]; priority?: string[]; from?: string; to?: string; limit?: number }, timeoutMs?: number):
    Promise<{ items: JsonObject[]; next: string | null }> {
    return this.listThreadsFiltered({
      status: input.status, priority: input.priority,
      fromDate: input.from, toDate: input.to, limit: input.limit ?? 10
    }, timeoutMs);
  }
  async countThreads(filters: ThreadFilters = {}, timeoutMs?: number) {
    return object(await this.read(`${this.prefix}/threads/count?${this.serialiseFilters(filters)}`, timeoutMs));
  }
  async exportFields(timeoutMs?: number) {
    return object(await this.read(`${this.prefix}/threads/export/fields`, timeoutMs));
  }
  // Thread activity feed is nested under copilotapps (verified in neo:
  // app/api/routes/main/v1/org/copilotapps/threads.route.js -> /:threadId/activities).
  // No top-level /threads/{id}/activity route exists.
  async threadActivities(appId: string, threadId: string, timeoutMs?: number) {
    return object(await this.read(
      `${this.appPath(appId)}/threads/${encodeURIComponent(threadId)}/activities`, timeoutMs));
  }
  async thread(id: string, timeoutMs?: number) {
    return object(await this.read(`${this.prefix}/threads/${encodeURIComponent(id)}`, timeoutMs));
  }
  async messages(appId: string, threadId: string, timeoutMs?: number) {
    return items(await this.read(`${this.appPath(appId)}/threads/${encodeURIComponent(threadId)}/messages`, timeoutMs));
  }
  async verifyIntegration(appId: string, integrationId: string, expectedToken: string): Promise<void> {
    const integration: JsonObject = object(await this.read(
      `${this.appPath(appId)}/integrations/${encodeURIComponent(integrationId)}`));
    const needed = ['users/create', 'conversations/create', 'conversations/messages/create'];
    if (integration.id !== integrationId || integration.copilotAppId !== appId || integration.active !== true ||
        integration.token !== expectedToken || !Array.isArray(integration.operations) ||
        !needed.every(op => (integration.operations as unknown[]).includes(op))) {
      throw new Error('Integration ownership, credential or operation preflight failed; no writes allowed.');
    }
  }
  private serialiseFilters(filters: ThreadFilters): URLSearchParams {
    const params = new URLSearchParams();
    if (filters.status?.length) params.set('status', filters.status.join(','));
    if (filters.priority?.length) params.set('priority', filters.priority.join(','));
    if (filters.assigneeIds?.length) params.set('staffUserIds', filters.assigneeIds.join(','));
    if (filters.surfaces?.length) params.set('surfaces', filters.surfaces.join(','));
    if (filters.copilotAppIds?.length) params.set('copilotAppIds', filters.copilotAppIds.join(','));
    if (filters.fromDate) params.set('createdStartDate', filters.fromDate);
    if (filters.toDate) params.set('createdEndDate', filters.toDate);
    if (filters.q) params.set('q', filters.q);
    if (filters.limit != null) params.set('limit', String(filters.limit));
    if (filters.next) params.set('next', filters.next);
    return params;
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
