# Authentication architecture

StyleSense adds accounts to the existing FastAPI/React application. The server is the authority for identity, account status, permissions and ownership. No browser persona controls access.

## Components

| Component | Responsibility |
|---|---|
| `core/auth_config.py` | Environment validation, cookie and expiry policy |
| `models/account.py` | Users, sessions, single-use tokens, private account resources, audit and rate buckets |
| `services/security.py` | Argon2id, JWT, database session validation, Origin/CSRF, permissions, rate limits |
| `routes/auth.py` | Registration, verification, login, refresh, resets, sessions, invitation acceptance |
| `routes/accounts.py` | Current-user resources, persisted cart, checkout and owned orders |
| `routes/admin.py` | User status/roles, staff invitations, audit and safe public settings |
| `services/mail.py` | Private development outbox or explicitly configured SMTP |
| `frontend/src/auth` | Memory-only auth store, restoration, route guards and public policy |
| `frontend/src/services/api.ts` | Bearer headers, single-flight rotation and one retry |

```mermaid
sequenceDiagram
    participant Browser
    participant API
    participant DB
    Browser->>API: Login (email/password + trusted Origin)
    API->>DB: Check Argon2id, active verified user; insert hashed refresh session
    API-->>Browser: JWT + CSRF JSON; HttpOnly refresh cookie
    Browser->>API: Protected request (Authorization: Bearer JWT)
    API->>DB: Check session, user status, current role, owned resource
    API-->>Browser: Authorized result
    Browser->>API: GET auth/csrf with HttpOnly cookie (reload only)
    API-->>Browser: Synchronized CSRF token
    Browser->>API: POST auth/refresh (cookie + Origin + CSRF)
    API->>DB: Atomically revoke old session; create same-family replacement
    API-->>Browser: New JWT, CSRF and rotated HttpOnly cookie
```

## Credentials and sessions

Passwords use Argon2id (19 MiB memory, two iterations, one lane); plaintext is never stored. Policy is 12–128 characters and three character categories by default. The complexity requirement is configurable, length bounds remain mandatory. Unknown-account login verifies a dummy hash. Password mismatch, inactive and unverified accounts have the same login failure message.

Access JWTs use HS256 with fixed issuer/audience, five-minute default expiry, subject and session ID. Each request also checks a live database session and active, verified user. A role claim cannot grant permissions. Access and CSRF values live only in memory. No credentials enter persisted Zustand state or browser storage.

Refresh tokens are 48-byte cryptographically random URL-safe secrets. Only SHA-256 hashes are stored in `user_sessions`. Cookies are HttpOnly, path `/api/v1/auth`, SameSite Lax by default, Secure mandatory in production. Remember-device sessions last seven days by default; ordinary login creates a one-day session cookie. Rotation renews this interval. There is no separate absolute family lifetime. Refresh token reuse revokes the whole family. Rotating an access session invalidates its previous JWT immediately.

Cookie-authenticated refresh/logout require a trusted exact Origin and synchronized CSRF header. On reload the frontend retrieves CSRF through the restricted bootstrap endpoint. Ordinary private APIs require a bearer token and cannot be authorized by the cookie alone. Separate frontend/API production hosts should use the same registrable site; browser third-party-cookie policies can otherwise prevent restoration.

The API client deduplicates refresh within one tab and retries a request once. It rejects late responses after an account change. AuthProvider clears private query caches before mounting another account. An interrupted refresh response or two tabs racing rotation can trigger reuse detection and require sign-in again; multi-tab rotation coordination is a remaining improvement.

## Account lifecycle

Registration always creates a pending customer with a **new** customer profile. Verification tokens expire in 24 hours; reset links in one hour; staff invitations in seven days. Only hashes are stored. Issuing a replacement verification/reset token consumes prior unused ones. Tokens are consumed atomically and once. Email links carry tokens in URL fragments; the browser clears the fragment after successful consumption.

Verification is required before login. Forgot/reset initiation and resend use the same response for known and unknown emails. Reset/change-password revoke every session. Logout revokes the current family; logout-all revokes every user session. Revoking an individual session also revokes its family. Suspension/deactivation and role changes revoke sessions; permissions are checked from the database on every request.

Development delivery writes 0600 JSON files in a private 0700 outbox directory. It is not mounted as static media and has no API reader. SMTP uses TLS (SSL on 465 or STARTTLS otherwise). SMTP acceptance does not prove inbox delivery. Production refuses outbox mode. See [account setup](ACCOUNT_MANAGEMENT.md) and [security boundaries](SECURITY_DESIGN.md).

## Migration

Migration `0003` creates account resources and adds nullable `orders.user_id`, an address snapshot, payment method and explicit reservation flag. Historical orders, wishlists, customers and events remain intact and unclaimed. No signup is linked to an old persona or its purchases. Private order reads require `Order.user_id == current_user.id`, including for administrators. Destructive downgrades are disabled; use verified backups for rollback.
