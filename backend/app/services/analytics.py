"""UTC observation-based metrics. See docs/KPI_DEFINITIONS.md for denominators."""
from datetime import datetime, timedelta
from collections import defaultdict
from decimal import Decimal
from sqlalchemy import distinct
from app.models.event import Event
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.returns import Return
from app.schemas.analytics import *

QUALIFYING_ACTIVITY = {"homepage_view", "search", "product_view", "recommendation_click", "add_to_cart", "checkout_started", "purchase"}
STAGES = [("Homepage View", "homepage_view", {"homepage_view"}),
          ("Search / Discovery", "search", {"search", "recommendation_click"}),
          ("Product View", "product_view", {"product_view"}),
          ("Add to Cart", "add_to_cart", {"add_to_cart"}),
          ("Checkout Started", "checkout_started", {"checkout_started"}),
          ("Purchase", "purchase", {"purchase"})]

def pct(a, b):
    return round(100 * a / b, 2) if b else 0.0

def calculate_funnel(db, days=30):
    cutoff = datetime.utcnow() - timedelta(days=days)
    events = db.query(Event).filter(Event.occurred_at >= cutoff, Event.occurred_at <= datetime.utcnow()).order_by(Event.occurred_at, Event.id).all()
    progress = defaultdict(int)
    for e in events:
        idx = progress[e.session_id]
        if idx < len(STAGES) and e.event_type in STAGES[idx][2]:
            progress[e.session_id] += 1
    counts = [sum(n >= i + 1 for n in progress.values()) for i in range(6)]
    total = counts[0]
    prev = total
    steps = []
    for i, (name, key, _) in enumerate(STAGES):
        n = counts[i]
        steps.append(FunnelStep(step_name=name, stage_key=key, count=n,
                     conversion_from_prev=pct(n, prev), drop_off_count=prev-n,
                     drop_off_rate=pct(prev-n, prev), overall_conversion=pct(n, total)))
        prev = n
    biggest = max(steps[1:], key=lambda x: x.drop_off_rate).step_name if total else "No eligible sessions"
    return FunnelResponse(total_sessions=total, steps=steps, biggest_dropoff_stage=biggest,
         methodology="Ordered UTC events; unique sessions entering homepage, then discovery, product, cart, checkout and purchase. Duplicate milestones count once.")

def calculate_cohort_retention(db, now=None):
    now = now or datetime.utcnow()
    activity = defaultdict(list)
    for e in db.query(Event).filter(Event.customer_id.is_not(None), Event.occurred_at <= now, Event.event_type.in_(QUALIFYING_ACTIVITY)).all():
        activity[e.customer_id].append(e.occurred_at)
    cohorts = defaultdict(list)
    for customer, times in activity.items():
        first = min(times)
        start = first.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=first.weekday())
        cohorts[start].append(customer)
    rows = []
    for start, members in sorted(cohorts.items()):
        weeks = []
        for w in range(5):
            left, right = start + timedelta(weeks=w), start + timedelta(weeks=w+1)
            active = sum(any(left <= t < right for t in activity[c]) for c in members)
            observed = right <= now
            weeks.append(CohortRetentionWeek(week_index=w, active_customers=active,
                retention_rate=pct(active, len(members)) if observed else None, observed=observed))
        rows.append(CohortRow(cohort_week=start.date().isoformat(), cohort_size=len(members), weeks=weeks))
    return CohortResponse(cohorts=rows, period="UTC acquisition weeks; incomplete weeks shown as pending")

def eligible_orders(db, days=None, customer_id=None):
    q = db.query(Order).filter(Order.status == "COMPLETED")
    if days is not None: q = q.filter(Order.created_at >= datetime.utcnow()-timedelta(days=days), Order.created_at <= datetime.utcnow())
    if customer_id is not None: q = q.filter(Order.customer_id == customer_id)
    return q.all()

def calculate_overview_metrics(db, days=30):
    orders = eligible_orders(db, days)
    events = db.query(Event).filter(Event.occurred_at >= datetime.utcnow()-timedelta(days=days), Event.occurred_at <= datetime.utcnow()).all()
    sessions = {e.session_id for e in events}
    visitors = {e.customer_id for e in events if e.customer_id is not None}
    carts = {e.session_id for e in events if e.event_type == "add_to_cart"}
    purchases = {o.session_id for o in orders if o.session_id}
    rev = sum((o.total_amount for o in orders), Decimal("0"))
    order_ids = {o.id for o in orders}
    returned = {r.order_id for r in db.query(Return).all() if r.order_id in order_ids}
    counts = defaultdict(int)
    for o in orders: counts[o.customer_id] += 1
    return OverviewMetricsResponse(total_revenue=float(rev), average_order_value=float(rev/len(orders)) if orders else 0,
        total_sessions=len(sessions), unique_visitors=len(visitors), total_orders=len(orders),
        conversion_rate=pct(len(purchases & sessions), len(sessions)),
        cart_abandonment_rate=pct(len(carts-purchases), len(carts)),
        return_rate=pct(len(returned), len(orders)), repeat_customer_rate=pct(sum(n>1 for n in counts.values()), len(counts)),
        total_products_active=db.query(Product).filter(Product.active.is_(True)).count())

def calculate_north_star(db):
    sessions = lambda t: db.query(distinct(Event.session_id)).filter(Event.event_type == t).count()
    purchases = len({o.session_id for o in eligible_orders(db) if o.session_id})
    return NorthStarResponse(north_star_value=purchases,
        supporting_metrics={"discovery_engagement_sessions":sessions("search"), "product_relevance_view_sessions":sessions("product_view"),
           "cart_addition_sessions":sessions("add_to_cart"), "checkout_initiation_sessions":sessions("checkout_started"),
           "purchase_to_cart_ratio":pct(purchases, sessions("add_to_cart"))},
        metric_tree_description="Unique completed-order sessions, gross revenue before return refunds. Supporting metrics are unique event sessions.")

def get_product_performance(db, limit=50, days=30, customer_id=None):
    orders = {o.id:o for o in eligible_orders(db, days, customer_id)}
    result = []
    for p in db.query(Product).all():
        q = db.query(Event).filter(Event.product_id==p.id, Event.occurred_at >= datetime.utcnow()-timedelta(days=days), Event.occurred_at <= datetime.utcnow())
        if customer_id is not None: q=q.filter(Event.customer_id==customer_id)
        ev=q.all()
        views={e.session_id for e in ev if e.event_type=="product_view"}
        adds={e.session_id for e in ev if e.event_type=="add_to_cart"}
        impressions={e.session_id for e in ev if e.event_type=="recommendation_impression"}
        clicks={e.session_id for e in ev if e.event_type=="recommendation_click"}
        items=[i for i in db.query(OrderItem).filter(OrderItem.product_id==p.id).all() if i.order_id in orders]
        purchased_orders={i.order_id for i in items}
        purchase_sessions={orders[i.order_id].session_id for i in items}
        returned={r.order_id for r in db.query(Return).filter(Return.product_id==p.id).all() if r.order_id in purchased_orders}
        result.append(ProductPerformanceItem(product_id=p.id, name=p.name, category=p.category, views=len(views), adds_to_cart=len(adds),
            purchases=sum(i.quantity for i in items), conversion_rate=pct(len(purchase_sessions & views),len(views)),
            revenue=float(sum((i.unit_price*i.quantity for i in items),Decimal("0"))), return_count=len(returned),
            return_rate=pct(len(returned),len(purchased_orders)), ctr=pct(len(clicks & impressions),len(impressions)) if impressions else None))
    return sorted(result,key=lambda p:p.revenue,reverse=True)[:limit]
