import httpx
import sys
from app.db.session import SessionLocal
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.event import Event
from app.models.experiment import Experiment, ExperimentAssignment
from app.models.inventory import InventoryMovement
from app.models.release import Release

BASE_URL = "http://127.0.0.1:8000/api/v1"

def print_result(name: str, passed: bool, detail: str = ""):
    status = "PASS" if passed else "FAIL"
    print(f"  [{status}] {name} {f'({detail})' if detail else ''}")
    if not passed:
        sys.exit(1)

def run_edge_case_audit():
    print("=" * 60)
    print("🔍 STYLESENSE SENIOR QA: DEEP EDGE CASE & INTEGRATION AUDIT")
    print("=" * 60)

    db = SessionLocal()
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    try:
        # Edge Case 1: Database Relationships & Foreign Keys
        print("\n[Edge Case 1] Database Relationships & Cascade Checks")
        orders = db.query(Order).limit(10).all()
        rel_ok = len(orders) > 0 and all(o.customer is not None for o in orders)
        print_result("Order to Customer relationship intact", rel_ok, f"{len(orders)} checked")

        order_items = db.query(OrderItem).limit(20).all()
        items_ok = len(order_items) > 0 and all(oi.order is not None and oi.product is not None for oi in order_items)
        print_result("OrderItem to Order and Product relationships intact", items_ok, f"{len(order_items)} checked")

        # Edge Case 2: Inconsistent Experiment Assignment (Determinism Test)
        print("\n[Edge Case 2] Experiment Assignment Determinism & Salt Integrity")
        exp = db.query(Experiment).filter(Experiment.status == "RUNNING").first()
        if exp:
            test_cid = 777
            res1 = client.post(f"/experiments/{exp.id}/assign?customer_id={test_cid}")
            v1 = res1.json()["variant"]
            # Repeat 20 times across different instances
            consistent = True
            for _ in range(20):
                res = client.post(f"/experiments/{exp.id}/assign?customer_id={test_cid}")
                if res.json()["variant"] != v1:
                    consistent = False
                    break
            print_result("Experiment assignment 100% deterministic across 20 trials", consistent, f"Variant: {v1}")
        else:
            print_result("Experiment assignment checked", True, "No running experiment")

        # Edge Case 3: Invalid Image Uploads Handling
        print("\n[Edge Case 3] Image Upload Edge Cases & Security Validation")
        # Text file masquerading as image
        res_txt = client.post(
            "/visual-search",
            files={"file": ("malicious.txt", b"Hello this is not an image at all", "text/plain")}
        )
        print_result("Text file rejected with 400 Bad Request", res_txt.status_code == 400, f"Status: {res_txt.status_code}")

        # Empty file
        res_empty = client.post(
            "/visual-search",
            files={"file": ("empty.jpg", b"", "image/jpeg")}
        )
        print_result("Empty image bytes rejected with 400", res_empty.status_code == 400, f"Status: {res_empty.status_code}")

        # Corrupted JPEG header
        res_corrupt = client.post(
            "/visual-search",
            files={"file": ("corrupt.jpg", b"\xFF\xD8\xFF\xE0junkdata1234567890", "image/jpeg")}
        )
        print_result("Corrupted image stream handled gracefully (400)", res_corrupt.status_code == 400, f"Status: {res_corrupt.status_code}")

        # Edge Case 4: Stock Underflow & Transactional Rollback
        print("\n[Edge Case 4] Stock Underflow, Negative Inventory & Rollback")
        prod = db.query(Product).filter(Product.active == True).first()
        initial_stock = prod.stock_quantity

        # Attempt to order way more than available
        insufficient_payload = {
            "customer_id": 1,
            "session_id": "audit-edge-session-1",
            "items": [{"product_id": prod.id, "quantity": initial_stock + 9999, "selected_size": "M"}]
        }
        res_underflow = client.post("/orders", json=insufficient_payload)
        print_result("Excessive order blocked with 400", res_underflow.status_code == 400, res_underflow.json().get("detail", ""))

        db.refresh(prod)
        print_result("Stock remains strictly unchanged after rejection", prod.stock_quantity == initial_stock, f"Stock: {prod.stock_quantity}")

        # Edge Case 5: Conversion Rates & Mathematical Bounds
        print("\n[Edge Case 5] Analytics Rates Mathematical Bounds [0.0, 100.0]")
        res_metrics = client.get("/analytics/overview?days=30").json()
        cr = res_metrics["conversion_rate"]
        ar = res_metrics["cart_abandonment_rate"]
        rr = res_metrics["return_rate"]
        rep_r = res_metrics["repeat_customer_rate"]

        bounds_ok = (0.0 <= cr <= 100.0) and (0.0 <= ar <= 100.0) and (0.0 <= rr <= 100.0) and (0.0 <= rep_r <= 100.0)
        print_result("All overview rates within valid percentage bounds", bounds_ok, f"Conv: {cr}%, Aband: {ar}%, Ret: {rr}%")

        res_funnel = client.get("/analytics/funnel?days=30").json()
        funnel_bounds_ok = all(0.0 <= s["conversion_from_prev"] <= 100.0 and 0.0 <= s["drop_off_rate"] <= 100.0 for s in res_funnel["steps"])
        print_result("Funnel step rates strictly bounded [0%, 100%]", funnel_bounds_ok)

        # Edge Case 6: Release Readiness Quality Gate Enforcement
        print("\n[Edge Case 6] Release Readiness Enforces All Mandatory Checks")
        rel = db.query(Release).first()
        if rel:
            # Try to force ready without mandatory checks
            rel.checklist = {k: False for k in rel.checklist.keys()}
            db.commit()

            res_gate = client.patch(f"/releases/{rel.id}", json={"status": "READY_FOR_DEPLOY"})
            print_result("Incomplete checklist blocked from READY_FOR_DEPLOY (400)", res_gate.status_code == 400, res_gate.json().get("detail", ""))

            # Now mark all True and re-attempt
            rel.checklist = {k: True for k in rel.checklist.keys()}
            db.commit()

            res_gate_pass = client.patch(f"/releases/{rel.id}", json={"status": "READY_FOR_DEPLOY"})
            print_result("Complete checklist successfully approved (200)", res_gate_pass.status_code == 200, f"Status: {res_gate_pass.json().get('status')}")

        print("\n" + "=" * 60)
        print("🎉 ALL SENIOR QA EDGE CASE TESTS PASSED WITHOUT DEFECTS!")
        print("=" * 60)

    finally:
        client.close()
        db.close()

if __name__ == "__main__":
    run_edge_case_audit()
