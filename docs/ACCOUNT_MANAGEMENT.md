# Account management and local setup

Install and migrate using the README. Run the following commands from `backend` with its virtual environment activated (`source .venv/bin/activate` on POSIX; `./.venv/Scripts/Activate.ps1` in PowerShell), or use its explicit Python executable path. Export variables into the backend shell; copying `.env.example` alone does not load variables into a manually launched Python process. Docker Compose reads root `.env` for interpolation and passes documented variables explicitly.

## Local verification and password reset

Use the same hostname consistently: frontend `http://127.0.0.1:5173`, backend `http://127.0.0.1:8000`. Build/dev frontend with `VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1`. Set a stable random `AUTH_SECRET_KEY` for repeatable sessions across backend restarts:

```sh
export AUTH_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
export APP_PUBLIC_URL=http://127.0.0.1:5173
export AUTH_EMAIL_MODE=outbox
```

In another shell, start the frontend after installing dependencies. Register at `/register`, accept the demonstration terms, then open the private development outbox **on the backend filesystem**. Default directory is `backend/.dev-mail`; Docker uses `/data/dev-mail` inside the backend container. A message JSON file contains `to`, `subject`, `body` and creation time. Copy the full verification URL in its body into your browser and click **Verify email**. Then sign in and finish the seven-step optional-preference onboarding. Password reset and invitation links use the same delivery mechanism. Do not publish the outbox or commit its contents.

For local inspection from `backend`:

```sh
python -c "from app.core.auth_config import auth_settings; print(auth_settings.outbox)"
```

Inspect the relevant JSON message with your editor. There is deliberately no public outbox endpoint. Outbox mode never sends a real email. To use a real provider set `AUTH_EMAIL_MODE=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and optional `SMTP_USERNAME`/`SMTP_PASSWORD`. Port465 uses implicit TLS; other ports require STARTTLS. Actual inbox delivery has not been tested in the recorded QA.

## Optional development accounts

Accounts are **not** created by normal catalogue seeding. From `backend`, export all four passwords and explicitly opt in:

```sh
export SEED_DEMO_ACCOUNTS=true
export DEMO_CUSTOMER_PASSWORD='YOUR_GENERATED_STRONG_CUSTOMER_PASSWORD'
export DEMO_PRODUCT_MANAGER_PASSWORD='YOUR_GENERATED_STRONG_PM_PASSWORD'
export DEMO_OPERATIONS_MANAGER_PASSWORD='YOUR_GENERATED_STRONG_OPS_PASSWORD'
export DEMO_ADMIN_PASSWORD='YOUR_GENERATED_STRONG_ADMIN_PASSWORD'
python -m app.seed_accounts
```

Replace placeholders with distinct strong passwords; they must satisfy the 12–128-character policy. No passwords are printed or shipped in source. Default account emails are:

| Role | Default email | Landing page |
|---|---|---|
| Customer | `customer@stylesense.example.com` | `/onboarding`, then `/account` |
| Product manager | `product_manager@stylesense.example.com` | `/dashboard` |
| Operations manager | `operations_manager@stylesense.example.com` | `/operations/inventory` |
| Administrator | `admin@stylesense.example.com` | `/admin` |

Optional `DEMO_<ROLE>_EMAIL` variables override these. The command uses the supplied password only when creating a missing account; reruns do not reset credentials or promote accounts. Demo accounts are explicitly verified for local testing. `ENVIRONMENT=production` rejects this opt-in both at configuration and in the seeder. Disable the flag after use. To seed in Docker, set the same variables and run `docker compose exec backend python -m app.seed_accounts`; starting containers alone never seeds accounts.

PowerShell exports use `$env:NAME = 'value'`, for example `$env:SEED_DEMO_ACCOUNTS = 'true'`. All other variable names and Python module commands are the same.

## First administrator without demo seeding

Export `ADMIN_EMAIL`, `ADMIN_PASSWORD`, optionally `ADMIN_FULL_NAME`, then run:

```sh
python -m app.bootstrap_admin
```

For Docker, export the operator values in your host shell and forward them only to the one-off command: `docker compose exec -e ADMIN_EMAIL -e ADMIN_PASSWORD -e ADMIN_FULL_NAME backend python -m app.bootstrap_admin`. Omit `-e ADMIN_FULL_NAME` when that optional variable is unset.

This command creates the first admin only, pending email verification. Use the emailed/outbox link before signing in. It refuses existing email ownership or an existing administrator. Later staff creation uses `/admin/invitations`. Invitations are single-use, expire in seven days and can be revoked before acceptance. Roles/status changes are recorded in the audit log and invalidate sessions as appropriate.

## Customer resources

Profile name/phone and validated avatar can be updated. Email is a verified identifier; email changes are not exposed. Avatars are decoded, re-encoded to a bounded PNG with a random filename and served as public media. Do not upload confidential images. Preferences persist and inform existing recommendation ranking. Addresses support CRUD, type and one default; purchase stores a separate snapshot so later edits do not rewrite orders.

The guest bag uses browser storage. Signing in merges it once using a replay-safe merge key; authenticated bags, wishlists and orders live in the database. Logging out clears private client caches and bag content. Checkout requires an owned saved address, rechecks stock and price and uses a server-side simulated-payment adapter. No card fields or real payment collection exist. Completed demo orders cannot be cancelled; pending reserved orders support one cancellation and stock restoration. There is no fulfilment/refund ledger.

Notifications cover registration, verification, password/security changes, orders and staff/admin changes. Security & sessions lists active devices, revokes current/other sessions, signs out everywhere and changes passwords. Password reset/change signs out all previous sessions.

## Production configuration

Required: `ENVIRONMENT=production`, a stable random `AUTH_SECRET_KEY` of at least 32 characters, `AUTH_COOKIE_SECURE=true`, HTTPS `APP_PUBLIC_URL`, explicit HTTPS `CORS_ORIGINS`, `AUTH_EMAIL_MODE=smtp`, `SMTP_HOST`, actual provider credentials where needed, and `SEED_DEMO_ACCOUNTS=false`. Set `SEED_CATALOGUE_ON_START=false` in production to avoid loading synthetic catalogue data. Use a durable database and upload storage. Back up before migrations. Keep frontend and API same-site or preferably behind the provided same-origin proxy. If cross-site cookies are unavoidable, `AUTH_COOKIE_SAMESITE=none` requires Secure, and browser third-party-cookie restrictions still apply. No blanket production-readiness or external security-audit claim is made.
