"""Atomic stock reservation and replay-safe simulated orders; no payment processing."""
import hashlib
import json
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError, OperationalError
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.event import Event
from app.models.inventory import InventoryMovement


def money(value):
    try:
        result = Decimal(str(value))
    except Exception:
        raise HTTPException(400, "Invalid product price")
    if not result.is_finite() or result < 0:
        raise HTTPException(400, "Invalid product price")
    return result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def place_order(db, req):
    canonical = req.model_dump(exclude={"idempotency_key", "session_id"})
    canonical["items"] = sorted(canonical["items"], key=lambda x: (x["product_id"], x["selected_size"], x["quantity"]))
    fingerprint = hashlib.sha256(json.dumps(canonical, sort_keys=True).encode()).hexdigest()

    def replay(order):
        if order.request_fingerprint != fingerprint:
            raise HTTPException(409, "Idempotency key already used for a different checkout")
        return order

    existing = db.query(Order).filter_by(idempotency_key=req.idempotency_key).first()
    if existing:
        return replay(existing)
    try:
        if not db.get(Customer, req.customer_id):
            raise HTTPException(404, "Customer not found")
        order = Order(customer_id=req.customer_id, session_id=req.session_id or req.idempotency_key,
                      total_amount=Decimal("0.00"), status="PENDING",
                      idempotency_key=req.idempotency_key, request_fingerprint=fingerprint)
        db.add(order)
        # Unique-key insert reserves this checkout; on SQLite it also serializes writers.
        db.flush()
        total = Decimal("0.00")
        for item in sorted(req.items, key=lambda x: x.product_id):
            product = db.query(Product).filter_by(id=item.product_id).with_for_update().first()
            if not product or not product.active:
                raise HTTPException(404, "Product not found or inactive")
            if item.selected_size not in (product.sizes_available or []):
                raise HTTPException(422, "Invalid size selection")
            if not isinstance(product.stock_quantity, int) or product.stock_quantity < 0:
                raise HTTPException(400, "Invalid inventory value")
            price = money(product.price)
            changed = db.execute(update(Product).where(
                Product.id == product.id, Product.active.is_(True),
                Product.stock_quantity >= item.quantity
            ).values(stock_quantity=Product.stock_quantity - item.quantity),
                execution_options={"synchronize_session": False})
            if changed.rowcount != 1:
                raise HTTPException(400, "Insufficient stock")
            db.expire(product)
            total += price * item.quantity
            db.add(OrderItem(order_id=order.id, product_id=product.id, quantity=item.quantity,
                             unit_price=price, selected_size=item.selected_size))
            db.add(InventoryMovement(product_id=product.id, movement_type="PURCHASE",
                                     quantity=-item.quantity, reference=f"Order #{order.id}"))
        # Delivery is free in this simulated checkout; there are no client-supplied discounts.
        order.total_amount = total
        order.status = "COMPLETED"
        db.add(Event(customer_id=req.customer_id, session_id=order.session_id,
                     event_type="purchase", event_metadata={"order_id": order.id, "total_amount": float(total)},
                     occurred_at=datetime.utcnow()))
        db.commit()
        db.refresh(order)
        return order
    except IntegrityError:
        db.rollback()
        existing = db.query(Order).filter_by(idempotency_key=req.idempotency_key).first()
        if existing:
            return replay(existing)
        raise HTTPException(409, "Checkout conflicts with stored data")
    except OperationalError:
        db.rollback()
        raise HTTPException(503, "Checkout temporarily unavailable; retry with the same checkout key")
    except Exception:
        db.rollback()
        raise
