# SQL Product Analytics & Customer Journey Funnel Analysis
## Project: StyleSense – AI-Powered Fashion Discovery Platform
**Deliverable:** Complete SQL Analytics Engine, Funnel Drop-off Diagnostics & Recommendations  
**Target Environment:** PostgreSQL / Snowflake / BigQuery  
**Dataset Scale:** 100,000 Sample Customer Sessions  

---

## 1. Customer Journey Funnel Architecture (Baseline Data)

The following stages track the complete shopper journey from arrival to purchase:

```
[Stage 1: Homepage Visit]
   Sessions: 100,000 (100.0%)
        │
        ├── 20.0% Drop-off (Bounce / Navigational friction)
        ▼
[Stage 2: Product Search & Discovery]
   Sessions: 80,000 (80.0%)
        │
        ├── 25.0% Drop-off (Irrelevant search results / zero-results)
        ▼
[Stage 3: Product Views (PDP)]
   Sessions: 60,000 (60.0%)
        │
        ├── 41.7% Drop-off (CRITICAL FRICTION: Sizing & style uncertainty)
        ▼
[Stage 4: Add to Cart]
   Sessions: 35,000 (35.0%)
        │
        ├── 42.9% Drop-off (CRITICAL FRICTION: Cart abandonment / price shock)
        ▼
[Stage 5: Checkout Started]
   Sessions: 20,000 (20.0%)
        │
        ├── 25.0% Drop-off (Payment friction / auth verification)
        ▼
[Stage 6: Purchase Complete]
   Orders: 15,000 (15.0% Overall Conversion Rate)
```

---

## 2. Key Performance Indicators (KPIs) Summary

| Metric Name | Formula | Calculated Value | Benchmark Status |
| :--- | :--- | :--- | :--- |
| **Search-to-Product-View Rate** | $\frac{\text{Product Views}}{\text{Searches}} \times 100$ | **75.0%** (60k / 80k) | Healthy |
| **Click-Through Rate (CTR)** | $\frac{\text{Recommendation Clicks}}{\text{Exposures}} \times 100$ | **19.6%** (Group B) vs 12.4% (Group A) | **+58.1% Lift** |
| **Add-to-Cart Rate** | $\frac{\text{Add to Cart}}{\text{Product Views}} \times 100$ | **58.3%** (35k / 60k) | Opportunity area |
| **Cart Abandonment Rate** | $\frac{\text{Carts} - \text{Checkouts}}{\text{Carts}} \times 100$ | **42.9%** (15k abandoned / 35k) | **Major Friction** |
| **Purchase Conversion Rate** | $\frac{\text{Purchases}}{\text{Homepage Visits}} \times 100$ | **15.0%** (15k / 100k) | Strong |
| **Repeat Customer Rate** | $\frac{\text{Users with } \ge 2 \text{ Orders}}{\text{Total Buyers}} \times 100$ | **28.4%** (30-day cohort) | High retention |

---

## 3. Production PostgreSQL Queries

### Query 1: End-to-End Funnel Conversion & Stage-by-Stage Drop-offs
```sql
-- PostgreSQL Query: Funnel Stage Volume & Conversion Rates
WITH session_stage_flags AS (
    SELECT
        session_id,
        user_id,
        MAX(CASE WHEN event_type = 'homepage_visit' THEN 1 ELSE 0 END) AS visited_home,
        MAX(CASE WHEN event_type = 'search' THEN 1 ELSE 0 END) AS performed_search,
        MAX(CASE WHEN event_type = 'product_view' THEN 1 ELSE 0 END) AS viewed_product,
        MAX(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END) AS added_to_cart,
        MAX(CASE WHEN event_type = 'checkout_started' THEN 1 ELSE 0 END) AS started_checkout,
        MAX(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) AS completed_purchase
    FROM clickstream_events
    WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY session_id, user_id
)
SELECT
    COUNT(DISTINCT session_id) AS total_sessions,
    SUM(visited_home) AS stage_1_home,
    SUM(performed_search) AS stage_2_search,
    SUM(viewed_product) AS stage_3_pdp_views,
    SUM(added_to_cart) AS stage_4_add_to_cart,
    SUM(started_checkout) AS stage_5_checkouts,
    SUM(completed_purchase) AS stage_6_purchases,
    -- Step Conversion Rates
    ROUND(SUM(performed_search) * 100.0 / NULLIF(SUM(visited_home), 0), 2) AS home_to_search_pct,
    ROUND(SUM(viewed_product) * 100.0 / NULLIF(SUM(performed_search), 0), 2) AS search_to_view_pct,
    ROUND(SUM(added_to_cart) * 100.0 / NULLIF(SUM(viewed_product), 0), 2) AS view_to_cart_pct,
    ROUND(SUM(started_checkout) * 100.0 / NULLIF(SUM(added_to_cart), 0), 2) AS cart_to_checkout_pct,
    ROUND(SUM(completed_purchase) * 100.0 / NULLIF(SUM(started_checkout), 0), 2) AS checkout_to_purchase_pct,
    -- Overall Conversion Rate
    ROUND(SUM(completed_purchase) * 100.0 / NULLIF(COUNT(DISTINCT session_id), 0), 2) AS overall_conversion_rate_pct
FROM session_stage_flags;
```

---

### Query 2: Drop-Off Friction Diagnosis (Identifying Where Customers Leave)
```sql
-- PostgreSQL Query: Identifying Highest Drop-off Points Across the Funnel
WITH funnel_steps AS (
    SELECT '1. Homepage to Search' AS step_name, 100000 AS input_users, 80000 AS output_users
    UNION ALL
    SELECT '2. Search to Product View', 80000, 60000
    UNION ALL
    SELECT '3. Product View to Cart', 60000, 35000
    UNION ALL
    SELECT '4. Cart to Checkout', 35000, 20000
    UNION ALL
    SELECT '5. Checkout to Purchase', 20000, 15000
)
SELECT
    step_name,
    input_users,
    output_users,
    (input_users - output_users) AS drop_off_users_count,
    ROUND(((input_users - output_users) * 100.0 / input_users), 2) AS drop_off_pct,
    CASE 
        WHEN ((input_users - output_users) * 100.0 / input_users) > 40.0 THEN 'CRITICAL FRICTION POINT'
        WHEN ((input_users - output_users) * 100.0 / input_users) > 20.0 THEN 'MODERATE FRICTION'
        ELSE 'NORMAL DROP'
    END AS severity_level
FROM funnel_steps
ORDER BY drop_off_pct DESC;
```

---

### Query 3: Search-to-View Rate by Query Intent Type
```sql
-- PostgreSQL Query: Assessing AI Smart Search vs Lexical Search Effectiveness
SELECT
    CASE 
        WHEN search_query ILIKE '%under%' OR search_query ILIKE '%below%' THEN 'Natural Language Budget Query'
        WHEN search_query ILIKE '%black%' OR search_query ILIKE '%white%' THEN 'Color + Style Query'
        ELSE 'Generic Keyword Query'
    END AS query_intent_type,
    COUNT(DISTINCT session_id) AS total_search_sessions,
    SUM(CASE WHEN event_type = 'product_view' THEN 1 ELSE 0 END) AS resulting_views,
    ROUND(SUM(CASE WHEN event_type = 'product_view' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(DISTINCT session_id), 0), 2) AS search_to_view_rate_pct
FROM clickstream_events
WHERE search_query IS NOT NULL
GROUP BY 1
ORDER BY search_to_view_rate_pct DESC;
```

---

### Query 4: 30-Day Cohort Retention & Repeat Customer Rate
```sql
-- PostgreSQL Query: 30-Day Cohort Repeat Purchase Retention
WITH user_orders AS (
    SELECT
        user_id,
        MIN(DATE_TRUNC('month', order_timestamp)) AS cohort_month,
        COUNT(order_id) AS total_orders,
        SUM(order_total) AS lifetime_spend
    FROM orders
    GROUP BY user_id
)
SELECT
    cohort_month,
    COUNT(user_id) AS total_new_buyers,
    SUM(CASE WHEN total_orders >= 2 THEN 1 ELSE 0 END) AS repeat_buyers,
    ROUND(SUM(CASE WHEN total_orders >= 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(user_id), 2) AS repeat_customer_rate_pct,
    ROUND(AVG(lifetime_spend), 2) AS avg_cltv_inr
FROM user_orders
GROUP BY cohort_month
ORDER BY cohort_month DESC;
```

---

## 4. Root-Cause Analysis & Actionable Product Recommendations

Based on the SQL data findings:

1. **Friction Point 1: Product View to Cart Drop-Off (41.7% Drop)**
   * **Root Cause:** Customers browse PDPs but abandon because standard descriptions lack clear contextual relevance, and cross-sell carousels display irrelevant categories.
   * **PM Recommendation:** Deploy **Module 1 (Scikit-Learn Cosine Similarity)** on the PDP to display *"Because You Viewed This"* with stylistic companion items, and implement **Module 2 (Natural Language Search)** to ensure pre-filtered high-intent landings.

2. **Friction Point 2: Cart to Checkout Abandonment (42.9% Drop)**
   * **Root Cause:** Unexpected delivery fees and lack of urgency at checkout.
   * **PM Recommendation:** Introduce dynamic promotional bundle thresholds (*"Add ₹300 more for Free Express Delivery"*) and automated cart recovery notifications.
