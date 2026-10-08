# Contract layer

These specs enforce the response shape that trinity (and other consumers)
rely on. They run against live UAT/prod and fail loudly the moment the API
adds, removes or retypes a UI-facing field. They are intentionally kept
separate from `tests/api/`: `api` covers behaviour (lists, filters, errors),
`contract` covers field-level typing on representative payloads.

Every spec here is read-only, uses `test.describe.serial`, and reuses the
`api` fixture from `src/fixtures/api.ts` (no duplicated client code). Rules
of the layer:
- Fail with the named field on first missing/wrong-type assertion.
- Never mutate data. Never bypass the organization guard.
- Keep the asserted field set minimal — only what trinity actually renders.
