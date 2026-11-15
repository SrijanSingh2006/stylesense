# End-to-end browser results

Validation date: **16 November 2026, Asia/Calcutta**; raw timestamps use UTC. Final complete execution: **21 passed, 0 failed, 0 skipped, 0 flaky** in approximately 4 minutes. The suite uses Chromium, a production Vite build and an actual FastAPI server. Database, uploads, email outbox, auth secret and four role passwords are isolated per run. No normal development data is reset.

Raw evidence: [playwright-results.json](playwright-results.json) and [logs/browser.txt](logs/browser.txt). Tests: `frontend/e2e/accounts.spec.ts`, `application.spec.ts`, `helpers.ts`; environment runner: `frontend/playwright.config.ts`. Passwords are generated per run and never printed. Failure traces are ignored by Git and may contain sensitive test request material; only passing final results are committed.

| Group | Cases | Executed behavior |
|---|---:|---|
| New customer | 1 | Guest bag; register; local-outbox verification in same tab; seven-step onboarding; avatar; saved address; profile/preferences; wishlist; logout/login persistence; simulated checkout, owned order detail and notification read |
| Staff invitation | 1 | Admin invitation, private outbox acceptance, actual PM role landing and operations/admin denial |
| Password recovery | 1 | Local-outbox reset, new password, session view, logout-all and reused-link rejection |
| Customer restrictions | 1 | Direct protected management APIs403 and unauthorized admin page |
| Responsive public auth | 4 | Login/register/forgot/verify/reset/invitation/terms at 1440,768,390,360 widths |
| Admin access lifecycle | 1 | User search, suspension, old bearer rejected, reactivation and audit trail |
| Anonymous access | 1 | Account/dashboard/admin redirect to login; private APIs401 without records |
| Responsive major routes | 5 | **31 routes × five viewports = 155 visits**, local image fallbacks, no page errors, no failed API responses or document overflow |
| Existing customer commerce | 1 | Search/category filter, size assistant, wishlist reload, server bag, saved-address checkout and exact stock reduction |
| Failed checkout | 1 | Injected500 never confirms an order; bag and selected simulated method remain available |
| Product manager | 1 | Analytics/funnel, experiment creation/start/exposure/results, flags, explicit RICE 6000 roadmap, feedback conversion and denied inventory access |
| Operations | 1 | Actual stock inbound, returns/catalogue, pricing simulation, mandatory release gates and readiness approval |
| Console/route smoke | 1 | No unexpected console/page errors while visiting all 31 routes |
| Unknown/deep route | 1 | Usable404, return link and operations redirect |
| **Total** | **21** | **All pass in the final complete run** |

Major-route viewports: 1440×900,1366×768,768×1024,390×844 and 360×800. Public-auth visits add **7 routes × 4 sizes = 28**, for 183 route/viewport visits across the two responsive groups. Screenshots: [index](SCREENSHOT_INDEX.md) and [directory](screenshots/). These include important auth/account/admin screens, the customer order confirmation and admin audit journey. Historical persona screenshots remain clearly excluded from the current index.

## Defects and test corrections found during execution

- Session restoration initially allowed a temporary anonymous tree to mount, resetting a search typed during reload. AuthProvider now waits for restoration and account-cache isolation before rendering the page.
- Verification/reset token state originally captured the URL fragment only on initial mount. Token pages now respond when a valid message link changes the hash in the same tab. A dedicated frontend regression test covers this.
- Preference chips used visually hidden inputs that were awkward to activate directly; native visible checkboxes now provide an accessible click/focus target.
- A release test checked buttons before its asynchronous reload completed; it now waits for the actual checklist after each mutation.
- A wishlist test immediately reloaded while its initial refresh request was in flight. The final test waits for the loaded wishlist before testing reload persistence. An interrupted refresh response or concurrent tab rotation can still require sign-in again under strict reuse protection; this is disclosed as a session limitation, not masked as seamless restoration.

Earlier failures and intermediate passing runs are not added to the 21-case total. Screenshots were also visually inspected for mobile registration and desktop admin layout. Browser checks do not establish full accessibility compliance, penetration-test assurance or capacity. Actual SMTP inbox delivery, real payments, PostgreSQL runtime, native Windows and public deployment were not exercised.
