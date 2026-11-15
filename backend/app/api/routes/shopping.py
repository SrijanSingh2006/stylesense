from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.schemas.shopping import CartEventRequest, OrderCreateRequest, OrderResponse, OrderItemResponse
from app.models.event import Event
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.inventory import InventoryMovement

router = APIRouter()

@router.post("/cart/events", tags=["Shopping"])
def record_cart_event(req: CartEventRequest, db: Session = Depends(get_db)):
    event = Event(
        customer_id=req.customer_id,
        session_id=req.session_id,
        product_id=req.product_id,
        event_type="add_to_cart" if req.action == "add" else "cart_update",
        event_metadata={"action": req.action, "quantity": req.quantity, "selected_size": req.selected_size},
        occurred_at=datetime.utcnow()
    )
    db.add(event)
    db.commit()
    return {"status": "success", "event_id": event.id, "action": req.action}

@router.post("/orders", response_model=OrderResponse, tags=["Shopping"])
def create_order(req: OrderCreateRequest, db: Session = Depends(get_db)):
    if not req.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    try:
        total_amount = 0.0
        order_items_to_create = []

        # Validate stock and calculate total within transaction
        for item in req.items:
            product = db.query(Product).filter(Product.id == item.product_id, Product.active == True).with_for_update().first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found or inactive")
            
            if product.stock_quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for '{product.name}'. Available: {product.stock_quantity}, Requested: {item.quantity}"
                )

            # Deduct stock
            product.stock_quantity -= item.quantity
            item_price = product.price
            total_amount += (item_price * item.quantity)

            order_items_to_create.append((product, item.quantity, item_price, item.selected_size))

        order = Order(
            customer_id=req.customer_id,
            session_id=req.session_id or f"sess_{datetime.utcnow().timestamp()}",
            total_amount=round(total_amount, 2),
            status="COMPLETED",
            created_at=datetime.utcnow()
        )
        db.add(order)
        db.flush() # get order.id

        created_items = []
        for prod, qty, price, size in order_items_to_create:
            oi = OrderItem(
                order_id=order.id,
                product_id=prod.id,
                quantity=qty,
                unit_price=price,
                selected_size=size
            )
            db.add(oi)
            created_items.append(oi)

            # Record inventory movement
            inv_mov = InventoryMovement(
                product_id=prod.id,
                movement_type="PURCHASE",
                quantity=-qty,
                reference=f"Order #{order.id}"
            )
            db.add(inv_mov)

        # Log purchase event
        purchase_event = Event(
            customer_id=req.customer_id,
            session_id=order.session_id,
            event_type="purchase",
            event_metadata={"order_id": order.id, "total_amount": order.total_amount, "item_count": len(req.items)},
            occurred_at=datetime.utcnow()
        )
        db.add(purchase_event)

        db.commit()
        db.refresh(order)

        return OrderResponse(
            id=order.id,
            customer_id=order.customer_id,
            session_id=order.session_id,
            total_amount=order.total_amount,
            status=order.status,
            created_at=order.created_at,
            items=[OrderItemResponse.from_orm(oi) for oi in order.items]
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to place order: {str(e)}")
