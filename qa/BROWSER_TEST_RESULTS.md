> **Historical reliability-release report.** Current account-upgrade results are in [FINAL_ACCEPTANCE_REPORT.md](FINAL_ACCEPTANCE_REPORT.md) and [END_TO_END_TEST_RESULTS.md](END_TO_END_TEST_RESULTS.md).

# Browser results

**11 passed, 0 failed, 0 skipped.** Chromium on Linux; Playwright launches the actual backend and serves the production frontend build.

- Five complete route/viewport sweeps: 20 route entries each.
- Customer: search, category filter, product, sizing, wishlist refresh, bag, order and stock check.
- Failure: failed order never confirms; cart and delivery input remain.
- Product manager: experiment creation/start, explicit exposure, result counts, flag update and RICE roadmap task.
- Operations: UI replenishment, stock verification, returns, catalogue resolution, promotion slider, failed gate and release approval.
- Console errors and uncaught exceptions checked across all route entries.
- 404 return navigation and operations redirect checked.

Native image/font network failures were intentionally introduced to test local fallbacks; these expected diagnostics are distinguished from application errors. No claim of manual testing on physical devices is made.
