# StyleSense remediation — final acceptance

Baseline commit: `f33eeeb33a08ccfc0fbe53fed00d3556c0d54ad3`. Date: 15 November 2026. Existing implementation retained; no rebuild, remote change, commit or push. Work was performed in a clean local clone and is delivered as a source archive and reviewable patch. Existing Git history remains intact in the checkout.

## Executed results

| Validation | Executed | Passed | Failed | Skipped | Blocked |
|---|---:|---:|---:|---:|---:|
| Backend pytest, final run with two xdist workers | 135 | 135 | 0 | 0 | 0 |
| Frontend Vitest | 19 | 19 | 0 | 0 | 0 |
| Playwright against production frontend and real backend | 11 | 11 | 0 | 0 | 0 |
| **Final automated-case total** | **165** | **165** | **0** | **0** | **0** |

Additional checks: TypeScript no-emit check PASS; production build PASS; `git diff --check` PASS; Alembic fresh/legacy/data-preservation/schema-agreement tests PASS; Docker Compose configuration PASS; both final images built and services healthy; five connected production-proxy checks PASS. Backend suites were also executed earlier with 26, 30, 13, 124 and 131 passing cases at intermediate stages; these are not added to the final case total. Tests initially exposed defects and invalid old expectations; those failures were repaired and retested. An interrupted run during resource contention is not represented as a successful run.

## Acceptance status

| Area | Status | Evidence |
|---|---|---|
| Checkout quantity, size, customer, product and stock validation | PASS | Strict schema; 5-unit stock acceptance cases, invalid decimal/missing/negative/zero quantity tests |
| Inventory integrity, concurrency and transaction rollback | PASS | Conditional SQL updates, constraints, simultaneous buyers, failed commit/second-item rollback tests |
| Retry/idempotency safety | PASS | Unique stored key and request fingerprint; same-key replay and conflict tests |
| Fake-success removal and visible API errors | PASS | No success substitution; 400/404/422/500/network/timeout tests; browser preserves cart/address on failure |
| Cohorts, revenue, funnel, AOV, return denominators, CTR and RFM | PASS | Stored observations and historical prices; independently calculated fixtures; incomplete cohorts Pending |
| Experiments | PASS for documented purchase-conversion scope | Explicit exposure, actual samples, unique converters, UTC start/end and seven-day attribution; Fisher/z expected values |
| Persistent wishlist | PASS | Unique database entries; add/remove/duplicate/unavailable tests; browser refresh and add-to-cart |
| Migrations | PASS on SQLite | Frozen original baseline; repair revision; backup/adoption, fresh and existing-data tests |
| Docker | PASS | Final source Dockerfiles built; both services healthy; proxy, seeded catalogue, deep-link refresh, checkout replay and invalid checkout checked |
| Test isolation | PASS | Per-test temporary SQLite DBs and FastAPI overrides; independent parallel workers; normal development DB never reset |
| Frontend test quality | PASS for covered cases | Actual shared RICE/discount functions, product/cart/wishlist/search/filter/KPI components and network boundary |
| Browser journeys and routes | PASS | 20 concrete route entries including redirect at five viewports (100 route/viewport visits), four workflow/error journeys, console sweep, 404/redirect checks |
| API inventory and validation | PASS for covered cases | OpenAPI inventory; all registered GET routes and write-route validation smoke cases, plus transaction/CRUD tests |
| Production build | PASS | `npm run typecheck`, `npm run build`; production preview used for final browser run |
| Documentation | PASS for remediation scope | README, KPI definitions, experiment guide, limitations and raw QA artifacts |

## Limits and remaining work

- This is a verified local portfolio prototype, not a production-secured commerce service. Persona switching is demo access; production authentication/authorization and real payment/refund processing are not implemented.
- Purchase conversion is the supported experiment decision metric. Other primary metrics do not get fabricated launch significance; they need dedicated estimators and guardrails. No real customer uplift or realized GMV is claimed.
- The personalization flag changes actual recommendations and supports deterministic bucketing. Other legacy flags remain configuration metadata: PARTIALLY IMPLEMENTED as feature gates.
- Visual search is colour-based, sizing and return risk are heuristics, and seeded outcomes are synthetic. Gross revenue treatment and return denominators are explicitly documented.
- PostgreSQL runtime execution: NOT TESTED. Driver and SQLAlchemy compatibility paths exist; SQLite results do not establish PostgreSQL parity.
- PowerShell/Windows execution: NOT TESTED because this Linux environment has no `pwsh`; setup script and commands are supplied. This is an additional platform limitation, not a skipped or passed automated case.
- Not every possible invalid payload or database failure was injected into every endpoint. The API inventory report identifies the actual coverage. Full accessibility, load testing, production security and commercial readiness remain outside the verified scope.
- Vite reports an existing large-bundle warning. Python UTC timestamp deprecation warnings remain; they do not change the stored UTC convention. Neither warning is represented as a passing performance/security check.

## Reproduce

See README.md. Backend: `python -m pytest -q -n 2 --disable-warnings`. Frontend: `npm test`, `npm run typecheck`, `npm run build`, `npm run test:e2e`. Install backend dependencies in its virtual environment and set `STYLESENSE_PYTHON` if needed. Browser tests create their own temporary database and launch the production preview plus backend; they never reset the normal development database.

Docker originally encountered this environment's proxy CA trust failure and limited VFS storage. Builds succeeded using the Dockerfiles' optional `proxy_ca` BuildKit secret containing the environment CA, with TLS verification kept enabled. Build cache was cleared to recover workspace capacity. The final services ran together and passed connected checks; these resolved issues are not listed as current blockers. The CA and session-specific port override are not embedded in the deliverable.

Screenshots: `qa/screenshots/`. Raw evidence: `backend-tests.xml`, `vitest-results.json`, `playwright-results.json`, `docker-smoke.json`, `docker-services.json`, and `qa/logs/`. Source archive includes screenshots. The patch excludes screenshots and retained failure traces; use the archive for visual evidence.
