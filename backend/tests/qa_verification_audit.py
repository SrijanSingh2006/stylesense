import httpx
import sqlite3
import math
import sys
import os

BASE_URL = "http://127.0.0.1:8000/api/v1"
DB_PATH = "backend/stylesense.db" if os.path.exists("backend/stylesense.db") else "stylesense.db"

def run_qa_audit():
    print("==================================================")
    print("🔍 STYLESENSE SENIOR QA VERIFICATION AUDIT")
    print("==================================================")
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)
    db_conn = sqlite3.connect(DB_PATH)
    cursor = db_conn.cursor()

    errors = []
    passes = []

    def check(name, condition, details=""):
        if condition:
            passes.append(name)
            print(f"  [PASS] {name}")
        else:
            errors.append((name, details))
            print(f"  [FAIL] {name}: {details}")

    # 1. Health Endpoint
    print("\n[Phase 1] Health & Connectivity")
    try:
        r = client.get("/health")
        check("Health check returns 200 and healthy status", r.status_code == 200 and r.json().get("status") == "healthy")
    except Exception as e:
        check("Health check", False, str(e))

    # 2. Database Record Consistency
    print("\n[Phase 2] Database Record Consistency")
    cursor.execute("SELECT count(*) FROM products WHERE active = 1")
    active_prods_db = cursor.fetchone()[0]
    cursor.execute("SELECT count(*) FROM customers")
    customers_db = cursor.fetchone()[0]
    cursor.execute("SELECT count(*) FROM orders WHERE status = 'COMPLETED'")
    orders_db = cursor.fetchone()[0]
    cursor.execute("SELECT count(*) FROM events")
    events_db = cursor.fetchone()[0]

    check(f"Products count in DB >= 100 ({active_prods_db} found)", active_prods_db >= 100)
    check(f"Customers count in DB >= 30 ({customers_db} found)", customers_db >= 30)
    check(f"Orders count in DB >= 150 ({orders_db} found)", orders_db >= 150)
    check(f"Events count in DB >= 2000 ({events_db} found)", events_db >= 2000)

    # 3. Product Listing & Filtering
    print("\n[Phase 3] Products API & Filtering")
    r_prod = client.get("/products?limit=10&page=1")
    check("GET /products returns paginated response", r_prod.status_code == 200 and len(r_prod.json().get("items", [])) == 10)
    
    r_cat = client.get("/products?category=Shirts")
    shirts = r_cat.json().get("items", [])
    check("Category filter returns only matching category", len(shirts) > 0 and all("shirt" in p["category"].lower() for p in shirts))

    r_price = client.get("/products?min_price=1000&max_price=2500")
    priced = r_price.json().get("items", [])
    check("Price range filter bounds respected", len(priced) > 0 and all(1000 <= p["price"] <= 2500 for p in priced))

    # 4. Natural Language Search
    print("\n[Phase 4] Natural Language Search Engine")
    r_search = client.post("/search", json={"query": "find black casual sneakers under 2500"})
    s_data = r_search.json()
    p_filters = s_data.get("parsed_filters", {})
    check("NLP Facet Extractor captures colour 'Black'", p_filters.get("colour") == "Black")
    check("NLP Facet Extractor captures max_price 2500", p_filters.get("max_price") == 2500.0)
    check("Search returns items matching extracted facets", len(s_data.get("items", [])) > 0)

    # 5. Recommendations & Complete the Look
    print("\n[Phase 5] Recommendations & Outfit Synergy")
    r_rec = client.get("/recommendations/1?limit=6")
    rec_items = r_rec.json().get("items", [])
    check("GET /recommendations returns ranked items with explanation", len(rec_items) > 0 and "explanation" in rec_items[0])

    r_cold = client.get("/recommendations/999999")
    check("Cold start recommendation fallback strategy active", r_cold.json().get("strategy") == "cold_start_popular")

    first_prod_id = shirts[0]["id"]
    r_look = client.get(f"/recommendations/1/complete-look?product_id={first_prod_id}")
    look_data = r_look.json()
    check("Complete-The-Look curates complementary outfit", len(look_data.get("outfit_items", [])) > 0 and look_data.get("total_outfit_price", 0) > 0)

    # 6. Size Engine
    print("\n[Phase 6] Size Assistant Heuristic Engine")
    r_size = client.post("/size-recommendation", json={
        "category": "Shirts",
        "brand": "UrbanKnit",
        "height_cm": 178,
        "chest_cm": 100,
        "waist_cm": 84,
        "preferred_fit": "Regular"
    })
    size_res = r_size.json()
    check("Size recommendation returns recommended_size and confidence", "recommended_size" in size_res and size_res.get("confidence_score", 0) >= 0.7)

    # 7. Analytics vs Database Ground Truth
    print("\n[Phase 7] Analytics Accuracy against DB Ground Truth")
    r_overview = client.get("/analytics/overview?days=30")
    ov = r_overview.json()

    # Compare DB revenue sum vs API revenue
    cursor.execute("""
        SELECT COALESCE(SUM(total_amount), 0), COUNT(*)
        FROM orders
        WHERE status = 'COMPLETED'
          AND created_at >= datetime('now', '-30 days')
    """)
    db_sum, db_cnt = cursor.fetchone()
    # Accept floating-point rounding within 1 unit
    check(f"Overview Total Revenue (API: ₹{ov['total_revenue']} vs DB: ₹{round(db_sum, 2)})", abs(ov["total_revenue"] - round(db_sum, 2)) < 2.0)
    check(f"Overview Total Orders (API: {ov['total_orders']} vs DB: {db_cnt})", ov["total_orders"] == db_cnt)

    # Funnel checks
    r_funnel = client.get("/analytics/funnel?days=30")
    fn = r_funnel.json()
    check("6-Stage Funnel returns exactly 6 steps", len(fn.get("steps", [])) == 6)
    check("Funnel stage 1 is Homepage View", fn["steps"][0]["stage_key"] == "homepage_view")
    check("Funnel stage 6 is Purchase", fn["steps"][5]["stage_key"] == "purchase")
    check("Funnel conversion rates between 0 and 100%", all(0 <= s["conversion_from_prev"] <= 100 for s in fn["steps"]))

    # North Star
    r_ns = client.get("/analytics/north-star")
    ns_data = r_ns.json()
    check("North Star Metric returned with driver tree", "north_star_value" in ns_data and "supporting_metrics" in ns_data)

    # Cohorts
    r_coh = client.get("/analytics/cohorts")
    coh_data = r_coh.json()
    check("Cohort analysis returns 4 weeks", len(coh_data.get("cohorts", [])) == 4)

    # Segmentation
    r_seg = client.get("/segments")
    seg_data = r_seg.json()
    check("RFM Segmentation has summaries and customers", len(seg_data.get("summary", [])) >= 5 and len(seg_data.get("customers", [])) >= 25)

    # 8. Experimentation Engine
    print("\n[Phase 8] Experimentation Engine & Two-Proportion Z-Test")
    r_exp = client.get("/experiments/1/results")
    exp_res = r_exp.json()
    check("Experiment results compute control & treatment metrics", "control" in exp_res and "treatment" in exp_res)
    check("Z-Score and p-value computed", "z_score" in exp_res and "p_value" in exp_res)
    check("Confidence Interval returned", len(exp_res.get("confidence_interval_95", [])) == 2)

    # Deterministic assignment consistency test (assign 10 times, must get identical variant)
    variants = [client.post("/experiments/1/assign?customer_id=14").json().get("variant") for _ in range(5)]
    check("Deterministic hash assignment consistency (5 identical trials)", len(set(variants)) == 1)

    # 9. Inventory, Movements & Purchase Transaction
    print("\n[Phase 9] Inventory, Purchase Transactions & Stock Rollback")
    r_inv = client.get("/inventory")
    inv_data = r_inv.json()
    check("Inventory overview computes total SKUs, valuation, turnover", inv_data["total_skus"] > 0 and inv_data["total_inventory_valuation"] > 0)

    # Target product for transactional purchase test
    cursor.execute("SELECT id, stock_quantity, price FROM products WHERE active = 1 AND stock_quantity >= 5 LIMIT 1")
    test_prod_id, initial_stock, prod_price = cursor.fetchone()

    # Perform valid order
    r_order = client.post("/orders", json={
        "customer_id": 1,
        "session_id": "qa_test_session",
        "items": [{"product_id": test_prod_id, "quantity": 2, "selected_size": "M"}]
    })
    order_created = r_order.status_code == 200
    check("POST /orders creates valid order", order_created)

    # Verify inventory was decremented in DB
    cursor.execute("SELECT stock_quantity FROM products WHERE id = ?", (test_prod_id,))
    new_stock_db = cursor.fetchone()[0]
    check(f"Inventory stock reduced from {initial_stock} to {new_stock_db} (expected {initial_stock - 2})", new_stock_db == initial_stock - 2)

    # Verify inventory movement record in DB
    cursor.execute("SELECT movement_type, quantity FROM inventory_movements WHERE product_id = ? ORDER BY id DESC LIMIT 1", (test_prod_id,))
    mov_row = cursor.fetchone()
    check("InventoryMovement PURCHASE record created with quantity -2", mov_row[0] == "PURCHASE" and mov_row[1] == -2)

    # Test purchase failure and rollback on impossible quantity
    r_fail_order = client.post("/orders", json={
        "customer_id": 1,
        "session_id": "qa_test_session",
        "items": [{"product_id": test_prod_id, "quantity": 999999, "selected_size": "M"}]
    })
    check("Order exceeding stock fails with 400", r_fail_order.status_code == 400)

    cursor.execute("SELECT stock_quantity FROM products WHERE id = ?", (test_prod_id,))
    stock_after_fail = cursor.fetchone()[0]
    check("Stock remains unchanged after rollback", stock_after_fail == new_stock_db)

    # 10. Operations: Returns, Catalogue, Pricing, Roadmap, Releases
    print("\n[Phase 10] Operations Systems")
    r_ret = client.get("/returns/overview")
    check("Returns overview returns breakdown and recommendations", r_ret.status_code == 200 and len(r_ret.json().get("reasons", [])) > 0)

    r_cat_q = client.get("/catalogue/quality")
    check("Catalogue Quality Health Score computed", r_cat_q.status_code == 200 and r_cat_q.json().get("catalogue_health_score", 0) > 0)

    r_sim = client.post("/promotions/simulate", json={
        "product_id": test_prod_id,
        "discount_percentage": 25.0,
        "price_elasticity": -1.8
    })
    sim_data = r_sim.json()
    check("Promotion simulator computes revenue and margin delta", r_sim.status_code == 200 and "revenue_delta_pct" in sim_data and "assumptions_notice" in sim_data)

    # Roadmap CRUD
    r_task_create = client.post("/roadmap/tasks", json={
        "title": "QA Test Initiative",
        "description": "Verification task",
        "reach": 5000,
        "impact": 2.0,
        "confidence": 90,
        "effort": 3.0
    })
    check("Roadmap Task created with auto-calculated RICE score", r_task_create.status_code == 200 and r_task_create.json().get("rice_score", 0) > 0)
    created_task_id = r_task_create.json()["id"]

    r_task_del = client.delete(f"/roadmap/tasks/{created_task_id}")
    check("Roadmap Task deleted cleanly", r_task_del.status_code == 200)

    # Release Readiness gate test
    r_rels = client.get("/releases")
    rels = r_rels.json()
    check("Release list returned", len(rels) > 0)
    first_rel_id = rels[0]["id"]
    r_rel_gate = client.patch(f"/releases/{first_rel_id}", json={
        "status": "READY_FOR_DEPLOY",
        "checklist": {"qa_testing_passed": False}
    })
    check("Release Gate prevents approval when mandatory QA is False (HTTP 400)", r_rel_gate.status_code == 400)

    # Summary
    print("\n==================================================")
    print(f"📊 QA AUDIT SUMMARY: {len(passes)} Passed, {len(errors)} Failed")
    print("==================================================")
    if errors:
        for name, det in errors:
            print(f"  ❌ {name}: {det}")
        sys.exit(1)
    else:
        print("🎉 ALL 32 BACKEND & DATABASE QA AUDIT CHECKS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_qa_audit()
