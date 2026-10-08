import { APPROVED_ORG } from '../config/env.ts';
import { jsonRequest, object, HttpFailure } from './transport.ts';
import { AuthenticationRequiredError } from '../auth/session-guard.ts';

export class AnalyticsClient {
  private readonly base: string;
  private readonly headers: Record<string, string>;
  private readonly prefix: string;
  constructor(config: { mainBase: string; orgId: string }, headers: Record<string, string>) {
    if (config.orgId !== APPROVED_ORG) throw new Error('Unauthorized organization.');
    this.base = config.mainBase; this.headers = headers;
    this.prefix = `/v1/org/${APPROVED_ORG}/analytics`;
  }
  async getOverview(query: { from?: string; to?: string; timezone?: string } = {}, timeoutMs?: number) {
    const params = new URLSearchParams();
    if (query.from) params.set('fromDate', query.from);
    if (query.to) params.set('toDate', query.to);
    if (query.timezone) params.set('tz', query.timezone);
    const qs = params.toString();
    return object(await this.read(`${this.prefix}/overview${qs ? `?${qs}` : ''}`, timeoutMs));
  }
  // Thin alias that forces the tz param so the test can exercise the timezone branch
  // of neo's overview validator (overviewQuerySchema accepts `tz`).
  async getOverviewWithTimezone(query: { from: string; to: string; timezone: string }, timeoutMs?: number) {
    return this.getOverview(query, timeoutMs);
  }
  // Sequential multi-window helper. The suite stays serial (workers=1), so these
  // run one after the other and give the test a chance to compare counts/shape.
  async getOverviewMultiRange(input: { windows: Array<{ from: string; to: string }>; timezone?: string }, timeoutMs?: number) {
    const results = [];
    for (const window of input.windows) {
      results.push(await this.getOverview({ from: window.from, to: window.to, timezone: input.timezone }, timeoutMs));
    }
    return results;
  }
  private async read(path: string, timeoutMs?: number) {
    try { return await jsonRequest(this.base, path, this.headers, 'GET', undefined, timeoutMs); }
    catch (error) {
      if (error instanceof HttpFailure && error.status === 401) throw new AuthenticationRequiredError();
      throw error;
    }
  }
}
