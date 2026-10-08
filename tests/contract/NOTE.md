# Contract layer — merge instructions

## New npm scripts
"test:contract": "playwright test --project=contract"

## New Playwright project
{ name: 'contract', testMatch: '**/contract/*.spec.ts', dependencies: ['auth'] }

## New k6 scripts
"load:settings": "k6 run tests/load/scenarios/settings.js",
"load:audit": "k6 run tests/load/scenarios/audit.js",
"load:agent-users": "k6 run tests/load/scenarios/agent-users.js",
"load:health-soak": "K6_PROFILE=health-soak k6 run tests/load/scenarios/health-concurrent.js",
"load:app-detail": "k6 run tests/load/scenarios/copilotapps-detail.js",
"load:thread-messages": "k6 run tests/load/scenarios/thread-messages.js"

## README additions
- Contract layer: "Guards UI against silent API shape changes. Runs against live UAT/prod."
- New load scenarios listed per npm script above.
