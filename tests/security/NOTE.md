# Security Layer — Consolidator Notes

## Scope
SCA (dependency scanning via `npm audit`) and static authz checks: 401/403, tenant
isolation, token scope, and a read-only, opt-in rate-limit probe. No active fuzzing,
no ZAP scans, no mutation endpoints, no payload-based attacks.

## Exclusions
- No SQLi / XSS / auth-bruteforce / token-enumeration probes.
- No writes to any API. All specs are GET-only.
- Rate-limit probe is OPT-IN via `KAILY_PROBE_RATE_LIMITS=true`; never runs by default.
- Bearer tokens / cookies / `boltic-ssid` are never logged, serialized, or attached
  to Playwright traces (trace / screenshot / video are already `off`).

## Required package.json script additions
```json
"audit:sca": "node --experimental-strip-types scripts/security/sca.ts",
"test:security": "playwright test --project=security",
"security:all": "npm run audit:sca && npm run test:security"
```

## Required playwright.config.ts project addition
Append to the `projects` array:
```ts
{ name: 'security', testMatch: '**/security/*.spec.ts', dependencies: ['auth'] }
```
The `header-leakage.spec.ts` test does not require auth but tolerates the dependency.

## Environment flags (optional)
| Variable | Default | Effect |
|---|---|---|
| `SCA_FAIL_LEVEL` | `high` | `high` fails on any high/critical; `critical` fails only on critical. |
| `KAILY_REVOKED_BEARER` | unset | When set, `account-auth.spec.ts` adds a revoked-token 401 check. |
| `KAILY_PUBLIC_API_BASE_URL` | unset | When set, enables `public-api-auth.spec.ts` suite. |
| `KAILY_PROBE_RATE_LIMITS` | `false` | When `true`, enables the read-only 10-GET rate-limit probe. |

## Files added
- `scripts/security/sca.ts` — SCA runner (exit 0 clean / 1 gated / 2 tool error).
- `src/security/probe.ts` — `probeStatus(url, headers, timeoutMs)` native-fetch helper.
- `src/security/bearer.ts` — `captureBearerForTests(page)` reuses auth session, in-memory only.
- `src/fixtures/security.ts` — Playwright fixture exposing `probe` and `bearer`.
- `tests/security/account-auth.spec.ts`
- `tests/security/tenant-isolation.spec.ts`
- `tests/security/public-api-auth.spec.ts`
- `tests/security/rate-limit.spec.ts` (opt-in)
- `tests/security/header-leakage.spec.ts`

## README snippet (5 lines)
> Security suite covers SCA (`npm run audit:sca`) and read-only authz probes
> (`npm run test:security`). All checks are GET-only and run against the approved
> org only. The rate-limit probe is opt-in via `KAILY_PROBE_RATE_LIMITS=true`.
> Bearer tokens stay in-memory; trace/screenshot/video remain off. Run both with
> `npm run security:all`.

## Open flags / questions
- `KAILY_PUBLIC_API_BASE_URL` is not in `.env.example`; add it if public-API coverage
  is desired. The public-API spec is skip-if-unset so no action is required to merge.
- The tenant-isolation spec uses `00000000-0000-0000-0000-000000000000` as the wrong
  org. If the console blocks that at the route-guard layer (via `installOrganizationGuard`),
  server-side probing via `fetch` still bypasses it as intended, so the 403 assertion
  remains valid.
- SCA runner uses the project's `npm` on PATH; CI must have Node + npm available
  (already true for the Playwright project).
