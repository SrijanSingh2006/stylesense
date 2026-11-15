> Historical portfolio narrative: all figures, personas, timelines, business outcomes and interview/resume examples below are synthetic or illustrative. They are not evidence of real customer trials, interviews, realized GMV or production validation. For the current implementation and executable evidence, see KPI_DEFINITIONS.md, EXPERIMENTATION_GUIDE.md and ../qa/FINAL_ACCEPTANCE_REPORT.md.

# Product Roadmap, RICE Prioritization & Jira Sprint Backlog
## Project: StyleSense – AI-Powered Fashion Discovery Platform
**Methodology:** Agile / 2-Week Scrum Cadence  
**Frameworks:** RICE Prioritization, Jira Software, Scrum Sprint Planning  
**Target Window:** Q1-Q2 FY27  

---

## 1. Feature Prioritization Framework: RICE Matrix

To determine *"what to build and why"*, initiatives were evaluated using the standard RICE framework:
$$\text{RICE Score} = \frac{\text{Reach} \times \text{Impact} \times \text{Confidence}}{\text{Effort}}$$

* **Reach:** Estimated unique active shoppers impacted per month.
* **Impact:** 3 = Massive, 2 = High, 1 = Medium, 0.5 = Low.
* **Confidence:** 100% = High, 80% = Medium, 50% = Low.
* **Effort:** Estimated team person-weeks.

### Complete RICE Prioritization Table

| Rank | Initiative / Feature | Target Focus Area | Reach (Users/mo) | Impact | Confidence | Effort (Wks) | RICE Score | Release Decision |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **#1** | **Content-Based Personalization Engine** | Storefront Homepage | 5,000,000 | 3.0 | 90% | 4 | **3,375,000** | **P0 (Sprint 1-2)** |
| **#2** | **AI Natural Language Smart Search** | Search & Discovery | 4,000,000 | 2.5 | 85% | 3 | **2,833,333** | **P0 (Sprint 2-3)** |
| **#3** | **PDP Similar Product Cosine Cross-Sell** | Consumer Funnel (PDP) | 3,000,000 | 2.0 | 80% | 2 | **2,400,000** | **P1 (Sprint 3-4)** |
| **#4** | **Cart Recovery & Abandonment Triggers** | CRM & Growth | 1,500,000 | 1.5 | 70% | 2 | **787,500** | **P2 (Sprint 5)** |
| **#5** | **Visual Camera Image Search** | Visual Discovery | 800,000 | 2.0 | 50% | 6 | **133,333** | **Deprioritized** |

**PM Conclusion:** Content-Based Personalization and Smart Search yielded the highest RICE scores and were prioritized for immediate MVP sprints.

---

## 2. 8-Week Agile Release Roadmap (4 Sprints)

```
 Sprint 1 (W1-2) ──► PostgreSQL Schema, Clickstream Event Pipeline & TF-IDF Model Build
 Sprint 2 (W3-4) ──► Natural Language Intent Parser, Smart Search & Homepage Personalization Feed
 Sprint 3 (W5-6) ──► SQL Analytics Funnel Dashboard & 100k-User A/B Experiment Execution
 Sprint 4 (W7-8) ──► Experiment Statistical Verification, Retrospective & 100% Production Rollout
```

---

## 3. Jira User Stories & Gherkin Acceptance Criteria

### Epic 1: Personalised Fashion Recommendations (SS-EPIC-01)

#### Ticket SS-101 (Priority: P0 | Story Points: 5)
* **Title:** Ingest User Browsing History & Compute Scikit-Learn TF-IDF Vectors
* **User Story:**
  *As an active fashion shopper on the platform,*  
  *I want the homepage to reflect products matching my preferred styles and recent views,*  
  *So that I don't waste time scrolling through irrelevant fashion categories.*
* **Gherkin Acceptance Criteria:**
  ```gherkin
  Scenario: User with browsing history visits homepage
    Given the user has viewed at least 2 products in the last 7 days
    When the user lands on the storefront homepage
    Then the "Personalised For You" carousel displays products ranked by TF-IDF Cosine Similarity
    And each recommended product has a similarity score >= 0.70
    And API response latency must not exceed 45ms.

  Scenario: Guest or cold-start user visits homepage
    Given the user has zero browsing history
    When the user opens the homepage
    Then the feed gracefully falls back to the top-rated popularity ranking.
  ```

---

### Epic 2: AI-Powered Smart Search (SS-EPIC-02)

#### Ticket SS-201 (Priority: P0 | Story Points: 8)
* **Title:** Natural Language Query Entity & Intent Extraction
* **User Story:**
  *As a conversational shopper looking for specific attire,*  
  *I want to search queries like "Show me black casual sneakers under ₹2,500",*  
  *So that the app automatically applies category, color, and budget filters without manual navigation.*
* **Gherkin Acceptance Criteria:**
  ```gherkin
  Scenario: User searches with budget and color constraints
    Given the user enters "Show me black casual sneakers under ₹2,500" into the search bar
    When the user submits the search query
    Then the system extracts Category="Sneakers", Color="Black", MaxPrice=2500, Style="casual"
    And displays the extracted facet chips at the top of the search results
    And only products satisfying price <= 2500 and matching color/category are returned.
  ```

---

### Epic 3: Experimentation & Analytics (SS-EPIC-03)

#### Ticket SS-301 (Priority: P0 | Story Points: 5)
* **Title:** A/B Experiment Exposure Logging & Z-Test Automation
* **User Story:**
  *As a Product Manager,*  
  *I want an automated logging pipeline comparing Group A (Generic) vs Group B (StyleSense),*  
  *So that I can evaluate CTR, Add-to-Cart, and Conversion Rate with statistical confidence.*
* **Gherkin Acceptance Criteria:**
  ```gherkin
  Scenario: User is exposed to recommendation module
    Given an active A/B test with 50/50 split
    When the recommendation carousel renders on screen
    Then an exposure event is logged with experiment_id, user_id, and variant_group
    And subsequent click, add-to-cart, and purchase events are attributed to the assigned variant.
  ```

---

## 4. Cross-Functional RACI Matrix

| Task / Deliverable | Product Manager (PM) | Tech Lead (Eng) | UX/UI Designer | Data Analyst / QA | Category Lead |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **PRD & Success Metrics** | **A / R** | C | C | C | I |
| **Figma Wireframes & Prototypes** | C | I | **A / R** | C | I |
| **Scikit-Learn Recommender API** | C | **A / R** | I | C | I |
| **PostgreSQL Funnel Analytics** | **A** | C | I | **R** | I |
| **A/B Experiment Launch & Rollout** | **A / R** | C | I | C | I |

*A = Accountable, R = Responsible, C = Consulted, I = Informed*


---

## 5. Product Decision Document: What We Chose NOT to Build and Why (PM Judgement)

An exceptional Product Manager is defined as much by **what they choose NOT to build** as what they ship. Below are three heavily requested features evaluated and intentionally deprioritized:

### Feature 1: Real-Time 3D Physics Fabric Simulation Avatar
* **The Pitch:** Let users build a 3D avatar with body measurements and render cloth drape simulation.
* **Why We Said NO:**
  1. *Mobile Web Latency Penalty:* WebGL physics simulation required downloading 14MB asset bundles, inflating p95 page render time by **+950ms** and violating our 80ms performance budget.
  2. *Hardware Accessibility:* Over 62% of shoppers browse on entry-level Android devices; frame rates dropped below 15 FPS, causing battery drain and app crashes.
  3. *Alternative Chosen:* Lightweight 2D dynamic vector silhouette and historical return pattern classification, achieving 94% fit confidence with **<20ms render latency**.

### Feature 2: Floating AI Chatbot Popup on Every Page
* **The Pitch:** A floating chat assistant button prompting users: *"Hey, need help finding a dress?"*
* **Why We Said NO:**
  1. *Banner Blindness & Funnel Friction:* User testing showed 84% of mobile shoppers closed the chatbot popup within 1.5 seconds, treating it as intrusive ad spam.
  2. *Alternative Chosen:* Seamless, non-intrusive **Natural Language Smart Search bar** integrated directly into the core discovery header.

### Feature 3: Automated WhatsApp / SMS Cart Abandonment Blasts
* **The Pitch:** Send automated discount messages to every user who leaves an item in cart.
* **Why We Said NO:**
  1. *Margin Erosion & Brand Fatigue:* Incentivizes "coupon-gaming" (users intentionally abandon carts to wait for 20% discount codes).
  2. *Alternative Chosen:* **"Complete The Look" AI Capsule Bundling** directly on the storefront, lifting Average Order Value (AOV) by +24% organically through coordinated styling rather than defensive discounting.
