> Historical portfolio narrative: all figures, personas, timelines, business outcomes and interview/resume examples below are synthetic or illustrative. They are not evidence of real customer trials, interviews, realized GMV or production validation. For the current implementation and executable evidence, see KPI_DEFINITIONS.md, EXPERIMENTATION_GUIDE.md and ../qa/FINAL_ACCEPTANCE_REPORT.md.

# Product Experimentation & A/B Testing Report
## Experiment: Generic vs. StyleSense Personalised Recommendations
**Experiment ID:** `EXP_STYLESENSE_REC_V1`  
**Author:** Product Management Candidate  
**Target Feature:** Storefront Homepage & PDP Recommendation Carousels  
**Dataset:** Simulated clickstream exposure log (100,000 unique user sessions)  

---

## 1. Executive Summary & Experiment Hypothesis

### 1.1 Problem Context
Prior to StyleSense, the storefront displayed generic popularity-ranked products (Group A). Shoppers with specific sub-style affinities (e.g., streetwear vs. formal wear) experienced cognitive fatigue scrolling past irrelevant products, suppressing click-through and purchase rates.

### 1.2 Hypothesis Statement
> **If** we replace generic popularity rankings on the homepage and PDP with **StyleSense Scikit-Learn Content-Based Personalization** (Group B),  
> **Then** Click-Through Rate (CTR) will increase by $\ge 25\%$, Add-to-Cart rate will increase by $\ge 20\%$, and overall Purchase Conversion Rate will increase by $\ge 15\%$,  
> **Because** surfaced products directly align with individual shoppers' historical category affinity, brand preferences, and style attributes.

---

## 2. Experiment Design & Setup

* **Target Population:** Mobile App and Mobile Web Storefront Visitors.
* **Traffic Split:** 50% Control (Group A) / 50% Treatment (Group B) allocated via hash-based deterministic bucketizer (`user_id % 100`).
* **Duration:** 14 Days (capturing two full weekly shopping cycles).
* **Sample Size:** 100,000 unique user exposures (50,000 per variant).
* **Significance Level ($\alpha$):** 0.05 ($95\%$ Confidence Level).
* **Statistical Power ($1 - \beta$):** 80%.
* **Minimum Detectable Effect (MDE):** $5.0\%$ relative lift on Purchase Conversion Rate.

### Cohort Definitions:
* **Group A (Control):** Generic popularity ranking (sorted by aggregate order count and average rating).
* **Group B (Treatment / StyleSense):** Personalized ranking using Scikit-Learn TF-IDF vectorization and cosine similarity matching past browsing history.

---

## 3. Experiment Results & Metric Comparison

| Metric Evaluated | Group A: Control (Generic) | Group B: Treatment (StyleSense) | Absolute Delta | Relative Lift (%) | Statistically Significant? |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Unique Users Exposed** | 50,000 | 50,000 | - | - | Balanced Sample |
| **Recommendation Clicks** | 6,200 | 9,800 | +3,600 | **+58.06%** | Yes ($p < 0.0001$) |
| **Click-Through Rate (CTR)** | **12.4%** | **19.6%** | **+7.2%** | **+58.06%** | **Yes ($p < 0.0001$)** |
| **Add-to-Cart Count** | 14,500 | 20,500 | +6,000 | **+41.38%** | Yes ($p < 0.0001$) |
| **Add-to-Cart Rate** | **29.0%** | **41.0%** | **+12.0%** | **+41.38%** | **Yes ($p < 0.0001$)** |
| **Completed Orders** | 6,000 | 9,000 | +3,000 | **+50.00%** | Yes ($p < 0.0001$) |
| **Purchase Conversion Rate** | **12.0%** | **18.0%** | **+6.0%** | **+50.00%** | **Yes ($p < 0.0001$)** |
| **Average Order Value (AOV)** | ₹1,850 | ₹2,120 | +₹270 | **+14.59%** | Yes ($p < 0.01$) |
| **Total Realized GMV** | ₹1.11 Crore | ₹1.91 Crore | +₹79.8 Lakhs | **+71.89%** | **Substantial Impact** |

---

## 4. Statistical Significance Testing (Two-Proportion Z-Test)

### Statistical Formula:
$$Z = \frac{p_B - p_A}{\sqrt{p_{\text{pool}}(1 - p_{\text{pool}})\left(\frac{1}{n_A} + \frac{1}{n_B}\right)}}$$

Where:
* $n_A = 50,000, \quad x_A = 6,000, \quad p_A = 0.12$
* $n_B = 50,000, \quad x_B = 9,000, \quad p_B = 0.18$
* Pooled Proportion $p_{\text{pool}} = \frac{6,000 + 9,000}{100,000} = 0.15$
* Standard Error $SE = \sqrt{0.15 \times 0.85 \times \left(\frac{2}{50,000}\right)} = \sqrt{0.1275 \times 0.00004} = 0.002258$
* **Calculated Z-Score:**
  $$Z = \frac{0.18 - 0.12}{0.002258} = \mathbf{26.57}$$
* **Calculated P-Value:** $p < 0.00001$ (far below the $\alpha = 0.05$ threshold).
* **Confidence Interval (95%):** The true conversion lift lies between $+5.56\%$ and $+6.44\%$ with $99.99\%$ confidence.

---

## 5. Guardrail Metric Verification

To prevent negative unintended consequences, three guardrail metrics were continuously audited:
1. **API Serving Latency (p95):** Baseline was 22ms. StyleSense Scikit-learn inference averaged **28ms** (well within our 50ms performance budget).
2. **App Crash / ANR Rate:** Maintained at 0.02% (no increase observed).
3. **Catalog Diversity:** Evaluated Gini coefficient of impressions across brands. Group B distributed views across 42 distinct brands vs. only 12 brands in Group A, increasing vendor fairness.

---

## 6. PM Launch Recommendation & Next Steps

### Recommendation: **SHIP TO 100% PRODUCTION TRAFFIC**

### Justification:
1. **Decisive Business Lift:** The treatment generated a **+50.0% relative lift in conversion rate** ($12.0\% \to 18.0\%$) and generated an incremental **₹79.8 Lakhs in GMV** over a 2-week test window.
2. **Statistically Bulletproof:** $Z = 26.57, p < 0.0001$, completely ruling out random chance.
3. **Healthy Guardrails:** Zero degradation in mobile app load latency or crash rates.

### Phased Rollout Plan:
* **Day 1:** Ramp traffic from 50% to 75% across Android and iOS.
* **Day 2:** Full 100% rollout to all storefront traffic.
* **Day 7:** Post-launch retrospective and monitoring of long-term repeat purchase rate.
