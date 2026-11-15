# Traceable repairs

| Defect | Root cause | File modified | Repair | Retest evidence |
|---|---|---|---|---|
| Invalid checkout | Permissive integer schema/default quantity | schemas/shopping.py; services/checkout.py; routes/shopping.py | Strict quantities, sizes, backend prices and customer checks | Exact 5-unit acceptance cases, invalid inputs, rollback |
| Unsafe retries/concurrency | No request identity; read-then-write stock | models/order.py; services/checkout.py; migrations/versions/0002_reliability.py | Unique key/fingerprint, atomic conditional update, constraints | Concurrent and replay tests |
| Fake success | Axios error handler returned fixed payloads | frontend/src/services/api.ts | Rejections preserved; explicit global error banner | API rejection and cart persistence tests |
| Unreadable validation errors | Rendering Pydantic detail arrays | frontend/src/services/errors.ts; pages; SizeAssistantModal.tsx | Shared error formatter | Frontend 422 test and build |
| Inaccurate analytics | Hardcoded cohorts, row-count revenue and independent stages | services/analytics.py; schemas/analytics.py; routes/analytics.py | UTC ordered sessions, actual cohorts, historical quantities/prices, distinct order returns | Hand-calculated metric fixtures |
| Invalid experimentation | Imputed samples/conversions and lifetime attribution | services/experimentation.py; routes/events.py; schemas/experiments.py | Explicit exposure, unique converters, seven-day bounded attribution, Fisher/z comparison and score intervals | Independent z and Fisher expected values; attribution edge cases |
| Wishlist disappeared | Component-only heart state | models/wishlist.py; routes/wishlist.py; useWishlist.ts; Wishlist.tsx | Database-backed unique entries and query invalidation, route/nav/count | Persistence/duplicate/unavailable tests and browser refresh |
| No migrations | Implicit create_all on startup | migrations; scripts/migrate_legacy.py; main.py | Frozen original baseline + data-preserving repair revision and SQLite adoption backup | Fresh/legacy/invalid-data/schema-consistency tests |
| Unsafe testing | Application engine fixture and live audit scripts | backend/tests/conftest.py; qa_*audit.py | Temporary DBs; isolated legacy entry points | Multiple full runs and xdist parallel workers |
| Weak frontend tests | Arithmetic duplicated inside tests | utils/commerce.ts; components.test.tsx; reliability.test.tsx | Test actual shared functions, components and API boundary | Vitest execution |
| Invented inventory/return metrics | Arbitrary floors/category order estimates | services/inventory.py; services/returns.py | Stored completed quantities, actual category/order denominators | Forecast, RFM and return fixtures |
| Configuration without behavior | Personalization flag not consumed | services/flags.py; services/recommendation.py; feature_flags.py | Deterministic customer eligibility and true popularity fallback | Flag behavior test |
| Missing Dockerfiles | Compose referred to nonexistent build files | Dockerfiles; docker-compose.yml; nginx.conf | Backend migrations/seed, production frontend, proxy, volumes, health checks | Build/config/container results in final report |
| Broken images/error loading | Remote-only images and indefinite loading | main.tsx; RequestError.tsx; APIStatus.tsx; pages | Local image fallback and actionable error/retry state | Five-viewport browser route sweeps |

All source paths without a frontend prefix are under backend/app unless otherwise specified. Existing design and business modules are retained. Historical audit-script HTTP writes were replaced by isolated pytest entry points to satisfy the requirement that automated tests never write to a running development database.
