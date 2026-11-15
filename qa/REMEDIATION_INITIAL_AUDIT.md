# Remediation initial audit

Baseline: `f33eeeb33a08ccfc0fbe53fed00d3556c0d54ad3`. Fresh local clone; original working tree clean. Existing Git history and origin retained. Baseline commit is the recovery checkpoint. No development database was present in this clone.

| Priority | Defect | Source |
|---|---|---|
| Critical | Nonpositive, missing and coerced quantities accepted; no size or retry validation | backend/app/schemas/shopping.py; backend/app/api/routes/shopping.py |
| Critical | Error interceptor fabricates successful orders and query results | frontend/src/services/api.ts |
| High | Cohorts hardcoded; funnel counts independent stages; revenue ignores quantity/historical price; empty-data fabricated rates | backend/app/services/analytics.py |
| High | Experiment samples and zero conversions fabricated; lifetime orders counted instead of exposed converters | backend/app/services/experimentation.py |
| High | Tests connect to regular application database | backend/tests/conftest.py |
| High | Wishlist route, API and database model absent | frontend/src/App.tsx; backend/app/models |
| High | Alembic absent; startup creates tables without versioning | backend/app/main.py |
| High | Compose references missing Dockerfiles | docker-compose.yml |
| Medium | Formula tests duplicate arithmetic instead of invoking application behavior | frontend/src/tests/components.test.tsx |
| Medium | Browser journeys and QA evidence absent | frontend/package.json; qa |
| Medium | Mutation failures frequently only logged to console; mock return shapes differ from API | frontend/src/pages; frontend/src/services/api.ts |
| Medium | SQLite foreign-key enforcement absent; monetary values stored as floating point | backend/app/db/session.py; backend/app/models/order.py |

Existing components, routes, models, scripts and tests inspected before editing. Repairs preserve the three existing application experiences and design system. Validation results are recorded separately; source presence is not a runtime PASS.
