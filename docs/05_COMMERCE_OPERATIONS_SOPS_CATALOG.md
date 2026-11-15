# Commerce Operations, Catalogue Quality & Predictive Intelligence
## Project: StyleSense – AI-Powered Commerce Intelligence Platform
**Document:** Standard Operating Procedures (SOP), Operational Runbooks & Demand Intelligence  
**Focus Areas:** Inbound Supply Chain, Fulfillment Operations & Closed-Loop Return Intelligence  

---

## 1. Catalogue Quality Audit & Attribute Normalization

### 1.1 Automated Quality Score Engine
StyleSense continuously audits vendor SKU uploads across four dimensions:
1. **Attribute Completeness (40% weight):** Verifies fabric GSM, stretch index, collar cut, wash care, and color taxonomy.
2. **Duplicate Listing Detection (25% weight):** Runs TF-IDF and perceptual hash comparisons across newly ingested vendor titles and images to detect accidental duplicate listings.
3. **Category Integrity (20% weight):** Verifies that items tagged as "Sneakers" do not carry "Apparel" subcategories.
4. **Image Resolution & Quality (15% weight):** Confirms minimum 1200x1600px resolution with clean neutral backgrounds.

```
Overall Catalogue Quality Score = 94.2 / 100 (Target >= 90.0)
```

---

## 2. Closed-Loop Return Reason NLP & Fit Calibration SOP

### 2.1 The Feedback Loop Problem
In conventional e-commerce, when a customer returns a shirt citing *"Size M was suffocatingly tight around the shoulders"*, that information is buried in customer service logs. Future shoppers continue buying the ill-fitting size and returning it.

### 2.2 StyleSense Closed-Loop SOP
```
[Customer Initiates Return & Submits Free-Text Note]
                         │
                         ▼
[NLP Classifier Service: /api/operations/return-nlp]
  - Extracts sentiment & sizing keywords ("tight", "short", "suffocating")
  - Categorizes reason: SIZE_TOO_SMALL (Confidence: 0.96)
                         │
                         ▼
[Closed-Loop Algorithm Calibration]
  - When SKU receives >= 3 consecutive "SIZE_TOO_SMALL" signals within 7 days:
  - System automatically applies a +0.8 inch offset to that brand/SKU's sizing matrix.
  - Future shoppers with identical chest/shoulder geometry will be advised:
    "Runs slightly small; recommend sizing up."
                         │
                         ▼
[Reverse Logistics Savings Realized]
  - Prevents downstream returns, saving ₹145 courier cost per transaction.
```

---

## 3. Real-Time Inventory-Aware Recommendation Rules

### 3.1 Fulfillment Constraint Logic
Recommending a product that takes 6 days to deliver or has only 1 unit remaining in a distant warehouse damages customer trust and spikes cancellation rates.

StyleSense incorporates **operational constraints** directly into recommendation ranking:
$$\text{Final Rank Score} = \text{PersonalRelevanceScore} \times \text{AvailabilityMultiplier} \times \text{DeliveryPromiseWeight}$$

* If `inventory <= 2`: Apply scarcity flag (`Only 2 left in your size`) but suppress from high-volume generic carousels.
* If `warehouse_distance == local_hub`: Boost delivery promise badge (`⚡ Express 1-Day Delivery`).
* If `out_of_stock`: Automatically trigger alternative product suggestion with identical TF-IDF vector.

---

## 4. Promotion Simulator & Price Elasticity Model

StyleSense provides product managers with a **Promotion Simulator** (`/api/operations/simulate-promotion`) to test hypothetical discount scenarios:

$$\text{Projected Sales Volume Lift} = \text{Discount Percentage} \times \text{Price Elasticity} \quad (\epsilon = 1.45)$$
$$\text{Gross Margin} = \text{Baseline Margin (48%)} - (\text{Discount Percentage} \times 0.9)$$

* **Safe Promotion Zone:** Discounts between 10%–20% generate net accretive GMV while maintaining healthy gross margins ($\ge 30\%$).
* **Margin Dilutive Warning:** Discounts $> 25\%$ erode profitability unless subsidized by brand partner co-op funding.
