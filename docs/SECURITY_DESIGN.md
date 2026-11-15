# Security design and boundaries

## Implemented controls

- Argon2id password hashing, configurable complexity and mandatory length bounds. Generic login errors and dummy-hash work for unknown users. Unique normalized emails. Public registration forbids extra fields and creates customers only.
- Short-lived signed access JWTs, fixed algorithm/issuer/audience and live database session checks. Actual account status, verification and role are checked on the server for every private request.
- Hash-only rotating refresh/session, verification, reset and invitation secrets. HttpOnly refresh cookie; synchronized CSRF and exact Origin enforcement for cookie-authenticated mutations. Refresh reuse revokes the family. Access tokens/CSRF are memory-only.
- Persistent database rate buckets for login by IP/email, registration, reset/verification/invitation attempts and password changes. Counters use hashed keys and atomic upserts; successful login clears its email-failure bucket. The application uses the direct peer address, not untrusted forwarded-IP headers.
- Backend router permissions plus owner-filtered account queries. Legacy customer-ID routes cannot bypass ownership. Role/status mutations serialize and recheck the actor; self edits and removing the last active admin are guarded.
- Verification/reset/invite links expire, are hashed and atomically consumed. Reset/change revoke all sessions. Replacement invitations revoke previous active ones. Email fragments avoid query-string access logs.
- Explicit ORM/schema field selection and sanitized validation errors avoid password/raw-input reflection. SQL and unexpected errors log exception class only. Audit metadata is deliberately selected, never raw request bodies, credentials or tokens. Private API responses set `Cache-Control: no-store`.
- Avatar uploads enforce size/type/decoding/pixel bounds, use random names and re-encode to bounded PNG; original filenames and image metadata are discarded. Public avatar media is not confidential storage.
- Private development outbox files use 0600 and directory 0700, are gitignored and unmounted from web hosting. SMTP uses TLS. Production refuses unsafe secret/cookie/origin/mail/demo configuration.
- Server-calculated monetary totals, bounded positive quantities, valid sizes, owned saved addresses, replay keys and conditional stock decrements. Order/cart/notification writes share one transaction; payment-adapter failure rolls everything back. Simulated payments never collect card data.
- React clears private query caches at account changes, rejects late account responses and prevents retries under another user. Guest bag persistence excludes authenticated cart rows. Route guards never substitute for backend authorization.

## Deliberate limits and operational work

This is an exercised portfolio implementation, not a penetration-test certificate. The final QA distinguishes actual SQLite/browser checks from unexecuted SMTP inbox delivery, PostgreSQL runtime parity, distributed load and external deployment.

There is no MFA/WebAuthn, OAuth/social login, self-service email change/deletion, device attestation, breached-password service, long-term token/rate/audit retention job or immutable external audit store. Rate-limit tuning and trusted-proxy client IP configuration require deployment-specific decisions; multiple users behind a proxy may share a limit. Interrupted refresh responses or separate tabs racing refresh may trigger safe reuse detection and require a fresh login. Sessions use a sliding expiry with no additional absolute family lifetime.

Set a stable production secret through a secret manager; rotating it invalidates JWTs and CSRF derivation. Back up databases/uploads, apply migrations before startup, restrict private outbox access and configure durable storage/TLS. Default local cookies intentionally permit HTTP; production rejects that setting. Cross-site hosting can be blocked by third-party-cookie policies even with SameSite=None. Prefer the supplied same-origin Nginx proxy.

Do not claim real payments, fulfilment, email inbox delivery or an audited commercial security posture. See [known limitations](KNOWN_LIMITATIONS.md) and the actual [acceptance report](../qa/FINAL_ACCEPTANCE_REPORT.md).

## Dependency audit

The final frontend toolchain uses patched React Router 7, Vite 8 and Vitest 5 releases. The inherited frontend audit reported seven advisories (including two critical); the upgraded lockfile audit reports zero known vulnerabilities at validation time. See `qa/npm-audit.json`. This is a package advisory check, not a penetration test or a complete backend supply-chain audit.
