import { test, expect } from '../../src/fixtures/api.ts';
import { HttpFailure } from '../../src/api/transport.ts';
import type { ApiClients } from '../../src/api/client-factory.ts';

type Probe = { name: string; call: (api: ApiClients) => Promise<unknown> };

// Each probe soft-skips on 404 (route absent in this environment) or 403
// (permission scope). Response shapes vary across these endpoints (bare array,
// { items, page }, { ticketStatuses }, plain object), so we only assert that
// a defined JSON object/array was returned.
const PROBES: Probe[] = [
  { name: 'ticket-fields',       call: api => api.helpdeskSettings.listCustomFields() },
  { name: 'ticket-statuses',     call: api => api.helpdeskSettings.listTicketStatuses() },
  { name: 'groups',              call: api => api.helpdeskSettings.listGroups() },
  { name: 'business-hours',      call: api => api.helpdeskSettings.getBusinessHours() },
  { name: 'routing-rules',       call: api => api.helpdeskSettings.listRoutingRules() },
  { name: 'contact-fields',      call: api => api.helpdeskSettings.listContactFields() },
  { name: 'inbox-notifications', call: api => api.helpdeskSettings.getInboxNotifications() }
];

test.describe.serial('Helpdesk settings API', () => {
  for (const probe of PROBES) {
    test(`GET /settings/${probe.name} returns a JSON body (soft-skip on 404) @api`, async ({ api }) => {
      try {
        const body = await probe.call(api);
        expect(body).not.toBeNull();
        expect(typeof body).toBe('object');
      } catch (error) {
        if (error instanceof HttpFailure && (error.status === 404 || error.status === 403)) {
          test.skip(true, `/settings/${probe.name} unavailable (HTTP ${error.status}).`);
        }
        throw error;
      }
    });
  }
});
