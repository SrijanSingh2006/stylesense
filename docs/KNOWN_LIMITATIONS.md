# Known limitations

- Accounts, database sessions and backend role/ownership checks are implemented. This portfolio application has no independent penetration test, MFA/OAuth, email-change/deletion flow, distributed load certification or production operations guarantee. See [security design](SECURITY_DESIGN.md).
- Checkout is simulated. Owned saved addresses and payment selection persist with orders; no payment is collected, no courier dispatch occurs, and no real delivery/return guarantee is offered. Free delivery; no coupon, fulfilment or refund ledger. Completed simulated orders are not cancellable; only eligible pending reserved orders can be cancelled. Inventory is held per product, not per product-size variant.
- Recommendations use transparent weighted preferences, history, diversity and popularity. They are not an LLM or trained collaborative-filtering service. Weights remain code-configured.
- Visual similarity uses average colour and catalogue colour labels; it is not garment recognition or CLIP. Sizing and return risk are heuristics without calibrated probability guarantees.
- The `personalisation` flag changes actual recommendation behavior and supports deterministic customer bucketing. Other legacy flag rows remain configuration metadata; they do not all gate feature execution yet.
- Only purchase conversion supports an experiment decision; CTR/AOV/return-rate primary experiments need dedicated estimators. Exposure must be explicitly recorded. Guardrail instrumentation and production-scale experiment governance are incomplete.
- Cohorts display Pending for incomplete calendar weeks. Product recommendation CTR is unavailable without recorded impressions. Revenue is gross under the documented status rules, not net of all refunds.
- Existing data with invalid stock, item quantity or price must be repaired before the reliability migration. The migration refuses to delete or silently alter those records. Downgrades intentionally refuse destructive schema removal; restore a verified backup instead.
- PostgreSQL driver and compatible SQLAlchemy paths are included; the final QA report states whether PostgreSQL runtime tests were executed. Do not infer parity from SQLite checks alone.
- Windows setup commands are provided; execution of PowerShell is separately disclosed in QA. Product photos fall back to a local illustration when remote images fail.
- Mobile forms/tables and major routes are checked by Playwright at the listed viewports. These checks do not establish complete accessibility compliance or load-test capacity.

- Development email uses a private filesystem outbox; real SMTP inbox delivery is unverified. Production requires explicit TLS SMTP configuration.
- Refresh is coordinated within a tab; interrupted refresh responses or simultaneous rotation across tabs can trigger family reuse protection. Access tokens/CSRF are memory-only; refresh cookies require consistent same-site hosting. Sessions have sliding expiry and no separate absolute family lifetime.
- Historical customer personas and orders remain unclaimed after migration. New accounts cannot access historical purchases merely by matching a demo identity.

- Recharts 2 is retained to preserve existing dashboards; its upstream branch is deprecated. The recorded frontend advisory audit is clean, but that does not guarantee future advisories or continued upstream maintenance.
