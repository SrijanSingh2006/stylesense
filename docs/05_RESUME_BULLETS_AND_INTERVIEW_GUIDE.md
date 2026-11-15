> Historical portfolio narrative: all figures, personas, timelines, business outcomes and interview/resume examples below are synthetic or illustrative. They are not evidence of real customer trials, interviews, realized GMV or production validation. For the current implementation and executable evidence, see KPI_DEFINITIONS.md, EXPERIMENTATION_GUIDE.md and ../qa/FINAL_ACCEPTANCE_REPORT.md.

# Resume Points & Interview Preparation Guide
## Project: StyleSense – AI-Powered Fashion Discovery & Conversion Optimisation Platform
**Target Program:** Product Management Internship – Myntra (Storefront Customer Experience Focus)  
**Stack Highlighted:** React.js, Python, FastAPI, PostgreSQL, Scikit-learn, SQL  

---

## 1. Resume-Ready Experience Entry: Commerce Intelligence Edition (Recommended)
*Completely brand-agnostic, showcasing product vision across discovery, analytics, experimentation, and operations.*

```markdown
StyleSense – AI-Powered Commerce Intelligence & Personalisation Platform
• Architected an AI-powered commerce platform integrating multimodal product discovery, semantic search and explainable hybrid recommendations to personalise customer shopping experiences.
• Engineered customer behaviour analytics using SQL and Python to analyse conversion funnels, cohort retention and product engagement, enabling data-driven identification of journey friction.
• Developed an experimentation framework with A/B testing, feature flags and statistical analysis to evaluate product changes against conversion and engagement KPIs.
• Integrated predictive inventory, catalogue quality and return intelligence modules to connect customer experience with operational performance.
```

---

## 2. Storefront CX & Fashion Discovery Edition (Alternative Entry)

```markdown
StyleSense – AI-Powered Fashion Discovery & Conversion Optimisation Platform | React.js, Python, FastAPI, PostgreSQL, Scikit-learn, SQL
• Designed an AI-powered fashion discovery platform featuring personalised product recommendations and natural-language search to improve product relevance and customer experience.
• Developed a recommendation engine using Scikit-learn and implemented dynamic product ranking based on user preferences, browsing behaviour and product attributes.
• Built SQL-driven product analytics to monitor customer journey funnels, CTR, add-to-cart rates and conversion, identifying friction points across the shopping experience.
• Designed an A/B testing framework to evaluate recommendation strategies and developed a product roadmap with prioritised features, user stories and success metrics.
```

---

## 2. High-Impact Quantified Variant (With Numerical Metrics)

```markdown
StyleSense – AI-Powered Fashion Discovery & Conversion Optimisation Platform | Lead Product Manager
• Spearheaded product discovery, PRD, and prototyping for an AI fashion storefront, addressing discovery fatigue across 100,000+ sessions.
• Developed a Scikit-learn content-based recommendation engine and natural language search parser, driving a +58.1% lift in CTR (12.4% to 19.6%) and +41.4% lift in Add-to-Cart rate.
• Conducted PostgreSQL funnel analytics across 6 journey stages, identifying a 41.7% PDP drop-off and diagnosing root-cause friction to lift overall purchase conversion from 12.0% to 18.0%.
• Evaluated 100k-user A/B experiment with Two-Proportion Z-Test (Z = 26.57, p < 0.0001), generating ₹79.8 Lakhs in incremental GMV, and formulated a RICE-prioritized product roadmap.
```

---

## 3. Direct Alignment with Myntra JD Requirements

| Myntra JD Work Stream / Requirement | What This Project Demonstrates | Specific Code / Deliverable Evidence |
| :--- | :--- | :--- |
| **Customer Experience** | Personalised fashion discovery & seamless PDP browsing | `frontend/index.html` & Homepage Carousel |
| **Search and Personalisation** | AI recommendation engine and natural language search | `backend/recommendation_engine.py` & `smart_search.py` |
| **Product Analytics** | SQL funnel, drop-off diagnosis, and KPI tracking | `docs/02_SQL_PRODUCT_ANALYTICS.md` & Analytics Dashboard |
| **Root-Cause Analysis (RCA)** | Identifying customer drop-offs and friction points | Funnel diagnostics on PDP and Cart abandonment |
| **GenAI / LLM / NLP** | Conversational query parsing and facet extraction | `backend/smart_search.py` (Category, Color, Price) |
| **Problem-Solving** | Diagnosing discovery fatigue and sizing anxiety | `docs/01_PRD_STYLESENSE.md` |
| **Prototyping** | Functional interactive React/SPA prototype & APIs | `frontend/` and `backend/main.py` |
| **Product Strategy** | PRD, RICE prioritization, A/B testing, and roadmap | `docs/03_AB_TESTING_EXPERIMENT_REPORT.md` & `docs/04_PRODUCT_ROADMAP_RICE_JIRA.md` |

---

## 4. Master Interview Questions & Answer Scripts

### Question 1: "Why did you build StyleSense, and what was your product philosophy?"
**Answer:**
> *"When looking at fashion e-commerce storefronts like Myntra, the core challenge isn't having enough inventory—it's **relevance**. With thousands of SKUs, users experience severe discovery fatigue. 
> Looking at customer funnel data, 80% of users search, but 41.7% drop off at the product page because recommendations are generic and search queries like 'black sneakers under 2500' fail lexical search.
> My philosophy was centered around **'what to build and why'**: Instead of building another generic store, I built **StyleSense** to combine Scikit-learn content-based personalization with natural-language search, backed by SQL funnel diagnostics and rigorous A/B testing."*

### Question 2: "Walk me through how your recommendation engine works."
**Answer:**
> *"We built a content-based recommendation engine using Scikit-Learn TF-IDF vectorization and Cosine Similarity. 
> We aggregate garment metadata—brand, category, sub-category, color, tags, and title—into high-dimensional vectors. When a user browses items or specifies style preferences, we synthesize a user affinity vector and rank catalog items by Cosine Similarity.
> On the PDP, we also compute item-to-item similarity so that companion styles in the exact same category and aesthetic are recommended, driving a +58.1% relative lift in CTR."*

### Question 3: "Tell me about your A/B test and how you decided to launch."
**Answer:**
> *"We designed a 50/50 randomized controlled trial across 100,000 unique shopper sessions. Group A received generic popularity-based ranking, while Group B received StyleSense personalized recommendations.
> We tracked three primary conversion metrics: CTR jumped from 12.4% to 19.6% (+58.1%), Add-to-Cart increased from 29.0% to 41.0% (+41.4%), and Purchase Conversion jumped from 12.0% to 18.0% (+50.0%).
> I ran a Two-Proportion Z-Test which yielded Z = 26.57 and p < 0.0001, far exceeding our 99.9% statistical confidence threshold. Guardrail latency remained under 28ms, so I authored the PM Decision Memo recommending a 100% production rollout."*
