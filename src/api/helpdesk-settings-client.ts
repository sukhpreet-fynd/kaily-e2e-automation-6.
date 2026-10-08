// Helpdesk-related settings endpoints under /v1/org/{APPROVED_ORG}/settings/*.
// Routes verified in neo at:
//   services/neo/app/api/routes/main/v1/org/settings.route.js
// Verified GET paths used here:
//   /ticket-fields, /ticket-statuses, /groups, /business-hours,
//   /routing-rules, /contact-fields, /inbox-notifications.
// Response shapes vary (bare arrays vs { items, page } vs { ticketStatuses }),
// so helpers return raw unknown JSON and the spec normalises per route.
import { APPROVED_ORG } from '../config/env.ts';
import { jsonRequest, HttpFailure } from './transport.ts';
import { AuthenticationRequiredError } from '../auth/session-guard.ts';

export class HelpdeskSettingsClient {
  private readonly base: string;
  private readonly headers: Record<string, string>;
  private readonly prefix: string;
  constructor(config: { mainBase: string; orgId: string }, headers: Record<string, string>) {
    if (config.orgId !== APPROVED_ORG) throw new Error('Unauthorized organization.');
    this.base = config.mainBase; this.headers = headers;
    this.prefix = `/v1/org/${APPROVED_ORG}/settings`;
  }
  async listCustomFields(timeoutMs?: number): Promise<unknown> {
    return this.read(`${this.prefix}/ticket-fields`, timeoutMs);
  }
  async listTicketStatuses(timeoutMs?: number): Promise<unknown> {
    return this.read(`${this.prefix}/ticket-statuses`, timeoutMs);
  }
  async listGroups(timeoutMs?: number): Promise<unknown> {
    return this.read(`${this.prefix}/groups`, timeoutMs);
  }
  async getBusinessHours(timeoutMs?: number): Promise<unknown> {
    return this.read(`${this.prefix}/business-hours`, timeoutMs);
  }
  async listRoutingRules(timeoutMs?: number): Promise<unknown> {
    return this.read(`${this.prefix}/routing-rules`, timeoutMs);
  }
  async listContactFields(timeoutMs?: number): Promise<unknown> {
    return this.read(`${this.prefix}/contact-fields`, timeoutMs);
  }
  async getInboxNotifications(timeoutMs?: number): Promise<unknown> {
    return this.read(`${this.prefix}/inbox-notifications`, timeoutMs);
  }
  // Explicit *-list aliases keep spec readers from guessing at the response shape.
  // Both endpoints already return list-shaped bodies; see getBusinessHours /
  // getInboxNotifications for the underlying call.
  async getBusinessHoursList(timeoutMs?: number): Promise<unknown> {
    return this.getBusinessHours(timeoutMs);
  }
  async getInboxNotificationsList(timeoutMs?: number): Promise<unknown> {
    return this.getInboxNotifications(timeoutMs);
  }
  private async read(path: string, timeoutMs?: number) {
    try { return await jsonRequest(this.base, path, this.headers, 'GET', undefined, timeoutMs); }
    catch (error) {
      if (error instanceof HttpFailure && error.status === 401) throw new AuthenticationRequiredError();
      throw error;
    }
  }
}
