# StyleSense

### AI-Powered Commerce Intelligence & Personalisation Platform

**Discover smarter. Shop better. Understand every interaction.**

StyleSense is an independently branded fashion-commerce portfolio application connecting a customer storefront, product-intelligence dashboard, experimentation tools and business operations through a shared FastAPI backend and relational database.

It combines verified customer accounts, role-controlled workspaces, product discovery, explainable recommendations, sizing assistance, simulated checkout, behavioural analytics and commerce operations in one working codebase. Core features do not require a paid AI API.

> **Project status:** verified local portfolio prototype. All bundled customers, products, events and orders are synthetic. Checkout does not collect payments. Business uplift, reduced returns and realized GMV are not claimed as real customer outcomes. See [verification results](#verification-results) and [known limitations](#known-limitations).

## Contents

- [Deployment links and current status](#deployment-links-and-current-status)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Accounts, email and development users](#accounts-email-and-development-users)
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
- Guest bag with replay-safe login merge; database-backed authenticated cart and saved-address → review → simulated-payment checkout.
- Email verification, password recovery, profile/avatar editing, saved addresses/preferences, owned order history, notifications and active-session controls.
- Seven-step optional-preference onboarding and customer/product-manager/operations/admin workspaces.
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
| Frontend | React 18, TypeScript 5, Vite 8 | Application UI, typed components and builds |
| Styling and icons | Tailwind CSS 3, PostCSS, Lucide React, clsx, tailwind-merge | Shared visual system and responsive layouts |
| Routing | React Router 7 | Storefront, dashboard and operations navigation |
| Data and client state | Axios, TanStack Query 5, Zustand | API requests, isolated server-state queries, memory-only authentication and guest-only cart persistence |
| Charts | Recharts 2 | Funnel and management visualizations |
| Backend | Python, FastAPI, Uvicorn | Versioned REST API and ASGI serving |
| Authentication | Argon2id (`argon2-cffi`), PyJWT, email-validator | Password hashes, short-lived access JWTs, hash-only rotating database sessions |
| Validation | Pydantic 2 | Request/response schemas and input validation |
| Database | SQLAlchemy, SQLite, Alembic | Relational persistence and schema migrations |
| PostgreSQL support | psycopg 3 / SQLAlchemy PostgreSQL dialect | Optional deployment database; runtime parity is not yet verified |
| Search and data dependencies | scikit-learn, NumPy; Pandas retained in requirements | TF-IDF/cosine retrieval and numerical tooling; Pandas is a declared data-tooling dependency |
| Statistics | SciPy and Python math | Fisher exact and two-proportion comparisons |
| Image processing | Pillow, python-multipart | Image validation, uploads and colour extraction |
| Monetary arithmetic | Python Decimal; SQL Numeric for orders/items | Two-decimal checkout calculations and historical order prices |
| Backend tests | Pytest, pytest-xdist, HTTPX / FastAPI TestClient | Isolated API, transaction, concurrency, migration and metric checks |
| Frontend tests | Vitest 5, React Testing Library, jsdom | Actual component, state and API-boundary behaviour |
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
- Node.js **22.12+** and npm.
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

Create and verify a customer at `/register`, or explicitly seed development accounts using the instructions below. Staff workspaces require the appropriate backend role. Purchases and stock changes are simulated but persist in the configured database.

## Accounts, email and development users

Full instructions: [account management](docs/ACCOUNT_MANAGEMENT.md), [authentication architecture](docs/AUTHENTICATION_ARCHITECTURE.md), [role matrix](docs/ROLE_PERMISSION_MATRIX.md), [user journeys](docs/USER_JOURNEYS.md), [security design](docs/SECURITY_DESIGN.md).

### Register and verify locally

Run account CLI examples from `backend` with its virtual environment activated: `source .venv/bin/activate` on POSIX or `./.venv/Scripts/Activate.ps1` in PowerShell. You can also substitute the explicit virtual-environment Python path shown in Quick start.

Use `127.0.0.1` consistently for both frontend and API. From the backend shell, export a stable secret before starting Uvicorn:

```sh
export AUTH_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
export APP_PUBLIC_URL=http://127.0.0.1:5173
export AUTH_EMAIL_MODE=outbox
```

At `/register`, provide a name/email, a matching 12–128-character password and accept the demonstration terms. The default policy requires three of uppercase, lowercase, numbers and symbols. The account stays pending until verification.

**Local email is a private filesystem outbox, not real email.** Open the matching JSON file under `backend/.dev-mail`, copy the verification URL from `body` into the browser and click **Verify email**. Password resets and invitations use the same outbox. Never publish these files. Docker stores them at `/data/dev-mail` in the backend container; inspect through the operator's local filesystem/container access. There is no public outbox API.

After verification, sign in and complete or skip the optional preference steps. You can later edit profile/avatar, addresses and preferences, manage wishlist/cart/orders, read notifications and revoke sessions in `/account`.

### Explicit development accounts

Normal catalogue seeding creates no login accounts. Export strong, distinct passwords and opt in from `backend`:

```sh
export SEED_DEMO_ACCOUNTS=true
export DEMO_CUSTOMER_PASSWORD='YOUR_GENERATED_STRONG_CUSTOMER_PASSWORD'
export DEMO_PRODUCT_MANAGER_PASSWORD='YOUR_GENERATED_STRONG_PM_PASSWORD'
export DEMO_OPERATIONS_MANAGER_PASSWORD='YOUR_GENERATED_STRONG_OPS_PASSWORD'
export DEMO_ADMIN_PASSWORD='YOUR_GENERATED_STRONG_ADMIN_PASSWORD'
python -m app.seed_accounts
```

Replace the placeholders; there are no shipped passwords. In PowerShell use `$env:NAME = 'value'`. In Docker pass the same variables and execute `docker compose exec backend python -m app.seed_accounts`. Existing accounts are neither reset nor promoted by a repeat seed. Production forbids this seeder. Disable the flag after use.

| Role | Default email | Workspace |
|---|---|---|
| Customer | `customer@stylesense.example.com` | `/onboarding`, then `/account` |
| Product manager | `product_manager@stylesense.example.com` | Analytics, experiments, segments, flags, roadmap and feedback |
| Operations manager | `operations_manager@stylesense.example.com` | Inventory, returns, catalogue, pricing and release edits |
| Admin | `admin@stylesense.example.com` | `/admin`, user access, invitations, audit/settings and management tools |

Each role's email can be overridden with `DEMO_<ROLE>_EMAIL`. Staff cannot self-register into privileged roles. To create the first administrator without demo accounts, export `ADMIN_EMAIL`, `ADMIN_PASSWORD` and optional `ADMIN_FULL_NAME`, then run `python -m app.bootstrap_admin`. This account also requires email verification. Later staff join through administrator-issued single-use seven-day invitations.

### Session and ownership rules

Access JWTs expire after five minutes by default and live only in memory. The HttpOnly refresh cookie rotates against hash-only database sessions. Cookie mutations require trusted Origin and synchronized CSRF; reset/password changes and role/status changes invalidate sessions. Permission checks use the current database role. Protected pages redirect anonymous users to sign-in; direct API access is also enforced.

Addresses, wishlists, carts, preferences, notifications and orders are current-user scoped. Historical synthetic personas and orders remain unclaimed; registration never grants their history. Checkout revalidates the owned address, prices, sizes and stock and stores an address snapshot. Payment selection is simulated; no card data or funds are processed. Only eligible pending reserved orders can be cancelled; normal completed demonstration orders cannot.

## Configuration

The root [`.env.example`](.env.example) is a reference. **The Python backend does not automatically load that file**: export its supported variables in the shell or pass them through your hosting/container configuration. Vite supports a `frontend/.env.local` file.

| Variable | Component | Default / meaning |
|---|---|---|
| `ENVIRONMENT` | Backend | `development`; production activates strict secret/cookie/origin/mail/demo checks |
| `AUTH_SECRET_KEY` | Backend | Stable random secret, at least 32 characters required in production; omitted development value is ephemeral and invalidates sessions on restart |
| `AUTH_ACCESS_SECONDS` / `AUTH_REFRESH_DAYS` | Backend | `300` / `7`; access 60–900 seconds, refresh 1–30 days; ordinary non-remembered login uses one day |
| `AUTH_COOKIE_SECURE` / `AUTH_COOKIE_SAMESITE` | Backend | `false` / `lax` locally; production requires Secure; `none` also requires Secure |
| `APP_PUBLIC_URL` | Backend | `http://127.0.0.1:5173`; frontend URL used in verification/reset/invitation links |
| `AUTH_EMAIL_MODE` / `AUTH_OUTBOX_DIR` | Backend | `outbox`, private `backend/.dev-mail`; `smtp` required in production |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USERNAME`, `SMTP_PASSWORD` | Backend | Optional configured TLS provider; default port 587, SSL on 465 |
| `AUTH_PASSWORD_COMPLEXITY` | Backend | `true`; mandatory length 12–128 remains enforced when disabled |
| `AUTH_LOGIN_LIMIT` / `AUTH_RATE_WINDOW_SECONDS` | Backend | `5` failed email login attempts per 900 seconds; additional IP/endpoint limits apply |
| `SEED_DEMO_ACCOUNTS` / `DEMO_<ROLE>_PASSWORD` | Seeder | Explicit opt-in, defaults false; all role passwords required; forbidden in production |
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

The script verifies the original table/column layout, creates a timestamped SQLite backup, adopts the frozen baseline and applies the reliability and account migrations. It refuses an unknown schema. Invalid legacy stock, quantities or prices stop the repair migration rather than being silently deleted. Keep and verify the printed backup path.

Migrations add checkout replay protection, safe historical monetary columns, stock/item constraints, event keys, accounts, private account resources, hash-only sessions/tokens and order ownership. Migration 0003 leaves existing orders with null ownership and never assigns historical records to new users. Destructive downgrades are intentionally disabled; restore a verified backup when a schema rollback is necessary.

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
| Authentication | `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | Verified customer access and recovery |
| Onboarding | `/onboarding` | Seven-step optional preference setup |
| Account | `/account`, `/account/profile`, `/account/orders`, `/account/orders/:id` | Private overview, profile/avatar and owned orders |
| Account | `/account/addresses`, `/account/preferences`, `/account/wishlist` | Saved personal resources |
| Security | `/account/security`, `/account/notifications` | Password/session controls and notifications |
| Staff invitation | `/accept-invitation` | Set password using a valid staff invitation |
| Administration | `/admin`, `/admin/users`, `/admin/users/:id` | Admin overview, search/filter and role/status changes |
| Administration | `/admin/invitations`, `/admin/audit-logs`, `/admin/settings` | Staff invitation lifecycle, audit and system settings |
| Legacy link | `/account/demo` | Redirects to authenticated `/account` |
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
| Authentication | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`; `GET /auth/me`, `/auth/csrf`, `/auth/policy` |
| Recovery / sessions | `POST /auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password`, `/auth/accept-invitation`; `GET /auth/sessions`, `DELETE /auth/sessions/{id}` |
| Account | `GET/PATCH /users/me`, `POST /users/me/avatar`; address CRUD, preferences GET/PATCH, notifications/activity |
| Private commerce | `/users/me/wishlist`, `/users/me/cart`, `/users/me/cart/items`, `/users/me/cart/merge`, `/users/me/checkout`, `/users/me/orders` and owned order detail/cancellation |
| Administration | `/admin/users`, `/admin/users/{id}/status`, `/admin/users/{id}/role`, `/admin/invitations`, `/admin/audit-logs`, `/admin/settings` |
| Legacy checkout | `POST /orders` (authenticated owner + saved owned address required) |
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

Example current-account simulated checkout — first save an owned address and populate `/users/me/cart/items`:

```json
{
  "address_id": 1,
  "session_id": "your-shopping-session",
  "idempotency_key": "unique-checkout-request-001",
  "payment_method": "simulated_upi"
}
```

Send `Authorization: Bearer ACCESS_TOKEN` to private APIs. Login/register/refresh and token-consumption requests require a trusted `Origin`; refresh/logout additionally require the HttpOnly cookie and matching `X-CSRF-Token`. Product and search APIs remain public. Interactive Swagger supports bearer authentication. Do not paste actual session secrets into issues or screenshots.

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

Recorded account-upgrade validation on **16 November 2026 (Asia/Calcutta)**:

| Suite/check | Result |
|---|---|
| Backend pytest | **234 passed**, 0 failed/skipped |
| Frontend Vitest 5 | **53 passed**, 0 failed/skipped |
| Production-build Playwright | **21 passed**, 0 failed/skipped/flaky |
| **Automated-case total** | **308 passed** |
| Additional connected Docker/proxy checks | **11 passed**; both services healthy |
| TypeScript, production builds and migrations | Passed |
| Frontend npm advisory audit | **0 known vulnerabilities** |

Current upgrade evidence is recorded in [final acceptance](qa/FINAL_ACCEPTANCE_REPORT.md), [authentication results](qa/AUTH_TEST_RESULTS.md), [RBAC results](qa/RBAC_TEST_RESULTS.md) and [browser results](qa/END_TO_END_TEST_RESULTS.md). Raw JUnit and Playwright output is under `qa/`. The previous reliability release's 165-case report is retained separately as historical evidence and is not added to current counts.

Validation runs against isolated SQLite databases and a real FastAPI server/production-built frontend. PostgreSQL runtime, Windows PowerShell, actual SMTP inbox delivery, external deployment and independent penetration testing remain unverified. Passing development checks does not establish a commercial production security certification.

### Run backend tests

From the repository root, after installing backend dependencies:

```sh
backend/.venv/bin/python -m pytest -q -n 2 --disable-warnings --junitxml=qa/backend-test-results.xml
```

PowerShell equivalent:

```powershell
./backend/.venv/Scripts/python.exe -m pytest -q -n 2 --disable-warnings --junitxml=qa/backend-test-results.xml
```

Tests use independent temporary SQLite databases and FastAPI dependency overrides. No test resets the normal development database. Coverage includes quantity and size errors, exact stock effects, concurrent buyers, idempotent replay, rollback, historical revenue, cohort arithmetic, experiment attribution, wishlist persistence, account isolation, session rotation/reuse/CSRF/rate limits, role restrictions, password lifecycle and migrations.

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

Browser tests generate per-run passwords and a stable per-run auth secret, explicitly seed four role accounts, use a private test outbox, launch their own backend with a temporary database and serve the production frontend build on port 5173. Stop development servers using ports 8000 or 5173 first. The runner discovers `backend/.venv`; otherwise set `STYLESENSE_PYTHON` to an absolute executable path. In PowerShell from `frontend`:

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
- Backend startup runs migrations; Compose opts into non-destructive synthetic catalogue seeding with `SEED_CATALOGUE_ON_START=true`. Login accounts require a separate explicit seed command. Production image startup does not seed a catalogue by default.
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

Run `alembic upgrade head` against the intended database. Seed only an intended synthetic demo database. Verify that `https://YOUR_API_HOST/api/v1/health` returns JSON, then check `/docs` and a real product request. Configure `ENVIRONMENT=production`, a strong stable `AUTH_SECRET_KEY`, Secure cookies, explicit HTTPS frontend/CORS origins and TLS SMTP; keep demo-account seeding disabled. Bootstrap and verify the first admin, then invite staff. See [production requirements](docs/ACCOUNT_MANAGEMENT.md#production-configuration). Prefer same-origin hosting for cookie reliability. No independent security certification or production load guarantee is claimed.

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
│   │   ├── auth/               # Memory-only session restoration and role guards
│   │   ├── store/              # Server cart, guest-only persistence and display preferences
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
| [Account setup](docs/ACCOUNT_MANAGEMENT.md) | Verification/outbox, demo users, first admin and production configuration |
| [Authentication](docs/AUTHENTICATION_ARCHITECTURE.md) | Sessions, rotation and account lifecycle |
| [Roles](docs/ROLE_PERMISSION_MATRIX.md) | Backend permissions and resource ownership |
| [User journeys](docs/USER_JOURNEYS.md) | Customer, staff and admin flows |
| [Security](docs/SECURITY_DESIGN.md) | Implemented controls and practical boundaries |
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
| ![Account sign in](qa/screenshots/auth-1440-login.png) | ![User administration](qa/screenshots/1440-_admin_users.png) |

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

- Accounts and backend permissions are implemented; MFA/OAuth, self-service email change/deletion, independent penetration testing and production operations guarantees are not. Real payment collection, refunds and fulfilment integrations remain unimplemented.
- Inventory is stored per product, not per product/size variant. Delivery is free in the simulated checkout; coupons are not supported.
- Recommendations, visual discovery, sizing, return risk and pricing are bounded algorithms/heuristics, not guarantees or externally validated commercial predictions.
- Purchase conversion is the supported experiment launch-decision metric. Other primary metrics need dedicated estimators, guardrails and an experiment plan.
- The personalization flag changes actual ranking; other legacy flags remain configuration metadata and do not all gate features.
- Only the anonymous bag uses local browser storage. Authenticated account resources live in the database; access/CSRF values are memory-only and refresh uses an HttpOnly cookie. Interrupted refresh responses and cross-tab races may require a new login. Local outbox is not real email delivery.
- Gross revenue does not imply a net refund ledger. Unobserved CTR and incomplete retention periods remain unavailable/Pending.
- PostgreSQL and native Windows execution are unverified. Accessibility certification, load/capacity testing and production security audits are not claimed.
- Vite reports a large-bundle warning; Python UTC-timestamp deprecation warnings remain. See the QA report for practical limits.
- The historical Vercel links currently serve a different branded application; publishing this repository is separate from verifying a live deployment.

## Contributing and license

Repository owner: [SrijanSingh2006](https://github.com/SrijanSingh2006). Use [GitHub issues](https://github.com/SrijanSingh2006/stylesense/issues) to report reproducible defects with the route, steps, expected result and environment. Keep secrets and real customer data out of issues, fixtures and commits.

Before proposing changes, run the relevant isolated backend/frontend tests, type checking and production build; add browser checks when changing user journeys. Preserve existing data and migration history. Use meaningful assertions and report unexecuted checks honestly.

The earlier project description stated an MIT license, but this repository currently has no standalone `LICENSE` file. Confirm the intended license with the owner before assuming reuse terms; this README update does not create or change a license grant.
