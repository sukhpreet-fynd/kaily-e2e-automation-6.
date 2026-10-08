import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl, orgId, headers, profile, requireBearer } from '../lib/config.js';
import { pick } from '../lib/profiles.js';
import { defaultThresholds } from '../lib/thresholds.js';

// GET /v1/org/{accountId}/analytics/overview?from=...&to=...
// Response is cached ~10 min server-side, so this is especially safe
// even at stress profile. Window: last 7 days.
requireBearer();

export const options = {
  ...pick(profile),
  thresholds: defaultThresholds,
  tags: { scenario: 'analytics-overview' },
};

const now = Date.now();
const sevenDays = 7 * 24 * 60 * 60 * 1000;
const from = new Date(now - sevenDays).toISOString();
const to = new Date(now).toISOString();
const url = `${baseUrl}/v1/org/${orgId}/analytics/overview?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

export default function () {
  const res = http.get(url, { headers, tags: { scenario: 'analytics-overview' } });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(2);
}
