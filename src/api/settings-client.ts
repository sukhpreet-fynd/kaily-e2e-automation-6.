import { APPROVED_ORG } from '../config/env.ts';
import { jsonRequest, object, HttpFailure } from './transport.ts';
import { AuthenticationRequiredError } from '../auth/session-guard.ts';

export class SettingsClient {
  private readonly base: string;
  private readonly headers: Record<string, string>;
  private readonly prefix: string;
  constructor(config: { mainBase: string; orgId: string }, headers: Record<string, string>) {
    if (config.orgId !== APPROVED_ORG) throw new Error('Unauthorized organization.');
    this.base = config.mainBase; this.headers = headers;
    this.prefix = `/v1/org/${APPROVED_ORG}/settings`;
  }
  async getSettings(timeoutMs?: number) {
    return object(await this.read(`${this.prefix}`, timeoutMs));
  }
  async getTicketIdFormat(timeoutMs?: number) {
    return object(await this.read(`${this.prefix}/ticket-id-format`, timeoutMs));
  }
  private async read(path: string, timeoutMs?: number) {
    try { return await jsonRequest(this.base, path, this.headers, 'GET', undefined, timeoutMs); }
    catch (error) {
      if (error instanceof HttpFailure && error.status === 401) throw new AuthenticationRequiredError();
      throw error;
    }
  }
}
