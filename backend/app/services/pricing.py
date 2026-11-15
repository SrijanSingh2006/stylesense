from sqlalchemy.orm import Session
from app.models.product import Product
from app.schemas.operations import PromotionSimulateRequest, PromotionSimulateResponse

def simulate_promotion(db: Session, req: PromotionSimulateRequest) -> PromotionSimulateResponse:
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise ValueError(f"Product {req.product_id} not found")

    base_price = product.price
    base_units = max(40, (product.review_count or 10) * 4) # estimated baseline monthly units
    base_cost = req.estimated_cost_per_unit if req.estimated_cost_per_unit is not None else (base_price * 0.42) # default 42% COGS
    base_revenue = base_units * base_price
    base_gross_profit = base_units * (base_price - base_cost)
    base_margin_pct = round((base_gross_profit / base_revenue) * 100.0, 1)

    discount_factor = 1.0 - (req.discount_percentage / 100.0)
    scenario_price = round(base_price * discount_factor, 2)

    # Elasticity formula: % delta Q = Elasticity * % delta P
    price_delta_pct = (scenario_price - base_price) / base_price # negative
    qty_delta_pct = req.price_elasticity * price_delta_pct # positive if elasticity is negative
    
    scenario_units = max(1, int(round(base_units * (1.0 + qty_delta_pct))))
    scenario_revenue = round(scenario_units * scenario_price, 2)
    scenario_gross_profit = round(scenario_units * (scenario_price - base_cost), 2)
    scenario_margin_pct = round((scenario_gross_profit / scenario_revenue) * 100.0, 1) if scenario_revenue > 0 else 0.0

    rev_delta = round(((scenario_revenue - base_revenue) / base_revenue) * 100.0, 1)
    profit_delta = round(((scenario_gross_profit - base_gross_profit) / base_gross_profit) * 100.0, 1) if base_gross_profit > 0 else 0.0

    return PromotionSimulateResponse(
        product_id=product.id,
        product_name=product.name,
        baseline_price=base_price,
        baseline_units_per_month=base_units,
        baseline_revenue=round(base_revenue, 2),
        baseline_gross_margin_pct=base_margin_pct,
        discount_percentage=req.discount_percentage,
        scenario_selling_price=scenario_price,
        scenario_estimated_units=scenario_units,
        scenario_projected_revenue=scenario_revenue,
        scenario_projected_gross_profit=scenario_gross_profit,
        scenario_gross_margin_pct=scenario_margin_pct,
        revenue_delta_pct=rev_delta,
        profit_delta_pct=profit_delta,
        elasticity_applied=req.price_elasticity,
        assumptions_notice="Estimated demand elasticity simulation. Results reflect modeled consumer sensitivity, not guaranteed sales."
    )
