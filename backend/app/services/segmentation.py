from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.analytics import SegmentationResponse, SegmentSummary, SegmentCustomer

STRATEGIES = {
    "Champions": "Provide VIP early access to luxury capsules, concierge styling, and premium loyalty perks.",
    "Loyal Customers": "Cross-sell complete outfits and reward with exclusive tier benefits to maximize lifetime value.",
    "Potential Loyalists": "Offer personalized bundle recommendations and threshold discounts (e.g. 15% off orders over ₹3,000).",
    "New Customers": "Send welcoming style onboarding guides, first-order size assistance, and second-purchase incentives.",
    "At-Risk Customers": "Deploy win-back re-engagement emails featuring new arrivals in their favored categories and price drops.",
    "Dormant Customers": "Run periodic reactivation campaigns with limited-time flash vouchers and curated bestsellers."
}

def calculate_customer_segments(db: Session) -> SegmentationResponse:
    now = datetime.utcnow()
    customers = db.query(Customer).all()

    # Query customer order aggregations
    order_data = db.query(
        Order.customer_id,
        func.max(Order.created_at).label("latest_order"),
        func.count(Order.id).label("order_count"),
        func.sum(Order.total_amount).label("total_spend")
    ).filter(Order.status == "COMPLETED").group_by(Order.customer_id).all()

    order_map = {row.customer_id: row for row in order_data}

    segmented_customers: List[SegmentCustomer] = []
    segment_counts: Dict[str, List[SegmentCustomer]] = {k: [] for k in STRATEGIES.keys()}

    for c in customers:
        o = order_map.get(c.id)
        if o:
            recency_days = (now - o.latest_order).days
            freq = o.order_count
            monetary = round(float(o.total_spend or 0.0), 2)
        else:
            recency_days = max(0, (now - c.created_at).days)
            freq = 0
            monetary = 0.0

        # Segment assignment heuristics
        if freq >= 4 and monetary >= 10000 and recency_days <= 30:
            seg = "Champions"
        elif freq >= 3 and recency_days <= 60:
            seg = "Loyal Customers"
        elif freq >= 2 and recency_days <= 45:
            seg = "Potential Loyalists"
        elif freq == 1 and recency_days <= 21:
            seg = "New Customers"
        elif freq >= 2 and recency_days > 45:
            seg = "At-Risk Customers"
        else:
            seg = "Dormant Customers"

        item = SegmentCustomer(
            customer_id=c.id,
            name=c.display_name,
            segment=seg,
            recency_days=recency_days,
            frequency_orders=freq,
            monetary_spend=monetary,
            actionable_strategy=STRATEGIES[seg]
        )
        segmented_customers.append(item)
        segment_counts[seg].append(item)

    total_customers = len(customers) or 1
    summaries: List[SegmentSummary] = []
    
    for seg_name, members in segment_counts.items():
        cnt = len(members)
        pct = round((cnt / total_customers) * 100.0, 1)
        avg_spend = round(sum(m.monetary_spend for m in members) / cnt, 2) if cnt > 0 else 0.0
        summaries.append(SegmentSummary(
            segment_name=seg_name,
            customer_count=cnt,
            percentage=pct,
            average_spend=avg_spend,
            strategy=STRATEGIES[seg_name]
        ))

    return SegmentationResponse(
        summary=summaries,
        customers=segmented_customers
    )
