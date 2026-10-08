import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl, orgId, headers, profile, requireBearer } from '../lib/config.js';
import { pick } from '../lib/profiles.js';
import { defaultThresholds } from '../lib/thresholds.js';

// GET /v1/org/{accountId}/copilotapps
// No documented endpoint-level rate limit, but we still stay on baseline
// at most. Never promote to stress without approval.
requireBearer();

const chosen = profile === 'stress' ? 'baseline' : profile;

export const options = {
  ...pick(chosen),
  thresholds: defaultThresholds,
  tags: { scenario: 'copilotapps-list' },
};

const url = `${baseUrl}/v1/org/${orgId}/copilotapps`;

export default function () {
  const res = http.get(url, { headers, tags: { scenario: 'copilotapps-list' } });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(2);
}
