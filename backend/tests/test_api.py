import io
import pytest
from PIL import Image

def test_01_health_endpoint(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "StyleSense" in data["service"]

def test_02_product_listing(client):
    res = client.get("/api/v1/products?page=1&limit=20")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 100
    assert len(data["items"]) == 20
    assert "sku" in data["items"][0]

def test_03_product_details(client):
    res = client.get("/api/v1/products/101")
    assert res.status_code == 200
    prod = res.json()
    assert prod["id"] == 101
    assert prod["price"] > 0
    assert len(prod["sizes_available"]) > 0

def test_04_search_filters(client):
    res = client.post("/api/v1/search", json={
        "category": "Shirts",
        "min_price": 500,
        "max_price": 4000,
        "page": 1,
        "limit": 10
    })
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    for p in data["items"]:
        assert "shirt" in p["category"].lower()
        assert 500 <= p["price"] <= 4000

def test_05_natural_language_parsing(client):
    res = client.post("/api/v1/search", json={
        "query": "find black casual sneakers under 2500"
    })
    assert res.status_code == 200
    data = res.json()
    filters = data["parsed_filters"]
    assert filters["colour"] == "Black"
    assert filters["max_price"] == 2500.0
    assert data["parser_type"] == "deterministic_rule_tfidf"

def test_06_recommendation_ranking(client):
    res = client.get("/api/v1/recommendations/1?limit=6")
    assert res.status_code == 200
    data = res.json()
    assert data["customer_id"] == 1
    assert len(data["items"]) > 0
    first = data["items"][0]
    assert "product" in first
    assert "score" in first
    assert len(first["explanation"]) > 0

def test_07_cold_start_recommendations(client):
    res = client.get("/api/v1/recommendations/0?limit=5")
    assert res.status_code == 200
    data = res.json()
    assert data["strategy"] == "cold_start_popular"
    assert len(data["items"]) == 5

def test_08_image_upload_validation(client):
    # Valid PNG image upload
    img_byte_arr = io.BytesIO()
    img = Image.new("RGB", (60, 60), color="blue")
    img.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)

    res_valid = client.post(
        "/api/v1/visual-search",
        files={"file": ("test_blue.png", img_byte_arr, "image/png")}
    )
    assert res_valid.status_code == 200
    v_data = res_valid.json()
    assert "extracted_colour" in v_data
    assert len(v_data["items"]) > 0

    # Invalid file extension upload
    txt_file = io.BytesIO(b"malicious script or bad file")
    res_invalid = client.post(
        "/api/v1/visual-search",
        files={"file": ("bad_script.txt", txt_file, "text/plain")}
    )
    assert res_invalid.status_code == 400

def test_09_size_recommendation(client):
    res = client.post("/api/v1/size-recommendation", json={
        "category": "Shirts",
        "brand": "UrbanKnit",
        "height_cm": 178,
        "chest_cm": 100,
        "waist_cm": 84,
        "preferred_fit": "Regular"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["recommended_size"] in ["M", "L"]
    assert 0.70 <= data["confidence_score"] <= 1.0
    assert len(data["explanation"]) > 0

def test_10_event_creation(client):
    res = client.post("/api/v1/events", json={
        "customer_id": 1,
        "session_id": "test_sess_001",
        "product_id": 101,
        "event_type": "product_view",
        "metadata": {"source": "unit_test"}
    })
    assert res.status_code == 200
    data = res.json()
    assert data["id"] > 0
    assert data["event_type"] == "product_view"

def test_11_funnel_calculations(client):
    res = client.get("/api/v1/analytics/funnel?days=30")
    assert res.status_code == 200
    data = res.json()
    assert len(data["steps"]) == 6
    assert data["total_sessions"] > 0
    assert data["steps"][0]["step_name"] == "Homepage View"
    assert data["steps"][5]["step_name"] == "Purchase"
    for s in data["steps"]:
        assert 0 <= s["drop_off_rate"] <= 100

def test_12_cohort_retention(client):
    res = client.get("/api/v1/analytics/cohorts")
    assert res.status_code == 200
    data = res.json()
    assert len(data["cohorts"]) >= 1
    for row in data["cohorts"]:
        assert len(row["weeks"]) == 5
        assert row["weeks"][0]["retention_rate"] in (100.0, None)

def test_13_customer_segmentation(client):
    res = client.get("/api/v1/segments")
    assert res.status_code == 200
    data = res.json()
    assert len(data["summary"]) >= 5
    assert len(data["customers"]) >= 25
    first_cust = data["customers"][0]
    assert first_cust["segment"] in ["Champions", "Loyal Customers", "Potential Loyalists", "New Customers", "At-Risk Customers", "Dormant Customers"]

def test_14_experiment_assignment_consistency(client):
    # Customer 5 assigned multiple times should consistently receive identical variant
    res1 = client.post("/api/v1/experiments/1/assign?customer_id=5")
    assert res1.status_code == 200
    variant1 = res1.json()["variant"]

    res2 = client.post("/api/v1/experiments/1/assign?customer_id=5")
    assert res2.status_code == 200
    variant2 = res2.json()["variant"]
    assert variant1 == variant2

def test_15_experiment_result_calculations(client):
    res = client.get("/api/v1/experiments/1/results")
    assert res.status_code == 200
    data = res.json()
    assert "control" in data
    assert "treatment" in data
    assert "p_value" in data
    assert "z_score" in data
    assert len(data["confidence_interval_95"]) == 2

def test_16_feature_flag_rollout(client):
    flags = client.get("/api/v1/feature-flags").json()
    assert len(flags) > 0
    target_id = flags[0]["id"]
    
    # Toggle rollout percentage
    patch_res = client.patch(f"/api/v1/feature-flags/{target_id}", json={
        "rollout_percentage": 75.0,
        "enabled": True
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["rollout_percentage"] == 75.0

def test_17_inventory_update(client):
    initial_stock = client.get("/api/v1/products/101").json()["stock_quantity"]
    mov_res = client.post("/api/v1/inventory/movements", json={
        "product_id": 101,
        "movement_type": "RESTOCK",
        "quantity": 25,
        "reference": "Supplier PO-998"
    })
    assert mov_res.status_code == 200
    new_stock = client.get("/api/v1/products/101").json()["stock_quantity"]
    assert new_stock == initial_stock + 25

def test_18_replenishment_calculations(client):
    res = client.get("/api/v1/inventory/forecast/101")
    assert res.status_code == 200
    data = res.json()
    assert data["daily_run_rate_units"] >= 0
    assert data["days_until_stockout"] >= 0
    assert data["recommended_po_quantity"] >= 0
    assert len(data["historical_weekly_sales"]) == 4
    # An unsold SKU must retain zero demand, rather than inventing a positive floor.
    if sum(data["historical_weekly_sales"]) == 0:
        assert data["daily_run_rate_units"] == 0

def test_19_return_analytics(client):
    res = client.get("/api/v1/returns/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_returns"] > 0
    assert len(data["reasons"]) > 0
    assert len(data["recommendations"]) > 0

def test_20_catalogue_quality_detection(client):
    res = client.get("/api/v1/catalogue/quality")
    assert res.status_code == 200
    data = res.json()
    assert 0 <= data["catalogue_health_score"] <= 100
    assert data["total_products_checked"] >= 100

def test_21_promotion_simulation(client):
    res = client.post("/api/v1/promotions/simulate", json={
        "product_id": 101,
        "discount_percentage": 20.0,
        "price_elasticity": -1.8
    })
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_selling_price"] < data["baseline_price"]
    assert data["scenario_estimated_units"] > data["baseline_units_per_month"]
    assert "assumptions_notice" in data

def test_22_rice_score_calculation():
    from app.services.roadmap import compute_rice_score
    # Reach=1000, Impact=2, Conf=80%, Effort=4 -> (1000 * 2 * 0.8) / 4 = 400.0
    score = compute_rice_score(1000, 2, 80, 4)
    assert score == 400.0

def test_23_roadmap_task_crud(client):
    # Create task
    create_res = client.post("/api/v1/roadmap/tasks", json={
        "title": "Automated Visual Search Refinement",
        "description": "Improve histogram quantization",
        "owner": "Storefront PM",
        "reach": 5000,
        "impact": 2.0,
        "confidence": 90,
        "effort": 2.5
    })
    assert create_res.status_code == 200
    task_id = create_res.json()["id"]
    assert create_res.json()["rice_score"] > 0

    # Patch task
    patch_res = client.patch(f"/api/v1/roadmap/tasks/{task_id}", json={
        "status": "IN_PROGRESS"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "IN_PROGRESS"

    # Delete task
    del_res = client.delete(f"/api/v1/roadmap/tasks/{task_id}")
    assert del_res.status_code == 200

def test_24_release_readiness_gate(client):
    releases = client.get("/api/v1/releases").json()
    assert len(releases) > 0
    rel_id = releases[0]["id"]

    # Attempt to mark READY_FOR_DEPLOY while QA is incomplete -> should fail with 400
    fail_res = client.patch(f"/api/v1/releases/{rel_id}", json={
        "status": "READY_FOR_DEPLOY",
        "checklist": {"qa_testing_passed": False}
    })
    assert fail_res.status_code == 400
    assert "Mandatory checklist items incomplete" in fail_res.json()["detail"]

def test_25_order_creation_success(client):
    prod = client.get("/api/v1/products/102").json()
    initial_stock = prod["stock_quantity"]
    assert initial_stock >= 2

    res = client.post("/api/v1/orders", json={
        "customer_id": 1,
        "session_id": "test_order_session",
        "idempotency_key": "legacy-success-order",
        "address_id": 1,
        "items": [
            {"product_id": 102, "quantity": 2, "selected_size": "M"}
        ]
    })
    assert res.status_code == 200
    order_data = res.json()
    assert order_data["id"] > 0
    assert order_data["total_amount"] == round(prod["price"] * 2, 2)

    # Verify stock reduction
    after_stock = client.get("/api/v1/products/102").json()["stock_quantity"]
    assert after_stock == initial_stock - 2

def test_26_stock_reduction_and_rollback_on_failure(client):
    prod = client.get("/api/v1/products/103").json()
    stock_before = prod["stock_quantity"]

    # Order an impossible quantity exceeding available stock
    fail_order = client.post("/api/v1/orders", json={
        "customer_id": 1,
        "idempotency_key": "legacy-failure-order",
        "address_id": 1,
        "items": [
            {"product_id": 103, "quantity": 9999, "selected_size": "M"}
        ]
    })
    assert fail_order.status_code == 400
    assert "Insufficient stock" in fail_order.json()["detail"]

    # Stock must remain unchanged after rollback
    stock_after = client.get("/api/v1/products/103").json()["stock_quantity"]
    assert stock_after == stock_before
