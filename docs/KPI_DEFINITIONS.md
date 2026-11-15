# Measurement definitions

All stored timestamps represent UTC; timezone offsets supplied by clients are not trusted for purchase attribution. Events use server timestamps. Money is rounded half up to two decimal places during checkout and stored as fixed precision Numeric for orders/items. Product list prices remain the existing catalogue Float type; checkout converts their decimal string representation before arithmetic.

## Orders, revenue, AOV and returns

Only COMPLETED orders qualify for gross revenue and AOV. Product revenue is SUM(order_items.quantity * order_items.unit_price), joined to qualifying orders, filtered by order date and optional customer. Current catalogue prices are never used. Cancelled and RETURNED orders are excluded from this gross completed-order view. Individual return records on otherwise completed orders do not subtract refunds: no refund ledger exists. This is gross revenue, not net sales. Checkout offers free delivery and no coupons; submitted discounts or totals are rejected.

AOV = sum of completed-order total_amount / completed-order count. Orders are selected once, never multiplied by a join. Overview conversion = unique completed-order session IDs also present in eligible event sessions / unique eligible event sessions. Anonymous visitors are included in sessions but excluded from identified unique customer count. Cart abandonment = cart sessions without a completed order / cart sessions. Repeat rate = customers with multiple completed orders / purchasing customers, within the selected range.

Overview return rate = distinct qualifying order IDs with any Return record / completed orders placed in the selected range. Multiple returned products on the same order count once. Operations returns includes COMPLETED and RETURNED orders as fulfilled eligible orders. Reason shares use return records, not order counts. The distinction is intentional and explicit. These order-placement denominators can mature as later returns arrive.

## Funnel

Homepage -> search OR recommendation click -> product view -> cart -> checkout -> purchase. Events are ordered by UTC occurrence then ID. Each session advances once per next milestone; duplicates do not advance twice, out-of-order milestones are ignored, and all steps must occur within the chosen rolling window. Denominator is sessions entering the homepage. This strict discovery funnel excludes direct PDP entrants; overview conversion uses all eligible sessions and may differ. Zero denominators return 0, never invented sessions.

## Cohorts

Qualifying activity: homepage_view, search, product_view, recommendation_click, add_to_cart, checkout_started, purchase. Each identified customer's first qualifying activity determines their acquisition cohort. Cohorts begin Monday 00:00 UTC. Week 0 is that acquisition calendar week; weeks 1–4 are subsequent nonoverlapping seven-day intervals. Denominator stays the original cohort's unique customer count. Numerator is unique cohort members with qualifying activity during that week. Incomplete weeks return retention_rate=null and observed=false; the UI displays Pending rather than projecting a result. Complete week 0 is 100% by definition. Empty data returns no cohorts. Future events are excluded.

## CTR

Product recommendation CTR = unique clicked sessions that also have a recommendation_impression for that product / unique impressed sessions. Without recorded impressions CTR is null/unavailable. It is never inferred from product views. The storefront instruments recommendation cards and clicks. These are rendered-card impressions, not viewability-certified advertising impressions.

## RFM

Frequency and monetary spend use completed orders. Recency is days since latest completed order (or observed signup age for customers without purchases). Documented rule thresholds, not quantiles: Champions (>=4 orders, >=10000 spend, <=30 days); Loyal (>=3, <=60 days); Potential Loyalists (>=2, <=45 days); New (1, <=21 days); At-Risk (>=2, >45 days); otherwise Dormant. Rules are applied in that order and are descriptive heuristics, not validated predictions.

## Inventory and pricing

Inventory velocity uses completed-order item quantities in the last 28 days; weekly history uses four actual seven-day windows. No demand is invented for unsold products. Zero velocity displays 0 coverage days to indicate that coverage cannot be estimated. Inventory turnover is observed 28-day units sold / current units, a descriptive unit ratio rather than accounting COGS/average inventory. Replenishment is a heuristic targeting 28 days plus reorder buffer. Promotion demand uses an explicitly simulated elasticity model and a review-count baseline estimate; it is not observed revenue. Return-risk scores are unvalidated heuristics.
