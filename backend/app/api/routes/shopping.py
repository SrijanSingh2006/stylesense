from app.services.security import current_user, optional_user, own_customer, require
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.schemas.shopping import (
    CartEventRequest,
    OrderCreateRequest,
    OrderResponse,
    OrderItemResponse,
)
from app.models.event import Event
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.inventory import InventoryMovement

router = APIRouter()


@router.post("/cart/events", tags=["Shopping"])
def record_cart_event(
    req: CartEventRequest, db: Session = Depends(get_db), user=Depends(optional_user)
):
    if req.customer_id is not None:
        if not user:
            raise HTTPException(401, "Sign in required")
        own_customer(user, req.customer_id)
    from app.models.customer import Customer

    if req.customer_id is not None and not db.get(Customer, req.customer_id):
        raise HTTPException(404, "Customer not found")
    if not db.get(Product, req.product_id):
        raise HTTPException(404, "Product not found")
    event = Event(
        customer_id=req.customer_id,
        session_id=req.session_id,
        product_id=req.product_id,
        event_type="add_to_cart" if req.action == "add" else "cart_update",
        event_metadata={
            "action": req.action,
            "quantity": req.quantity,
            "selected_size": req.selected_size,
        },
        occurred_at=datetime.utcnow(),
    )
    db.add(event)
    db.commit()
    return {"status": "success", "event_id": event.id, "action": req.action}


@router.post("/orders", response_model=OrderResponse, tags=["Shopping"])
def create_order(
    req: OrderCreateRequest,
    db: Session = Depends(get_db),
    user=Depends(require("cart.manage")),
):
    from app.services.checkout import place_order

    own_customer(user, req.customer_id)
    from app.services.accounts import owned_address, address_view
    from app.services.security import notify, record_audit

    address = owned_address(db, user, req.address_id)

    def after_order(order):
        notify(
            db,
            user.id,
            "Order confirmed",
            f"Simulated order #{order.id} is confirmed. No payment was collected.",
            "order",
        )
        record_audit(db, user, "commerce.order_created", "order", order.id)

    return place_order(
        db,
        req,
        user=user,
        address_snapshot=address_view(address),
        after_order=after_order,
    )
