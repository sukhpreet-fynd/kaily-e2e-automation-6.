import { APPROVED_ORG } from '../config/env.ts';
import { jsonRequest, object, HttpFailure } from './transport.ts';
import { AuthenticationRequiredError } from '../auth/session-guard.ts';

export class AuditClient {
  private readonly base: string;
  private readonly headers: Record<string, string>;
  private readonly prefix: string;
  constructor(config: { mainBase: string; orgId: string }, headers: Record<string, string>) {
    if (config.orgId !== APPROVED_ORG) throw new Error('Unauthorized organization.');
    this.base = config.mainBase; this.headers = headers;
    this.prefix = `/v1/org/${APPROVED_ORG}/audit`;
  }
  async listAudit(query: { limit?: number; cursor?: string } = {}, timeoutMs?: number) {
    const params = new URLSearchParams({ limit: String(query.limit ?? 20) });
    if (query.cursor) params.set('cursor', query.cursor);
    return object(await this.read(`${this.prefix}?${params}`, timeoutMs));
  }
  // Thin pagination helper that normalises the response shape expected by specs:
  // neo returns { data: [...], nextCursor: string|null, total: number }.
  async listAuditPage(query: { limit: number; cursor?: string }, timeoutMs?: number):
    Promise<{ data: unknown[]; nextCursor: string | null; total: number }> {
    const body = await this.listAudit(query, timeoutMs);
    const data = Array.isArray(body.data) ? body.data : [];
    const nextCursor = typeof body.nextCursor === 'string' ? body.nextCursor : null;
    const total = typeof body.total === 'number' ? body.total : 0;
    return { data, nextCursor, total };
  }
  private async read(path: string, timeoutMs?: number) {
    try { return await jsonRequest(this.base, path, this.headers, 'GET', undefined, timeoutMs); }
    catch (error) {
      if (error instanceof HttpFailure && error.status === 401) throw new AuthenticationRequiredError();
      throw error;
    }
  }
}
