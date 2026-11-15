from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, update
from app.models.product import Product
from app.models.inventory import InventoryMovement
from app.models.order import OrderItem, Order
from app.schemas.operations import (
    InventoryOverviewResponse, InventoryAlertItem, InventoryForecastResponse, InventoryMovementCreate
)

def record_inventory_movement(db: Session, movement: InventoryMovementCreate) -> InventoryMovement:
    product = db.query(Product).filter(Product.id == movement.product_id).first()
    if not product:
        raise ValueError(f"Product {movement.product_id} not found")

    changed = db.execute(update(Product).where(Product.id == product.id,
        Product.stock_quantity + movement.quantity >= 0).values(stock_quantity=Product.stock_quantity + movement.quantity),
        execution_options={"synchronize_session":False})
    if changed.rowcount != 1:
        db.rollback()
        raise ValueError("Insufficient stock")
    db.expire(product)

    rec = InventoryMovement(
        product_id=movement.product_id,
        movement_type=movement.movement_type,
        quantity=movement.quantity,
        reference=movement.reference
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

def get_inventory_overview(db: Session) -> InventoryOverviewResponse:
    products = db.query(Product).filter(Product.active == True).all()
    
    total_skus = len(products)
    total_units = sum(p.stock_quantity for p in products)
    total_valuation = round(sum(p.stock_quantity * p.price for p in products), 2)

    alerts: List[InventoryAlertItem] = []
    out_of_stock_cnt = 0
    low_stock_cnt = 0

    for p in products:
        daily_sales = sales_in_window(db, p.id) / 28.0
        coverage_days = round(p.stock_quantity / daily_sales, 1) if daily_sales else 0.0

        if p.stock_quantity <= 0:
            status = "OUT_OF_STOCK"
            out_of_stock_cnt += 1
            reorder_qty = max(50, p.reorder_point * 3)
            alerts.append(InventoryAlertItem(
                product_id=p.id,
                name=p.name,
                category=p.category,
                current_stock=p.stock_quantity,
                reorder_point=p.reorder_point,
                status=status,
                stock_coverage_days=0.0,
                recommended_reorder_qty=reorder_qty
            ))
        elif p.stock_quantity <= p.reorder_point:
            status = "CRITICAL_LOW" if p.stock_quantity <= (p.reorder_point // 2) else "LOW"
            low_stock_cnt += 1
            reorder_qty = (p.reorder_point * 3) - p.stock_quantity
            alerts.append(InventoryAlertItem(
                product_id=p.id,
                name=p.name,
                category=p.category,
                current_stock=p.stock_quantity,
                reorder_point=p.reorder_point,
                status=status,
                stock_coverage_days=coverage_days,
                recommended_reorder_qty=reorder_qty
            ))

    alerts.sort(key=lambda a: a.current_stock)

    # Simplified annual turnover ratio = Cost of goods sold / average inventory
    sold = sum(sales_in_window(db, p.id) for p in products)
    turnover = round(sold / total_units, 2) if total_units else 0.0

    return InventoryOverviewResponse(
        total_skus=total_skus,
        total_inventory_units=total_units,
        total_inventory_valuation=total_valuation,
        out_of_stock_count=out_of_stock_cnt,
        low_stock_count=low_stock_cnt,
        inventory_turnover_ratio=turnover,
        alerts=alerts
    )

def get_inventory_forecast(db: Session, product_id: int) -> InventoryForecastResponse:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError(f"Product {product_id} not found")

    cutoff = datetime.utcnow() - timedelta(days=28)
    recent_sold = sales_in_window(db, product_id)
    daily_rate = round(recent_sold / 28.0, 4)
    days_left = round(product.stock_quantity / daily_rate, 1) if daily_rate else 0.0
    status = "OUT_OF_STOCK" if product.stock_quantity <= 0 else ("REORDER_REQUIRED" if product.stock_quantity <= product.reorder_point else "HEALTHY")
    rec_po = max(0, int(daily_rate * 28 + product.reorder_point - product.stock_quantity))
    hist_sales = [sales_in_window(db, product_id, cutoff + timedelta(days=i*7), cutoff + timedelta(days=(i+1)*7)) for i in range(4)]

    return InventoryForecastResponse(
        product_id=product.id,
        product_name=product.name,
        current_stock=product.stock_quantity,
        daily_run_rate_units=daily_rate,
        days_until_stockout=days_left,
        reorder_threshold=product.reorder_point,
        status=status,
        recommended_po_quantity=rec_po,
        historical_weekly_sales=hist_sales
    )

def sales_in_window(db, product_id, start=None, end=None):
    end=end or datetime.utcnow()
    start=start or end-timedelta(days=28)
    return db.query(func.sum(OrderItem.quantity)).join(Order).filter(OrderItem.product_id==product_id,
        Order.status=="COMPLETED",Order.created_at>=start,Order.created_at<end).scalar() or 0
