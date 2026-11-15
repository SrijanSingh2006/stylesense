> Historical portfolio narrative: all figures, personas, timelines, business outcomes and interview/resume examples below are synthetic or illustrative. They are not evidence of real customer trials, interviews, realized GMV or production validation. For the current implementation and executable evidence, see KPI_DEFINITIONS.md, EXPERIMENTATION_GUIDE.md and ../qa/FINAL_ACCEPTANCE_REPORT.md.

# Product Requirement Document (PRD)
## Project: StyleSense – AI-Powered Fashion Discovery & Conversion Optimisation Platform
**Document Version:** 1.0 (Production Release)  
**Author:** Product Management Intern Candidate  
**Target Window:** Jan – Jun 2027 (Myntra PM Internship Program)  
**Focus Area:** Storefront Product — Customer Experience, Search, Personalisation & Consumer Funnel  

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem
Fashion e-commerce platforms host hundreds of thousands of active SKUs. Shoppers face severe discovery fatigue due to:
1. **Generic, Static Recommendations:** Users are served generic popularity-ranked items regardless of past browsing affinity or personal style.
2. **Inefficient Keyword-Only Search:** Traditional lexical search fails when shoppers search conversational queries (e.g., *"Show me black casual sneakers under ₹2,500"*), returning zero or irrelevant results.
3. **Severe Funnel Drop-offs:** While 80% of visitors search for items, **41.7% drop off between viewing a product and adding it to cart**, and **42.9% abandon items in the cart** without checking out.

### 1.2 Proposed Solution: StyleSense
**StyleSense** is a comprehensive fashion discovery and conversion optimization platform featuring:
* **Content-Based Personalization Engine:** Employs Scikit-Learn TF-IDF vectorization and Cosine Similarity to dynamically rank homepage and PDP feeds based on user browsing history and style attributes.
* **AI-Powered Natural Language Smart Search:** An intent and entity extractor converting conversational shopper queries into discrete categories, colors, brands, and price constraints.
* **Product Analytics & Funnel Diagnostics:** PostgreSQL data engine tracking the 6-stage customer journey (Homepage 100% $\to$ Search 80% $\to$ Product View 60% $\to$ Add to Cart 35% $\to$ Checkout 20% $\to$ Purchase 15%), with root-cause drop-off diagnostics.
* **A/B Experimentation Framework:** Validated via a 100,000-user randomized controlled trial (Generic vs. StyleSense), lifting conversion rate by **+50.0% relative** ($p < 0.0001$) and unlocking **₹79.8 Lakhs** in incremental GMV.

---

## 2. Target User Personas & Journey Mapping

### Persona 1: "Sneakerhead Rahul" (Casual Discovery Shopper)
* **Demographics:** 23-year-old developer in Bengaluru; shops casualwear and footwear on mobile.
* **Pain Point:** Scrolls through hundreds of formal shoes when searching for "black casual kicks under 2500". Gets overwhelmed and bounces.
* **Desired State:** 1-line conversational search that instantly surfaces matching sneakers under ₹2,500, followed by a personalized homepage feed showing matching casual shirts.

### Persona 2: "Style-Conscious Priya" (Occasion Shopper)
* **Demographics:** 27-year-old marketing professional in Mumbai; shops dresses and ethnic wear for festive events.
* **Pain Point:** Views a midi dress she likes, but the "Related Products" carousel shows completely unrelated men's jeans or winter jackets.
* **Desired State:** Item-to-item cosine similarity on PDP displaying matching dresses with similar silhouettes and fabric patterns.

---

## 3. Goals & Key Performance Indicators (KPIs)

### 3.1 North Star Metric
* **Search-to-Purchase Conversion Velocity (SPCV):** Ratio of completed purchases initiated via search or personalized discovery to total search sessions.

### 3.2 Primary & Secondary Business Metrics
| Metric | Baseline (Generic) | Target (StyleSense) | Measurement Method |
| :--- | :--- | :--- | :--- |
| **Search-to-Product-View Rate** | 62.5% | **75.0%** (+20% relative lift) | Clickstream Event Logs |
| **Click-Through Rate (CTR)** | 12.4% | **19.6%** (+58.1% relative lift) | A/B Exposure Table |
| **Add-to-Cart Rate** | 29.0% | **41.0%** (+41.4% relative lift) | PostgreSQL Funnel View |
| **Overall Purchase Conversion Rate** | 12.0% | **18.0%** (+50.0% relative lift) | Order Completion DB |
| **Average Order Value (AOV)** | ₹1,850 | **₹2,120** (+14.6% lift) | Financial Analytics |
| **Cart Abandonment Rate** | 48.0% | **≤ 42.9%** (reduction) | Funnel Drop-off Query |

### 3.3 Guardrail Metrics
* **Search & Recommendation Latency (p95):** $\le 45\text{ms}$ (must not delay Core Web Vitals).
* **Catalog Coverage:** 100% of active SKUs must have computed TF-IDF feature vectors.

---

## 4. Product Functional Specifications (The 4 Modules)

### Module 1: Personalised Fashion Recommendations
* **Content-Based Modeling:** Uses Scikit-learn TF-IDF Vectorizer on aggregated garment metadata (`title`, `brand`, `category`, `sub_category`, `color`, `tags`).
* **Dynamic Homepage Feed:** If user has past browsing history or stated category preferences, dynamically computes a user profile vector and ranks catalog items by Cosine Similarity.
* **PDP Cross-Sell Carousel ("Because You Viewed This"):** Computes pairwise item-to-item similarity for the active product to show top 3 closest stylistic matches.
* **Cold-Start Fallback:** Unauthenticated / guest users receive popularity-weighted trending items.

### Module 2: AI-Powered Smart Search
* **Natural Language Entity Extractor:** Parses free-form queries into structured query facets:
  * Category (e.g. *"sneakers"*, *"oxford shirt"*, *"midi dress"*)
  * Color (e.g. *"black"*, *"navy blue"*, *"white"*)
  * Price ceiling (e.g. *"under ₹2,500"*, *"below 1500"*)
  * Style Intent tokens (e.g. *"casual"*, *"formal"*, *"summer"*)
* **Search Ranking Algorithm:** Scored by:
  $$\text{Score} = \text{CategoryMatch}(50) + \text{ColorMatch}(40) + \text{BrandMatch}(40) + \sum \text{TokenOverlap}(10) + (\text{Rating} \times 2)$$

### Module 3: Product Analytics Dashboard
* **Funnel Stages Instrumented:**
  $$\text{Homepage (100\%)} \longrightarrow \text{Search (80\%)} \longrightarrow \text{Views (60\%)} \longrightarrow \text{Cart (35\%)} \longrightarrow \text{Checkout (20\%)} \longrightarrow \text{Purchase (15\%) }$$
* **Friction Diagnostics:** Quantifies the 41.7% drop between view-to-cart and 42.9% drop between cart-to-checkout with actionable root-cause recommendations.

### Module 4: Product Experimentation (A/B Testing Framework)
* **Traffic Allocation:** 50/50 split across 100,000 users (`EXP_STYLESENSE_REC_V1`).
* **Group A (Control):** Generic popularity-based recommendations.
* **Group B (Variant):** StyleSense Scikit-Learn personalized recommendations.
* **Statistical Verification:** Automated Two-Proportion Z-Test reporting $Z$-score, $p$-value, confidence intervals, and automated PM Launch Decision Memo.

---

## 5. Technical Architecture & Tech Stack

```
[Storefront UI (React.js / SPA)]
      │
      ├── 1. User Query / Clickstream Event 
      ▼
[FastAPI Backend Microservice (Python)]
   ├── [SmartSearchEngine] ◄── Regex & NLP Entity Extraction
   ├── [StyleSenseRecommender] ◄── Scikit-Learn TF-IDF & Cosine Similarity
   └── [AnalyticsService] ◄── Pandas & Funnel SQL Computations
      │
      ├── 2. Data Persistence
      ▼
[PostgreSQL Database (stylesense_db)]
   ├── Table: users
   ├── Table: products
   ├── Table: clickstream_events
   ├── Table: orders & order_items
   └── Table: ab_experiment_exposures
```

---

## 6. Release & Rollout Strategy
* **Phase 1 (Alpha / Dogfooding):** Deployed internally for 5 days.
* **Phase 2 (50/50 A/B Test):** 100,000 session exposure run over 14 days.
* **Phase 3 (Full Rollout):** Ramp to 100% storefront traffic upon statistical verification ($p < 0.001$).
