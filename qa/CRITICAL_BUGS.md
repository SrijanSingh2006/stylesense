# Critical and high defects

| Defect | Impact | Repair | Evidence |
|---|---|---|---|
| Nonpositive/coerced checkout quantity | Negative amounts, stock increases | Strict required integer >=1, validated product/customer/size, backend money calculation | test_reliability.py invalid quantities and exact stock cases |
| Duplicate checkout | Repeated orders and stock loss | Persisted unique idempotency key + request fingerprint; conflict detection and replay | Duplicate and concurrent-key tests |
| Concurrent oversell | Multiple buyers consume same stock | Conditional stock decrement in one transaction, database constraints | Concurrent independent checkout, duplicate lines, rollback tests |
| Fake successful API response | Failed checkout appears complete | Removed fallback interceptor; genuine rejection + formatted visible errors; retained cart/input | Six frontend error cases and failed-checkout browser journey |
| Fabricated cohort and experiment results | Misleading business decisions | Actual observed activity, exposures, unique converters and UTC windows | Hand-calculated cohort/statistics fixtures |
| Historical revenue error | Incorrect product GMV | Historical quantity * stored unit_price, eligible order/date filters | Quantity, cancelled order and old-order fixtures |
| Test contamination | Tests modify development records | Temporary per-test DB, dependency override, collection isolation; legacy audits invoke isolated suites | Independent DB and repeated/parallel suite execution |
| Browser duplicate event race | Concurrent impression requests fail | Unique event key with conflict-safe replay | Four concurrent identical events and route sweeps |

Final execution results and any remaining scope limitations are in FINAL_ACCEPTANCE_REPORT.md. No real payment processing or production authorization is claimed.
