# Authentication and account test results

Validation date: **16 November 2026, Asia/Calcutta**. Test artifact timestamps may use UTC. Backend Python3.12, isolated temporary SQLite databases; no development database is reset. Real security dependencies and Argon2id/session checks remain enabled in the fixtures.

**53/53 account/auth/security cases passed**, including parameterized cases. These are a subset of the **234/234 passing backend cases**, not an additional53 tests. Source: `backend/tests/test_auth_accounts.py`; raw final artifact: [backend-test-results.xml](backend-test-results.xml).

| Area | Executed coverage | Result |
|---|---|---|
| Registration | Valid customer; normalized duplicate; invalid email; short/weak password; mismatch; terms; forbidden role/status override; no raw-input reflection | PASS |
| Verification | Hash-only stored token, pending user denied login, single-use verify, expiry, invalid token, replacement/resend | PASS |
| Login | Valid credentials, inactive/suspended/deactivated/unverified accounts, persisted rate limit | PASS |
| Access | Live session/status checks, expired JWT, invalid signature, malicious admin role claim ignored | PASS |
| Refresh | Expiry/revocation, rotation, old access invalidation, family reuse revocation, bad/missing CSRF, untrusted/missing Origin and cookie | PASS |
| Concurrent refresh | Two simultaneous uses: one success, one401; all family descendants revoked | PASS |
| Password lifecycle | Generic unknown/known forgot response, invalid/expired/reused token, reset, current-password requirement, reset/change revoke all sessions | PASS |
| Sessions/logout | Safe session listing without secret material, revoke own/foreign denial, logout and logout-all | PASS |
| Account ownership | Profile/preferences, linked recommendation preferences, addresses/default uniqueness, wishlist duplication/persistence, notifications and orders | PASS |
| Cart/checkout | Persistent quantities, foreign item denial, replay-safe guest merge, owned address, checkout replay after cart clear, exact stock, adapter-failure rollback | PASS |
| Cancellation | Completed denied; eligible pending reservation restored exactly once | PASS |
| Avatar | Invalid/non-image and oversized uploads rejected; valid image decoded/re-encoded under random PNG path | PASS |
| Invitations | Staff acceptance, existing account protected, expiry/revocation/replacement | PASS |
| Production/demo | Seeder opt-in and production prohibition; unsafe production secret/cookie/mail/origin configuration rejected | PASS |

The frontend's final Vitest suite has **53 passing cases**, including auth memory-only storage, safe redirects, guards, single-flight refresh, failed refresh, no cross-account retry/late-response leakage, login/register/reset/verify/onboarding/profile/address/order/notification/admin UI behavior and checkout failure recovery. Raw artifact: [frontend-test-results.xml](frontend-test-results.xml).

Real browser verification/reset reads only the isolated filesystem outbox. See [end-to-end evidence](END_TO_END_TEST_RESULTS.md). No SMTP inbox delivery, real payment collection, PostgreSQL runtime/load or independent penetration test is claimed. Local development cookies intentionally permit HTTP; strict production configuration is separately tested. Interrupted refresh responses and simultaneous cross-tab rotation may require sign-in again, as documented.
