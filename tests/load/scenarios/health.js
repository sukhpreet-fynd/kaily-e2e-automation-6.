import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl, profile } from '../lib/config.js';
import { pick } from '../lib/profiles.js';
import { defaultThresholds } from '../lib/thresholds.js';

// Health endpoints: /_healthz, /_livez, /_readyz. No auth. Cheap on the
// server. Safe to run against UAT or prod freely.

export const options = {
  ...pick(profile),
  thresholds: defaultThresholds,
  tags: { scenario: 'health' },
};

const paths = ['/_healthz', '/_livez', '/_readyz'];

export default function () {
  for (const path of paths) {
    const res = http.get(`${baseUrl}${path}`, { tags: { scenario: 'health', path } });
    check(res, { 'status is 200': (r) => r.status === 200 });
  }
  sleep(1);
}
