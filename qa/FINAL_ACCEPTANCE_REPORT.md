# StyleSense account-platform upgrade — final acceptance

Validation: **16 November 2026, Asia/Calcutta** (raw logs use UTC). Baseline: `6f1a7db733f3454068c6f7a2f082811844bb61c5`. This is an in-place upgrade of the existing application and migration history. Historical business data is preserved; no new account is assigned legacy private records.

## Executed results

| Validation | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Backend pytest, isolated SQLite, two workers | **234** | 0 | 0 |
| Frontend Vitest 5 / React Testing Library | **53** | 0 | 0 |
| Complete Playwright run, production build + real backend | **21** | 0 | 0 |
| **Automated-case total** | **308** | **0** | **0** |
| Additional connected Docker/proxy smoke assertions | **11** | 0 | 0 |

The 53 auth/account backend cases are included in 234; they are not added again. Earlier intermediate test runs and the prior 165-case release are not added to the total. Additional checks: TypeScript no-emit PASS; Vite 8 production build PASS; fresh/legacy/schema-agreement migration checks PASS (four cases included in backend); Docker images build and healthy service startup PASS; frontend npm audit **zero known vulnerabilities**; documentation-link and whitespace checks PASS. Audit evidence is [npm-audit.json](npm-audit.json), not an independent security certification.

Artifacts: [backend JUnit](backend-test-results.xml), [frontend JUnit](frontend-test-results.xml), [Playwright JSON](playwright-results.json), [Docker smoke](docker-smoke.json), [Docker services](docker-services.json), [logs](logs/), [screenshots](SCREENSHOT_INDEX.md). Previous release evidence is retained separately in [PREVIOUS_RELIABILITY_ACCEPTANCE.md](PREVIOUS_RELIABILITY_ACCEPTANCE.md).

## Authentication delivered

Argon2id password hashing; validated normalized unique email; public registration fixed to customer with terms acceptance; pending verification; 24-hour single-use verification; one-hour reset and seven-day staff invitation links; optional TLS SMTP and explicit private development outbox. Unknown-account sensitive responses remain generic. Tokens are stored as hashes, and validation/error/audit outputs avoid raw secrets.

Access JWTs default to five minutes, live only in memory and are checked against a live database session and current verified/active account. Refresh uses a path-scoped HttpOnly cookie, synchronized CSRF and exact trusted Origin. Rotation invalidates old access; old-refresh reuse revokes the family, including in a tested concurrent race. Login and sensitive auth flows have persisted rate limits. Logout/current-session/other-session/all-session revocation, reset/change-password and admin role/status changes invalidate sessions as appropriate.

Frontend restoration blocks private/temporary account content until the session and account cache are ready. Single-flight refresh retries once; late results and requests cannot cross account identities. Login/register/show-hide/strength/confirmation/terms, verify/resend, reset and invitation forms are implemented. No inactive social-login buttons or fabricated delivery messages are presented.

See [authentication tests](AUTH_TEST_RESULTS.md) and [architecture](../docs/AUTHENTICATION_ARCHITECTURE.md).

## Accounts, permissions and workspaces

- Customer: seven-step optional-preference onboarding, profile and safe avatar upload, saved/default addresses, persisted preferences/wishlist/cart, replay-safe guest bag merge, multi-step simulated checkout, immutable order address snapshot, owner-only history/detail, eligible pending cancellation, notifications and session controls.
- Product manager: real analytics/funnel/cohorts, segmentation, experiment/exposure/results, flags, RICE/roadmap and feedback. Release readiness is readable.
- Operations manager: inventory/movements, returns, catalogue quality, simulated pricing and release checklist/readiness edits.
- Admin: searchable/filterable/paginated users, safe details, permitted role/status changes, expiring/revocable staff invitations, audit and registration/maintenance settings. Self privilege edits and loss of the last active admin are guarded, including competing deactivation requests.

Backend dependencies enforce permissions independently of React navigation. Foreign resource identifiers cannot reveal private data. Legacy customer-ID routes enforce current ownership and permissions; a role-transition regression confirms a former customer cannot bypass staff restrictions through legacy order or personal-recommendation endpoints. Public catalogue/search/fit/cold-start browsing remains usable.

See [role tests](RBAC_TEST_RESULTS.md), [permission matrix](../docs/ROLE_PERMISSION_MATRIX.md), [account management](../docs/ACCOUNT_MANAGEMENT.md) and [journeys](../docs/USER_JOURNEYS.md).

## Data and commerce

Alembic 0003 adds users, hash-only sessions/tokens, private resources, invitations/audit/rate/settings and nullable order ownership/address/payment/reservation fields. Tests preserve historical quantities, prices, stock and order totals; historical `user_id` stays null and no user account is silently created or linked. Schema agreement and foreign-key checks pass. Destructive downgrades remain disabled; rollback requires a verified backup.

Checkout uses the server bag and an owned saved address; price/size/quantity/stock are validated server-side. Conditional stock updates, replay identity, order/items/movements, cart clearing and notifications share a transaction. The simulated payment-provider boundary is exercised; rejection rolls back order, stock and bag. Normal completed demonstration orders cannot be cancelled; an eligible pending reservation restores stock exactly once. No real funds, card details, courier dispatch or refunds are processed.

## Browser and container coverage

All 21 browser cases pass on the final dependency set. 31 major routes at five viewports plus seven public-auth routes at four sizes yield 183 responsive route visits. 185 current screenshots are indexed; five older persona captures are historical. Browser flows include real outbox registration/verification, onboarding/avatar/profile/preferences persistence, guest merge, shopping/sizing/wishlist/checkout/order detail, password reset and sessions, staff invitation, role denial, admin suspension/audit, PM experimentation/RICE/feedback, operations inventory/pricing/release gates, failed checkout and 404 handling.

Eleven connected Docker checks exercise JSON API health, seeded catalogue, anonymous denial, customer sign-in/HttpOnly cookie, customer admin denial, saved-address checkout/stock/cart/replay, owned order, invalid-CSRF denial, refresh rotation, logout revocation and SPA deep-link fallback. Both services reached healthy state; test containers were then stopped and volumes retained. Smoke uses isolated synthetic data and per-run environment passwords.

An initial frontend Docker build exhausted the 8 GB VFS runner. Disposable caches/older task images were cleared, and the build stage now uses one writable layer with a read-only ignored-source mount; the final multi-stage build passes. `.env`, private outbox and local files are excluded from contexts. The inherited frontend audit's seven advisories (two critical) were removed by patched React Router 7/Vite 8/Vitest 5 toolchain updates; all frontend and browser checks were rerun.

Detailed fixes and test corrections: [END_TO_END_TEST_RESULTS.md](END_TO_END_TEST_RESULTS.md). No earlier failure is represented as a passing run.

## Files created or modified

[Complete changed-file manifest](ACCOUNT_UPGRADE_FILES.md) lists source/config/docs/test changes separately from screenshot evidence. Main implementation areas:

- Backend account models/schemas/config; auth/security/mail/payment/account services; auth/current-user/admin routes; existing router/legacy guards; order/checkout ownership; migration 0003; explicit demo seeder and first-admin CLI.
- React auth store/provider/guards and API/session client; account/onboarding/auth/admin pages; guest/server cart state, private wishlist and checkout; permission-aware storefront and staff navigation.
- Backend, UI and browser tests/fixtures; isolated browser runner; patched frontend dependency lockfile; Dockerfiles/contexts/Compose; environment reference, README, five account/security guides and current QA artifacts.

## Exact local run

Use Python 3.11+ (verified 3.12), Node 22.12+ (verified native 24 and Docker 22), npm and two terminals. From a fresh checkout:

```sh
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
export AUTH_SECRET_KEY="$(.venv/bin/python -c 'import secrets; print(secrets.token_urlsafe(48))')"
export APP_PUBLIC_URL=http://127.0.0.1:5173
export AUTH_EMAIL_MODE=outbox
.venv/bin/python ../scripts/migrate_legacy.py
.venv/bin/python -m app.seed
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal from the repository root:

```sh
cd frontend
npm ci
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1 npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/register`. Registration is pending until you open the matching private JSON message in `backend/.dev-mail`, copy its verification URL and click Verify email. Then sign in. Keep a stable secret across restarts to retain sessions. The manually started backend reads exported environment variables, not root `.env` automatically. Windows explicit executable/PowerShell equivalents and Docker setup are in the [README](../README.md).

Optional development accounts require `SEED_DEMO_ACCOUNTS=true` and all four `DEMO_CUSTOMER_PASSWORD`, `DEMO_PRODUCT_MANAGER_PASSWORD`, `DEMO_OPERATIONS_MANAGER_PASSWORD`, `DEMO_ADMIN_PASSWORD` values, then `python -m app.seed_accounts` from the activated backend environment. No passwords are shipped. Defaults are `customer@stylesense.example.com`, `product_manager@stylesense.example.com`, `operations_manager@stylesense.example.com`, `admin@stylesense.example.com`; email overrides are optional. This explicit verified-demo seeder is prohibited in production. A non-demo first admin uses `ADMIN_EMAIL`/`ADMIN_PASSWORD` and `python -m app.bootstrap_admin`, followed by real verification. Later staff join through invitations.

Production requires `ENVIRONMENT=production`, stable random `AUTH_SECRET_KEY` (at least 32 characters), Secure cookies, explicit HTTPS frontend/CORS origins, configured TLS SMTP, durable database/media storage and demo seeding disabled. Set `SEED_CATALOGUE_ON_START=false` for production. Prefer same-origin proxy hosting and verify backups/migrations. These are operational requirements, not a claim that production deployment was executed.

## Known issues and remaining limits

No critical functional defect remains in the exercised acceptance flows. This statement is bounded by the actual tests above, not a universal guarantee. SMTP inbox delivery, PostgreSQL runtime parity, native Windows, external production hosting, load/capacity testing, full accessibility certification and independent penetration testing remain unverified. Email tests use a private local outbox; payments remain simulated.

MFA/WebAuthn/OAuth, email change/deletion, breached-password checks, retention jobs, fulfilment/refunds and distributed operations hardening are not implemented. Sessions use sliding expiry with no absolute family lifetime. Interrupted refresh responses or simultaneous tab rotation may trigger strict reuse protection and require sign-in again. Avatars are public media and must not contain confidential images. Inventory remains product-level rather than per size. Recommendation/visual/size/pricing algorithms remain bounded heuristics. Recharts 2 is retained despite upstream deprecation; current frontend package audit is clean. Large-bundle and legacy UTC/Alembic deprecation warnings remain non-blocking.

**Deployment:** no verified public URL for this upgraded frontend/backend pair is available. The README transparently labels historical Vercel URLs that served unrelated ThreadIQ branding at the earlier check. Updating GitHub does not establish a working deployment. See [deployment status and guide](../README.md#deployment-links-and-current-status), [security boundaries](../docs/SECURITY_DESIGN.md) and [known limitations](../docs/KNOWN_LIMITATIONS.md).
