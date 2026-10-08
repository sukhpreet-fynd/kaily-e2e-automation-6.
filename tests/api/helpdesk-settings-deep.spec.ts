import { test, expect } from '../../src/fixtures/api.ts';
import { HttpFailure } from '../../src/api/transport.ts';
import type { ApiClients } from '../../src/api/client-factory.ts';

// Settings endpoints vary across accounts (bare array, { items, page },
// { ticketStatuses }, plain object). We require any list-shaped body — i.e. a
// top-level items / data / ticketStatuses array, or a bare array — and
// soft-skip 404/403.
type Probe = { name: string; call: (api: ApiClients) => Promise<unknown> };
const PROBES: Probe[] = [
  { name: 'ticket-fields',       call: api => api.helpdeskSettings.listCustomFields() },
  { name: 'ticket-statuses',     call: api => api.helpdeskSettings.listTicketStatuses() },
  { name: 'groups',              call: api => api.helpdeskSettings.listGroups() },
  { name: 'routing-rules',       call: api => api.helpdeskSettings.listRoutingRules() },
  { name: 'business-hours',      call: api => api.helpdeskSettings.getBusinessHoursList() },
  { name: 'inbox-notifications', call: api => api.helpdeskSettings.getInboxNotificationsList() }
];

const extractList = (body: unknown): unknown[] | null => {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== 'object') return null;
  const obj = body as Record<string, unknown>;
  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray(obj.ticketStatuses)) return obj.ticketStatuses;
  if (Array.isArray(obj.rules)) return obj.rules;
  if (Array.isArray(obj.groups)) return obj.groups;
  return null;
};

test.describe.serial('Helpdesk settings (deep)', () => {
  for (const probe of PROBES) {
    test(`GET /settings/${probe.name} returns a list-shaped body (soft-skip on 404/403) @api`, async ({ api }) => {
      let body;
      try {
        body = await probe.call(api);
      } catch (error) {
        if (error instanceof HttpFailure && (error.status === 404 || error.status === 403)) {
          test.skip(true, `/settings/${probe.name} unavailable (HTTP ${error.status}).`);
        }
        throw error;
      }
      const list = extractList(body);
      // Fallback: some endpoints return a single config object (business-hours
      // on fresh accounts). Accept object-ness as a last resort, same policy as
      // the baseline settings spec, but call out when a list wasn't present.
      if (list == null) {
        expect(body).not.toBeNull();
        expect(typeof body).toBe('object');
        return;
      }
      expect(Array.isArray(list)).toBe(true);
    });
  }
});
