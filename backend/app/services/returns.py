from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.returns import Return
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.operations import (
    ReturnOverviewResponse, ReturnReasonBreakdown, CategoryReturnItem
)

def get_return_overview(db: Session) -> ReturnOverviewResponse:
    eligible={o.id for o in db.query(Order).filter(Order.status.in_(["COMPLETED","RETURNED"])).all()}
    total_orders=len(eligible)
    returns=[r for r in db.query(Return).all() if r.order_id in eligible]
    total_returns=len(returns)
    overall_rate=round(len({r.order_id for r in returns})/total_orders*100,2) if total_orders else 0.0

    # Reason breakdown
    reason_counts: Dict[str, int] = {}
    size_returns = 0
    for r in returns:
        reason_counts[r.return_reason] = reason_counts.get(r.return_reason, 0) + 1
        if "size" in r.return_reason.lower() or "fit" in r.return_reason.lower():
            size_returns += 1

    size_pct = round((size_returns / total_returns * 100.0), 2) if total_returns > 0 else 0.0

    reason_list = [
        ReturnReasonBreakdown(
            reason=reason,
            count=count,
            percentage=round((count / total_returns) * 100.0, 1) if total_returns > 0 else 0.0
        )
        for reason, count in sorted(reason_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # Category breakdown
    cat_items = []
    categories = [c[0] for c in db.query(Product.category).distinct().all()]
    for cat in categories:
        cat_prods = db.query(Product.id).filter(Product.category == cat).all()
        prod_ids = [p[0] for p in cat_prods]
        if not prod_ids:
            continue
        category_returns=[r for r in returns if r.product_id in prod_ids]
        cat_ret_cnt=len({r.order_id for r in category_returns})
        cat_order_est=len({i.order_id for i in db.query(OrderItem).filter(OrderItem.product_id.in_(prod_ids)).all() if i.order_id in eligible})
        rate=round(cat_ret_cnt/cat_order_est*100,1) if cat_order_est else 0.0
        from collections import Counter
        reasons_for_category=Counter(r.return_reason for r in category_returns)
        cat_items.append(CategoryReturnItem(
            category=cat,
            total_orders=cat_order_est,
            returned_orders=cat_ret_cnt,
            return_rate=rate,
            primary_reason=reasons_for_category.most_common(1)[0][0] if reasons_for_category else "No observed returns"
        ))

    # Top problematic products
    prod_return_counts = db.query(
        Return.product_id, func.count(Return.id).label("ret_count")
    ).group_by(Return.product_id).order_by(func.count(Return.id).desc()).limit(5).all()

    problem_prods = []
    for pid, rcnt in prod_return_counts:
        prod = db.query(Product).filter(Product.id == pid).first()
        if prod:
            problem_prods.append({
                "product_id": prod.id,
                "name": prod.name,
                "brand": prod.brand,
                "category": prod.category,
                "returns_count": rcnt,
                "heuristic_risk_score": min(95, 40 + (rcnt * 12)),
                "primary_complaint": next((r.return_reason for r in returns if r.product_id==pid), "No eligible returns")
            })

    recommendations = [f"Size/fit reasons account for {size_pct}% of observed return records. Review product measurements and size guidance.",
                       "Risk scores are unvalidated heuristics; inspect actual return reasons before taking action."]

    return ReturnOverviewResponse(
        total_orders=total_orders,
        total_returns=total_returns,
        overall_return_rate=overall_rate,
        size_related_returns_pct=size_pct,
        reasons=reason_list,
        category_breakdown=cat_items,
        top_problematic_products=problem_prods,
        recommendations=recommendations
    )
