// Safety note: smoke or baseline. /agentusers/statuses returns a short list
// of staff presence rows; no documented endpoint rate limit and the handler
// is lightweight (presence cache lookup). Still never stress — only
// health-concurrent is cleared for that profile.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl, orgId, headers, profile, requireBearer } from '../lib/config.js';
import { pick } from '../lib/profiles.js';
import { defaultThresholds } from '../lib/thresholds.js';

requireBearer();

// Runtime guard: downgrade stress to baseline on non-health scenarios.
const chosen = profile === 'stress' ? 'baseline' : profile;

export const options = {
  ...pick(chosen),
  thresholds: defaultThresholds,
  tags: { scenario: 'agent-users' },
};

const url = `${baseUrl}/v1/org/${orgId}/agentusers/statuses`;

export default function () {
  const res = http.get(url, { headers, tags: { scenario: 'agent-users' } });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(2);
}
