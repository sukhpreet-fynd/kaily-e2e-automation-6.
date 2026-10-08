// Shared SLO thresholds. Scenarios should spread these across every run so
// Grafana / CI gets a consistent pass/fail signal.
export const defaultThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<1500'],
  checks: ['rate>0.99'],
};
