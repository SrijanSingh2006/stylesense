> **Historical reliability-release report.** Current account-upgrade results are in [FINAL_ACCEPTANCE_REPORT.md](FINAL_ACCEPTANCE_REPORT.md) and [END_TO_END_TEST_RESULTS.md](END_TO_END_TEST_RESULTS.md).

# Test results

Final case counts: backend **135/135**, frontend **19/19**, Playwright **11/11**. Total **165 executed, 165 passed, 0 failed, 0 skipped, 0 blocked**. Docker connected smoke checks: **5/5** in addition to the case total. TypeScript and production build passed.

| Feature | Test case | Expected output | Actual output | Status |
|---|---|---|---|---|
| Checkout | Stock 5, buy 1/2/5 | Stock 4/3/0, exact money | Asserted by isolated tests | PASS |
| Checkout | Buy 6/-2/0, invalid/missing/decimal quantity | Reject with no order/items/event/stock effect | Asserted unchanged DB | PASS |
| Concurrency | Two buyers compete for 5 units | No oversell or duplicate purchase event | One valid purchase, stock correct | PASS |
| Replay | Same checkout key twice | Same order and one stock reduction | Same stored order returned | PASS |
| Error handling | 400/404/422/500/network/timeout | No confirmation; input/cart retained | Asserted in frontend and browser | PASS |
| Cohorts | Known UTC activities and incomplete windows | Exact rates, Pending for incomplete weeks | Hand-calculated results matched | PASS |
| Revenue | Historical unit prices, quantities and cancelled/old orders | Correct completed revenue and dates | Exact fixture totals matched | PASS |
| Experiments | Zero/small/unequal/full-conversion groups and attribution | Real samples/converters, correct tests | Independent Fisher/z values matched | PASS |
| Wishlist | Duplicate saves, reload, removal, unavailable item | Persisted unique customer entries | API and browser checks matched | PASS |
| Migrations | Fresh/legacy/invalid original database | Upgrade and preserve valid data; stop invalid data | Passed isolated migration tests | PASS |
| UI | 20 route entries x 5 viewport sizes | No document overflow, broken images or API failures | 100 visits with screenshots | PASS |
| Docker | Build and connected production proxy | Healthy services, replay-safe checkout | Five connected checks passed | PASS |

Detailed scope and untested platforms: FINAL_ACCEPTANCE_REPORT.md. Tests that failed during development were fixed and rerun; counts above describe the final completed runs, not a claim that every attempted run succeeded.
