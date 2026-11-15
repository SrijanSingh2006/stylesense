import math
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.customer import Customer
from app.models.event import Event
from app.models.order import Order, OrderItem
from app.schemas.recommendations import RecommendationItem, RecommendationResponse, CompleteLookResponse
from app.schemas.product import ProductResponse

def get_recommendations_for_customer(
    db: Session,
    customer_id: Optional[int],
    limit: int = 10,
    category_filter: Optional[str] = None
) -> RecommendationResponse:
    """
    Hybrid recommendation engine combining customer preferences, browsing behaviour,
    ratings, and popularity, with cold-start fallback.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first() if customer_id else None
    
    query = db.query(Product).filter(Product.active == True, Product.stock_quantity > 0)
    if category_filter:
        query = query.filter(Product.category == category_filter)
    all_products = query.all()

    if not all_products:
        return RecommendationResponse(customer_id=customer_id, strategy="empty", items=[])

    if not customer:
        # Cold start fallback based on popularity and high ratings
        ranked = sorted(all_products, key=lambda p: (p.rating * math.log(p.review_count + 2)), reverse=True)
        items = []
        for p in ranked[:limit]:
            items.append(RecommendationItem(
                product=ProductResponse.from_orm(p),
                score=round(p.rating / 5.0, 3),
                explanation="Popular top-rated discovery across StyleSense shoppers."
            ))
        return RecommendationResponse(
            customer_id=None,
            strategy="cold_start_popular",
            items=items
        )

    # Customer is known: retrieve recent views and order history
    recent_view_events = db.query(Event).filter(
        Event.customer_id == customer.id,
        Event.event_type == "product_view"
    ).order_by(Event.occurred_at.desc()).limit(20).all()
    viewed_product_ids = {e.product_id for e in recent_view_events if e.product_id}

    purchased_items = db.query(OrderItem.product_id).join(Order).filter(
        Order.customer_id == customer.id
    ).all()
    purchased_product_ids = {item[0] for item in purchased_items}

    scored_items: List[Tuple[Product, float, str]] = []
    
    pref_categories = set(c.lower() for c in (customer.preferred_categories or []))
    pref_colours = set(c.lower() for c in (customer.preferred_colours or []))
    pref_brands = set(b.lower() for b in (customer.preferred_brands or []))
    b_min = customer.budget_min or 500.0
    b_max = customer.budget_max or 5000.0

    for p in all_products:
        score = 0.0
        explanations = []

        # Category affinity (weight: 0.30)
        if p.category and p.category.lower() in pref_categories:
            score += 0.30
            explanations.append(f"Matches your affinity for {p.category}")

        # Colour affinity (weight: 0.20)
        if p.colour and p.colour.lower() in pref_colours:
            score += 0.20
            explanations.append(f"In your favored {p.colour} palette")

        # Brand affinity (weight: 0.15)
        if p.brand and p.brand.lower() in pref_brands:
            score += 0.15
            explanations.append(f"From {p.brand}, one of your preferred labels")

        # Budget fit (weight: 0.15)
        if b_min <= p.price <= b_max:
            score += 0.15
            explanations.append("Within your usual shopping price range")

        # Rating quality booster (weight: 0.10)
        score += 0.10 * (p.rating / 5.0)

        # Browsing history relevance
        if p.id in viewed_product_ids:
            score += 0.10
            explanations.append("Frequently viewed in your recent sessions")

        # Penalize already purchased product to preserve discovery diversity
        if p.id in purchased_product_ids:
            score *= 0.6

        explanation_str = " · ".join(explanations[:2]) if explanations else "Handpicked based on trending fashion taste profile."
        scored_items.append((p, round(score, 3), explanation_str))

    # Sort by score descending
    scored_items.sort(key=lambda x: x[1], reverse=True)

    # Diversity filter: max 3 per category in top recommendations
    diverse_items: List[RecommendationItem] = []
    cat_counts: Dict[str, int] = {}

    for prod, score, exp in scored_items:
        c = prod.category or "General"
        if cat_counts.get(c, 0) < 3 or len(diverse_items) >= limit:
            diverse_items.append(RecommendationItem(
                product=ProductResponse.from_orm(prod),
                score=score,
                explanation=exp
            ))
            cat_counts[c] = cat_counts.get(c, 0) + 1
        if len(diverse_items) >= limit:
            break

    return RecommendationResponse(
        customer_id=customer.id,
        strategy="hybrid_affinity_diversity",
        items=diverse_items
    )


def get_complete_look(db: Session, primary_product_id: int) -> CompleteLookResponse:
    """
    Curates complementary outfit items across categories based on styling rules.
    """
    primary = db.query(Product).filter(Product.id == primary_product_id).first()
    if not primary:
        raise ValueError(f"Product {primary_product_id} not found")

    # Map current product category to compatible complementary categories
    category_map = {
        "Shirts": ["Trousers", "Footwear", "Accessories"],
        "T-Shirts": ["Jeans", "Footwear", "Jackets"],
        "Dresses": ["Footwear", "Handbags", "Jewellery"],
        "Jeans": ["Shirts", "Footwear", "Jackets"],
        "Trousers": ["Shirts", "Footwear", "Blazers"],
        "Footwear": ["Jeans", "Shirts", "Accessories"],
        "Jackets": ["T-Shirts", "Jeans", "Footwear"],
    }
    
    needed_categories = category_map.get(primary.category, ["Footwear", "Accessories", "Trousers"])

    outfit_items: List[Product] = []
    for comp_cat in needed_categories:
        # Find product in complementary category, preferably complementary colour
        candidate = db.query(Product).filter(
            Product.category == comp_cat,
            Product.id != primary.id,
            Product.active == True,
            Product.stock_quantity > 0
        ).order_by(Product.rating.desc()).first()

        if candidate:
            outfit_items.append(candidate)

    total_price = primary.price + sum(item.price for item in outfit_items)

    styling_notes = f"Styled around the {primary.name}. Complementary silhouette balances {primary.colour} tones with tailored versatile pairings."

    return CompleteLookResponse(
        primary_product=ProductResponse.from_orm(primary),
        outfit_items=[ProductResponse.from_orm(p) for p in outfit_items],
        total_outfit_price=round(total_price, 2),
        styling_notes=styling_notes
    )
