# StyleSense

### AI-Powered Commerce Intelligence & Personalisation Platform

**Discover smarter. Shop better. Understand every interaction.**

StyleSense is an independently branded fashion-commerce portfolio application connecting a customer storefront, product-intelligence dashboard, experimentation tools and business operations through a shared FastAPI backend and relational database.

It demonstrates product discovery, explainable recommendations, sizing assistance, simulated checkout, behavioural analytics and commerce operations in one working codebase. Core features do not require a paid AI API.

> **Project status:** verified local portfolio prototype. All bundled customers, products, events and orders are synthetic. Checkout does not collect payments. Business uplift, reduced returns and realized GMV are not claimed as real customer outcomes. See [verification results](#verification-results) and [known limitations](#known-limitations).

## Contents

- [Deployment links and current status](#deployment-links-and-current-status)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Database, migrations and demo data](#database-migrations-and-demo-data)
- [Application routes](#application-routes)
- [API reference](#api-reference)
- [Algorithms and measurement](#algorithms-and-measurement)
- [Testing and verification](#testing-and-verification)
- [Docker](#docker)
- [Deployment guide](#deployment-guide)
- [Project structure](#project-structure)
- [Documentation and screenshots](#documentation-and-screenshots)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)
- [Contributing and license](#contributing-and-license)

## Deployment links and current status

| Resource | Link | Verification status |
|---|---|---|
| Source repository | [github.com/SrijanSingh2006/stylesense](https://github.com/SrijanSingh2006/stylesense) | Source of this application |
| Previously published Vercel URL | [stylesense-platform.vercel.app](https://stylesense-platform.vercel.app) | Reachable, but currently displays **ThreadIQ**, not this StyleSense application |
| Previously published mirror | [frontend-chi-two-80.vercel.app](https://frontend-chi-two-80.vercel.app) | Serves the same deployed frontend asset as the URL above |

**Deployment check, 15 November 2026:** the previously documented URLs respond, but browser inspection shows ThreadIQ branding. The `/api/v1/health` path on the primary URL returns the frontend HTML instead of a JSON health response. These links are retained transparently as historical deployment references; they are not evidence that the repaired StyleSense frontend and backend are deployed together.

The current code has been verified locally and in connected Docker services. A verified public URL for the repaired application is pending deployment configuration. Follow the [deployment guide](#deployment-guide) to connect the correct frontend project and API, then replace this status with the verified URL.

## Features

### Customer storefront

- Editorial homepage, product discovery, category browsing and product details.
- Backend-driven category, brand, colour and price filters; sorting and pagination.
- Natural-language shopping queries such as `black sneakers under 2500`.
- Explainable recommendations using customer preferences, browsing history, purchase history, diversity and popularity fallback.
- Image-upload discovery using colour-based visual similarity.
- Complete-the-look suggestions across complementary categories.
- Rule-based size and fit assistant with explanations and alternative sizes.
- Database-backed customer wishlists with duplicate prevention, removal, counts and refresh persistence.
- Browser-persisted shopping bag, quantity changes and simulated checkout.
- Positive-integer quantity validation, valid-size checks, backend-calculated totals, atomic stock updates and replay-safe orders.
- Visible request errors and local product-image fallbacks when external photos fail.

### Product intelligence

- Completed-order revenue, AOV, session conversion, cart abandonment, return and repeat-customer metrics.
- Ordered six-stage session funnel: homepage → discovery → product → cart → checkout → purchase.
- Activity-based acquisition cohorts with Week 0–4 retention and Pending states for incomplete observation weeks.
- Transaction-based RFM customer segmentation with documented thresholds.
- Historical product revenue based on purchased quantities and stored unit prices.
- Completed Purchase Sessions North Star metric and supporting metrics.
- Recommendation impression/click instrumentation; CTR is unavailable when impressions are missing.

### Experiments and operations

- Experiment creation, status changes and deterministic, persisted customer assignment.
- Explicit exposure recording and seven-day, experiment-window-bounded purchase attribution.
- Actual assigned/exposed/converting customer counts; no invented sample sizes or conversions.
- Two-proportion z-test or Fisher exact comparison, uncertainty intervals and evidence-aware decisions.
- Personalization feature flag with deterministic customer rollout and actual recommendation fallback.
- Inventory overview, atomic stock movements, replenishment alerts and observed 28-day demand velocity.
- Return reasons, category/order denominators and clearly labelled heuristic risk scores.
- Catalogue-quality auditing and persisted issue resolution.
- Explicitly simulated promotion/elasticity scenarios.
- RICE prioritization, roadmap/Kanban workflows, feedback and gated release readiness.

## Technology stack

The table lists technologies present in the repository, rather than packages requested in an earlier project brief.

| Layer | Technologies | Purpose |
|---|---|---|
| Frontend | React 18, TypeScript 5, Vite 5 | Application UI, typed components and builds |
| Styling and icons | Tailwind CSS 3, PostCSS, Lucide React, clsx, tailwind-merge | Shared visual system and responsive layouts |
| Routing | React Router 6 | Storefront, dashboard and operations navigation |
| Data and client state | Axios, TanStack Query 5, Zustand | API requests, server-state queries and persisted cart/persona state |
| Charts | Recharts 2 | Funnel and management visualizations |
| Backend | Python, FastAPI, Uvicorn | Versioned REST API and ASGI serving |
| Validation | Pydantic 2 | Request/response schemas and input validation |
| Database | SQLAlchemy, SQLite, Alembic | Relational persistence and schema migrations |
| PostgreSQL support | psycopg 3 / SQLAlchemy PostgreSQL dialect | Optional deployment database; runtime parity is not yet verified |
| Search and data dependencies | scikit-learn, NumPy; Pandas retained in requirements | TF-IDF/cosine retrieval and numerical tooling; Pandas is a declared data-tooling dependency |
| Statistics | SciPy and Python math | Fisher exact and two-proportion comparisons |
| Image processing | Pillow, python-multipart | Image validation, uploads and colour extraction |
| Monetary arithmetic | Python Decimal; SQL Numeric for orders/items | Two-decimal checkout calculations and historical order prices |
| Backend tests | Pytest, pytest-xdist, HTTPX / FastAPI TestClient | Isolated API, transaction, concurrency, migration and metric checks |
| Frontend tests | Vitest, React Testing Library, jsdom | Actual component, state and API-boundary behaviour |
| Browser tests | Playwright and Chromium | Production-build journeys, route sweeps and screenshots |
| Containers | Docker, Docker Compose, Nginx | Connected backend, production frontend, API proxy and persistent volumes |
| Existing external hosting | Vercel | Historical frontend URLs; current deployment status is described above |

Frontend versions are resolved in [`frontend/package-lock.json`](frontend/package-lock.json). Backend dependency ranges are in [`backend/requirements.txt`](backend/requirements.txt); [`backend/requirements.lock.txt`](backend/requirements.lock.txt) records the exact Python environment used for verification.

## Architecture

```mermaid
flowchart LR
    Shopper[Customer storefront] --> UI[React and TypeScript]
    Manager[Product intelligence] --> UI
    Operator[Business operations] --> UI
    UI -->|Axios and TanStack Query| API[FastAPI /api/v1]
    API --> Validation[Pydantic validation]
    API --> Services[Discovery, checkout, analytics and operations]
    Services --> ORM[SQLAlchemy]
    ORM --> DB[(SQLite / optional PostgreSQL)]
    Services --> Algorithms[TF-IDF, colour matching, sizing and statistics]
    API --> Uploads[Validated image uploads]
```

Orders, events, customer preferences, experiments, stock movements, returns, catalogue issues, roadmap tasks, feedback, releases and wishlists use the shared relational backend. The cart is persisted in browser storage. Paid model providers are not used by the current core algorithms.

In Docker, Nginx serves the built frontend and forwards `/api/` and `/uploads/` to the backend. In local development, the browser calls the configured API URL directly.

## Quick start

### Prerequisites

- Python **3.11+**; verified with Python **3.12** on Linux.
- Node.js **22+** and npm.
- Git.
- Optional Docker with Compose v2 for the container workflow.
- Chromium or Playwright's downloaded Chromium for browser tests.

```sh
git clone https://github.com/SrijanSingh2006/stylesense.git
cd stylesense
```

### Windows PowerShell

The convenience script installs dependencies, adopts/migrates the database safely and seeds an empty catalogue:

```powershell
./scripts/setup.ps1
```

Then start the backend:

```powershell
cd backend
./.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In another terminal, from the repository root:

```powershell
cd frontend
npm run dev -- --host 127.0.0.1
```

If PowerShell script execution is restricted, use the manual backend setup rather than changing machine policy:

```powershell
cd backend
py -3 -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt
./.venv/Scripts/python.exe ../scripts/migrate_legacy.py
./.venv/Scripts/python.exe -m app.seed
./.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In `frontend`, run `npm ci` once before `npm run dev`. The Windows script/commands are provided; PowerShell execution was not tested in the Linux verification environment.

### Linux / macOS

From the repository root:

```sh
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python ../scripts/migrate_legacy.py
.venv/bin/python -m app.seed
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In another terminal, from the repository root:

```sh
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

### Local URLs

| Service | URL |
|---|---|
| Storefront | http://127.0.0.1:5173 |
| Product intelligence | http://127.0.0.1:5173/dashboard |
| Operations | http://127.0.0.1:5173/operations/inventory |
| API health | http://127.0.0.1:8000/api/v1/health |
| Swagger / interactive API docs | http://127.0.0.1:8000/docs |
| ReDoc | http://127.0.0.1:8000/redoc |
| OpenAPI JSON | http://127.0.0.1:8000/openapi.json |

Select a seeded customer persona to explore differing preferences. Purchases and stock changes are simulated but persist in the configured database.

## Configuration

The root [`.env.example`](.env.example) is a reference. **The Python backend does not automatically load that file**: export its supported variables in the shell or pass them through your hosting/container configuration. Vite supports a `frontend/.env.local` file.

| Variable | Component | Default / meaning |
|---|---|---|
| `DATABASE_URL` | Backend | `sqlite:///./stylesense.db`, relative to the backend process working directory |
| `CORS_ORIGINS` | Backend | JSON array of permitted browser origins; local defaults include localhost and 127.0.0.1 on ports 5173 and 3000 |
| `UPLOAD_DIR` | Backend | Repository `uploads/` directory unless explicitly set |
| `VITE_API_BASE_URL` | Frontend | `http://localhost:8000/api/v1` in ordinary builds; Docker uses `/api/v1` |
| `STYLESENSE_PYTHON` | Browser tests | Absolute path to the Python executable with backend dependencies |
| `CHROMIUM_PATH` | Browser tests | Optional installed Chromium executable; otherwise the runner uses a supported local/default browser |
| `PLAYWRIGHT_JSON_FILE` | Browser tests | Optional JSON results path; default `../qa/playwright-results.json` |
| `STYLESENSE_E2E_DIR` | Browser tests | Optional dedicated test-artifact directory; by default a new temporary directory is created |
| `OPENAI_API_KEY` | Backend settings | Reserved setting; the current core implementation does not call a paid LLM |

For consistent local addressing, create `frontend/.env.local` with:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Example backend configuration in PowerShell:

```powershell
$env:DATABASE_URL = 'sqlite:///./stylesense.db'
$env:CORS_ORIGINS = '["http://127.0.0.1:5173","http://localhost:5173"]'
```

Example in a POSIX shell:

```sh
export DATABASE_URL='sqlite:///./stylesense.db'
export CORS_ORIGINS='["http://127.0.0.1:5173","http://localhost:5173"]'
```

`VITE_API_BASE_URL` is baked into the frontend at build time: rebuild after changing it. Never place secrets in `VITE_` variables, which are visible in the browser bundle. Host and port are set through Uvicorn/Vite CLI options. The current image-upload limit is a fixed **5 MB** setting; setting `MAX_UPLOAD_SIZE_MB` in the example environment file does not currently override it.

## Database, migrations and demo data

### Fresh database

With the backend virtual environment active, from `backend`:

```sh
alembic upgrade head
python -m app.seed
alembic check
```

The API no longer implicitly creates tables on import. Run migrations before using it. The seed creates **132 products**, **30 customers**, **150 orders**, approximately **2,080 behavioural events**, and related experiments, flags, movements, returns, catalogue issues, roadmap tasks, feedback and releases. Data is synthetic and generated with a fixed random seed; dates are relative to execution time.

Seeding an existing catalogue is a no-op: it does not drop tables or erase purchases. Use a separate empty database URL for a new demonstration dataset rather than deleting a database with valuable records.

### Existing original SQLite database

From `backend`, with dependencies installed:

```sh
python ../scripts/migrate_legacy.py
```

The script verifies the original table/column layout, creates a timestamped SQLite backup, adopts the frozen baseline and applies the reliability migration. It refuses an unknown schema. Invalid legacy stock, quantities or prices stop the repair migration rather than being silently deleted. Keep and verify the printed backup path.

Migrations add checkout replay protection, safe historical monetary columns, stock/item constraints, event keys and persistent wishlists. Destructive downgrades are intentionally disabled; restore a verified backup when a schema rollback is necessary.

### Optional PostgreSQL

Use a URL such as `postgresql+psycopg://USER:PASSWORD@HOST:5432/stylesense` and run migrations against the configured database. Keep actual credentials outside Git.

For an **unversioned existing** PostgreSQL database, create and verify an external backup, compare the schema with [`backend/migrations/baseline_schema.json`](backend/migrations/baseline_schema.json), and only on a matching original schema run `alembic stamp 0001` followed by `alembic upgrade head`. Do not stamp an arbitrary database. PostgreSQL runtime behaviour has not been verified by this project's recorded SQLite tests.

## Application routes

| Experience | Route | Purpose |
|---|---|---|
| Customer | `/` | Homepage and recommendations |
| Customer | `/discover` | Catalogue, filters, sorting and pagination |
| Customer | `/search` | Text-query or uploaded-image results |
| Customer | `/product/:id` | Product detail, size assistant and outfit suggestions |
| Customer | `/wishlist` | Persisted customer wishlist |
| Customer | `/cart` | Bag and simulated checkout |
| Customer | `/account/demo` | Demo persona/preferences experience |
| Intelligence | `/dashboard` | Overview, North Star and product performance |
| Intelligence | `/dashboard/analytics` | Ordered funnel and retention cohorts |
| Intelligence | `/dashboard/experiments` | Experiments, exposure recording and results |
| Intelligence | `/dashboard/segments` | RFM segmentation |
| Operations | `/operations` | Redirect to inventory |
| Operations | `/operations/inventory` | Stock, forecast and replenishment |
| Operations | `/operations/returns` | Return reasons and insights |
| Operations | `/operations/catalogue` | Catalogue issues and resolution |
| Operations | `/operations/pricing` | Promotion simulation |
| Operations | `/operations/roadmap` | RICE and roadmap workflows |
| Operations | `/operations/releases` | Checklist and readiness gates |
| Operations | `/operations/feedback` | Feedback management |
| Operations | `/operations/settings` | Feature flags and rollout settings |

Unknown routes display a 404 with a working return link. Hosting must route frontend deep links back to `index.html`.

## API reference

Base prefix: **`/api/v1`**. The running backend's `/docs` and `/openapi.json` are the source of truth; an exported inventory is in [`qa/API_INVENTORY.json`](qa/API_INVENTORY.json).

| Area | Representative endpoints |
|---|---|
| Health/products | `GET /health`, `GET /products`, `GET /products/{product_id}` |
| Discovery | `POST /search`, `POST /visual-search`, `GET /recommendations/{customer_id}`, `GET /recommendations/{customer_id}/complete-look` |
| Fit/events | `POST /size-recommendation`, `POST /events`, `POST /cart/events` |
| Checkout | `POST /orders` |
| Wishlist | `GET /wishlist/{customer_id}`, `PUT /wishlist/{customer_id}/{product_id}`, `DELETE /wishlist/{customer_id}/{product_id}` |
| Analytics | `GET /analytics/overview`, `/analytics/funnel`, `/analytics/cohorts`, `/analytics/products`, `/analytics/north-star` |
| Segments | `GET /segments`, `GET /segments/{segment_name}` |
| Experiments | `GET/POST /experiments`, `GET/PATCH /experiments/{experiment_id}`, `POST /experiments/{experiment_id}/assign`, `GET /experiments/{experiment_id}/results` |
| Flags | `GET/POST /feature-flags`, `PATCH /feature-flags/{flag_id}`, `GET /feature-flags/eligibility/{customer_id}` |
| Inventory | `GET /inventory`, `GET /inventory/alerts`, `GET /inventory/forecast/{product_id}`, `POST /inventory/movements` |
| Operations | Returns, catalogue, promotion, roadmap, feedback and release routes; see the [complete route inventory](qa/API_TEST_RESULTS.md) |

Example search body:

```json
{"query":"black sneakers under 2500","page":1,"limit":20}
```

Example simulated checkout body — choose a product/size from the live catalogue first:

```json
{
  "customer_id": 1,
  "session_id": "demo-session",
  "idempotency_key": "unique-checkout-request-001",
  "items": [{"product_id":101,"quantity":1,"selected_size":"M"}]
}
```

Each quantity is a required strict positive integer; products must exist, be active and have a valid selected size and enough stock. Reuse the same checkout key when retrying an uncertain response: the API returns the original order. Reusing the key with different contents returns **409**. Failed orders roll back order/items, stock movements and purchase events together. Client-submitted totals or discounts are not accepted; current simulated checkout offers free delivery and no coupons.

Errors remain errors: network failures never become fabricated products, metrics or successful orders. Validation errors are formatted for display; cart contents and user input are retained on a failed purchase.

## Algorithms and measurement

- **Search:** deterministic facet extraction plus product-text TF-IDF/cosine relevance. This is not an LLM conversation.
- **Recommendations:** weighted category/colour/brand/budget affinities, views and purchase history, category diversity and popularity fallback. Explanations describe the ranking signals.
- **Visual discovery:** Pillow validates JPG/JPEG/PNG/WEBP uploads; matching uses extracted image colour and catalogue colour labels. It does not recognize garments or use CLIP embeddings.
- **Sizing:** chart/rule matching with fit adjustments and brand offsets. Scores are heuristic match indicators, not calibrated fit probabilities.
- **Revenue:** completed-order eligibility, stored historical unit prices and purchased quantities. Gross revenue treatment and return denominators are documented; no refund ledger is implied.
- **Funnel:** unique sessions advance through ordered milestones; duplicate and out-of-order events do not invent progress.
- **Cohorts:** first qualifying activity assigns a Monday-based UTC cohort. Weeks 0–4 use the original customer denominator; incomplete observation weeks are Pending.
- **Experiments:** persisted deterministic assignment, explicit exposure, distinct converters and bounded UTC attribution. Zero samples/conversions remain zero. Adequate groups use a z-test; small groups use Fisher's exact test. Difference intervals use Wilson/Newcombe methods. Relative lift is unavailable for a zero control rate.
- **RICE:** `(Reach × Impact × Confidence / 100) / Effort`, with validated inputs and positive effort.
- **Inventory/pricing:** observed completed quantities drive inventory velocity; promotion outcomes are explicitly simulated elasticity estimates.

Read the detailed [KPI definitions](docs/KPI_DEFINITIONS.md) and [experimentation guide](docs/EXPERIMENTATION_GUIDE.md) before interpreting dashboard values or experiment decisions.

## Testing and verification

### Verification results

Recorded local validation on **15 November 2026**:

| Suite/check | Result |
|---|---|
| Backend Pytest, two parallel workers | **135 passed**, 0 failed, 0 skipped |
| Frontend Vitest | **19 passed**, 0 failed, 0 skipped |
| Production-build Playwright | **11 passed**, 0 failed, 0 skipped |
| Final automated-case total | **165 passed** |
| TypeScript and production frontend build | Passed |
| Connected Docker/proxy smoke checks | **5 passed**; both services healthy |

Browser coverage includes **20 route entries × five viewport sizes = 100 route/viewport visits**, plus customer, failed-checkout, management, operations, console-error and 404/redirect checks. Viewports: 1440×900, 1366×768, 768×1024, 390×844 and 360×800. Photos/fonts are deliberately made unavailable in image-fallback checks.

These are recorded execution results, not a live CI badge or a claim that every future environment will pass. PostgreSQL and Windows execution remain unverified. See the [final acceptance report](qa/FINAL_ACCEPTANCE_REPORT.md), [test report](qa/TEST_RESULTS.md) and raw XML/JSON artifacts under `qa/`.

### Run backend tests

From the repository root, after installing backend dependencies:

```sh
backend/.venv/bin/python -m pytest -q -n 2 --disable-warnings --junitxml=qa/backend-tests.xml
```

PowerShell equivalent:

```powershell
./backend/.venv/Scripts/python.exe -m pytest -q -n 2 --disable-warnings --junitxml=qa/backend-tests.xml
```

Tests use independent temporary SQLite databases and FastAPI dependency overrides. No test resets the normal development database. Coverage includes quantity and size errors, exact stock effects, concurrent buyers, idempotent replay, rollback, historical revenue, cohort arithmetic, experiment attribution, wishlist persistence and migrations.

### Run frontend and browser checks

From `frontend`:

```sh
npm ci
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests launch their own backend with a temporary database and serve the production frontend build on port 5173. Stop development servers using ports 8000 or 5173 first. The runner discovers `backend/.venv`; otherwise set `STYLESENSE_PYTHON` to an absolute executable path. In PowerShell from `frontend`:

```powershell
$env:STYLESENSE_PYTHON = (Resolve-Path ../backend/.venv/Scripts/python.exe).Path
npm run test:e2e
```

Screenshots go to `qa/screenshots/`; JSON results go to `qa/playwright-results.json`. Retained failure traces are generated separately and ignored by Git. Legacy QA script entry points now invoke isolated pytest suites rather than modifying a running development application's data.

## Docker

From the repository root:

```sh
docker compose config
docker compose up --build
```

- Frontend: http://localhost:5173, serving the production build through Nginx.
- Backend/docs: http://localhost:8000/docs.
- Nginx forwards `/api/` and `/uploads/` to the backend service.
- Backend startup runs migrations and non-destructive demo seeding before Uvicorn.
- Named volumes `stylesense-data` and `stylesense-uploads` persist database/uploads.
- Both services provide health checks; frontend startup waits for backend readiness.

Useful commands:

```sh
docker compose ps
docker compose logs -f
docker compose down
```

`down` preserves named volumes. `down -v` deletes them: use it only when intentionally discarding that demo database and uploads. Builds behind a corporate TLS proxy can optionally use the Dockerfiles' `proxy_ca` BuildKit secret containing an approved CA bundle; keep certificate verification enabled and do not bake credentials into images.

## Deployment guide

### 1. Deploy the API and persistent data

Use a Python/container-capable host for the existing FastAPI backend. Build context is `backend/`; its Dockerfile runs the application on port 8000. Configure `DATABASE_URL`, `CORS_ORIGINS` and persistent uploads as needed. SQLite requires a persistent writable volume; an ephemeral serverless filesystem is not a reliable database deployment.

Run `alembic upgrade head` against the intended database. Seed only an intended synthetic demo database. Verify that `https://YOUR_API_HOST/api/v1/health` returns JSON, then check `/docs` and a real product request. Do not publicly expose the demo management endpoints as production-secured operations tooling; authentication/authorization is not implemented.

### 2. Deploy the frontend, including Vercel

For a separate static frontend deployment:

| Setting | Value |
|---|---|
| Repository | `SrijanSingh2006/stylesense` |
| Root directory | `frontend` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment | `VITE_API_BASE_URL=https://YOUR_API_HOST/api/v1` |

Ensure the Vercel project points at this repository and the `frontend` root, rather than the unrelated ThreadIQ project. Configure SPA rewrites to `index.html` for browser routes, and include the frontend origin in backend `CORS_ORIGINS`. Keep API traffic directed to the actual backend; a catch-all frontend rewrite returning HTML for `/api/v1/health` is not a working API.

The repository does not currently contain a Vercel project binding or provider deployment workflow. Updating GitHub alone does not prove that the correct Vercel project has redeployed. In same-origin Docker hosting, use the supplied Nginx proxy and relative `/api/v1` configuration instead of a separate API origin.

### 3. Verify the published application

Confirm StyleSense branding, JSON API health, catalogue/search, a persistent wishlist refresh, simulated checkout, stock reduction, dashboard updates and deep-link refreshes. Confirm that no deployed bundle points users to `localhost`. Run equivalent API/error checks against the deployed environment before describing the public link as the verified application.

## Project structure

```text
stylesense/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # Versioned FastAPI endpoints
│   │   ├── core/               # Runtime settings
│   │   ├── db/                 # SQLAlchemy engine and model registration
│   │   ├── models/             # Relational commerce entities
│   │   ├── schemas/            # Pydantic validation and responses
│   │   ├── services/           # Discovery, checkout, metrics and operations
│   │   ├── main.py             # ASGI application
│   │   └── seed.py             # Synthetic, non-destructive demo seeding
│   ├── migrations/             # Frozen baseline and reliability upgrade
│   ├── tests/                  # Isolated API, metric and concurrency tests
│   ├── alembic.ini
│   ├── Dockerfile
│   ├── requirements.txt
│   └── requirements.lock.txt
├── frontend/
│   ├── public/assets/          # Local product-image fallback
│   ├── src/
│   │   ├── components/         # Reusable product, size, error and wishlist UI
│   │   ├── hooks/              # Wishlist server-state hook
│   │   ├── layouts/            # Customer and management layouts
│   │   ├── pages/              # Storefront, analytics, experiments, operations
│   │   ├── services/           # API client and error formatting
│   │   ├── store/              # Persisted cart and demo persona state
│   │   ├── tests/              # Vitest / React Testing Library
│   │   ├── types/
│   │   └── utils/              # Shared, tested calculations
│   ├── e2e/                    # Real browser journeys and route sweeps
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── playwright.config.ts
│   └── package.json
├── docs/                       # Product narratives and current methodology
├── qa/                         # Audit, results, evidence and screenshots
├── scripts/                    # Windows setup and safe legacy adoption
├── uploads/
├── .env.example
├── docker-compose.yml
└── pytest.ini
```

## Documentation and screenshots

| Document | Purpose |
|---|---|
| [KPI definitions](docs/KPI_DEFINITIONS.md) | Revenue eligibility, cohorts, funnel, CTR, returns and RFM |
| [Experimentation guide](docs/EXPERIMENTATION_GUIDE.md) | Exposure, attribution, statistics and supported decision scope |
| [Known limitations](docs/KNOWN_LIMITATIONS.md) | Prototype, algorithm, access and platform constraints |
| [PRD narrative](docs/01_PRD_STYLESENSE.md) | Historical product framing; illustrative figures are labelled |
| [SQL analytics narrative](docs/02_SQL_PRODUCT_ANALYTICS.md) | Historical analytics examples; compare with current schema/methodology |
| [Experiment report narrative](docs/03_AB_TESTING_EXPERIMENT_REPORT.md) | Synthetic example, not a real customer trial |
| [Roadmap narrative](docs/04_PRODUCT_ROADMAP_RICE_JIRA.md) | Prioritization and delivery framing |
| [Operations runbook](docs/05_COMMERCE_OPERATIONS_SOPS_CATALOG.md) | Historical commerce operations examples |
| [Portfolio/interview examples](docs/05_RESUME_BULLETS_AND_INTERVIEW_GUIDE.md) | Clearly labelled illustrative material |
| [Initial audit](qa/REMEDIATION_INITIAL_AUDIT.md) / [bug fixes](qa/BUG_FIXES.md) | Traceable defects and repairs |
| [API report](qa/API_TEST_RESULTS.md) / [browser report](qa/BROWSER_TEST_RESULTS.md) | Actual coverage and verification scope |
| [Final acceptance](qa/FINAL_ACCEPTANCE_REPORT.md) | Executed results, outstanding limits and reproducibility |

### Verified interface previews

These screenshots come from the local production-build browser tests, not the historical public URLs.

| Storefront | Product intelligence |
|---|---|
| ![StyleSense storefront](qa/screenshots/1440-_.png) | ![StyleSense dashboard](qa/screenshots/1440-_dashboard.png) |

[All screenshots](qa/screenshots/) include desktop, tablet and mobile routes and an order-confirmation example.

## Troubleshooting

| Symptom | Check / fix |
|---|---|
| `no such table` or missing wishlist/idempotency columns | Run the migration/adoption workflow against the same `DATABASE_URL` used by Uvicorn. Do not delete an existing database as the first fix. |
| Backend cannot be reached | Start Uvicorn on the configured host/port; verify JSON health; inspect `VITE_API_BASE_URL`. |
| Browser CORS error | Export a valid JSON `CORS_ORIGINS` array including the exact frontend scheme, hostname and port, then restart the API. |
| Frontend calls `localhost` after deployment | Set `VITE_API_BASE_URL` before building and redeploy the built assets. |
| Public URL shows ThreadIQ | Correct the Vercel project/repository/root-directory binding; HTTP 200 alone does not verify StyleSense. |
| API health returns HTML | The frontend SPA rewrite is catching the API path. Point API requests at FastAPI or configure an explicit proxy. |
| Invalid-size checkout error | Select a size listed by the current product API. Example sizes are not universal across categories. |
| Duplicate checkout returns 409 | A key was reused for different contents. Preserve a key for retries of the same checkout; use a new one for a new checkout. |
| Playwright reports a port in use | Stop local processes on 8000 and 5173 before launching the isolated browser run. |
| Playwright cannot import backend modules | Point `STYLESENSE_PYTHON` at the backend virtual environment. |
| Browser executable missing | Run `npx playwright install chromium` or set `CHROMIUM_PATH`. |
| Cohort says Pending / experiment has no conversions | These are valid observation states; collect eligible activity/exposure and completed purchases instead of expecting fabricated results. |
| Remote photos do not load | Local fallback images should render; inspect browser/network errors if the fallback is also absent. |
| Docker fails behind a TLS proxy | Supply the approved CA through the optional build secret; keep TLS validation enabled. |

## Known limitations

- Demo personas are not authentication. Production authorization, real payment collection, refunds and fulfilment integrations are not implemented.
- Inventory is stored per product, not per product/size variant. Delivery is free in the simulated checkout; coupons are not supported.
- Recommendations, visual discovery, sizing, return risk and pricing are bounded algorithms/heuristics, not guarantees or externally validated commercial predictions.
- Purchase conversion is the supported experiment launch-decision metric. Other primary metrics need dedicated estimators, guardrails and an experiment plan.
- The personalization flag changes actual ranking; other legacy flags remain configuration metadata and do not all gate features.
- The cart and demo persona use browser storage; wishlists and the documented business records use the database. Persona preferences are not a production customer-account system.
- Gross revenue does not imply a net refund ledger. Unobserved CTR and incomplete retention periods remain unavailable/Pending.
- PostgreSQL and native Windows execution are unverified. Accessibility certification, load/capacity testing and production security audits are not claimed.
- Vite reports a large-bundle warning; Python UTC-timestamp deprecation warnings remain. See the QA report for practical limits.
- The historical Vercel links currently serve a different branded application; publishing this repository is separate from verifying a live deployment.

## Contributing and license

Repository owner: [SrijanSingh2006](https://github.com/SrijanSingh2006). Use [GitHub issues](https://github.com/SrijanSingh2006/stylesense/issues) to report reproducible defects with the route, steps, expected result and environment. Keep secrets and real customer data out of issues, fixtures and commits.

Before proposing changes, run the relevant isolated backend/frontend tests, type checking and production build; add browser checks when changing user journeys. Preserve existing data and migration history. Use meaningful assertions and report unexecuted checks honestly.

The earlier project description stated an MIT license, but this repository currently has no standalone `LICENSE` file. Confirm the intended license with the owner before assuming reuse terms; this README update does not create or change a license grant.
