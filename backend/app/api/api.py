from fastapi import APIRouter
from app.api.routes import (
    health,
    products,
    search,
    recommendations,
    size,
    shopping,
    events,
    analytics,
    segments,
    experiments,
    feature_flags,
    inventory,
    returns,
    catalogue,
    pricing,
    roadmap,
    releases,
    feedback,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(products.router)
api_router.include_router(search.router)
api_router.include_router(recommendations.router)
api_router.include_router(size.router)
api_router.include_router(shopping.router)
api_router.include_router(events.router)
api_router.include_router(analytics.router)
api_router.include_router(segments.router)
api_router.include_router(experiments.router)
api_router.include_router(feature_flags.router)
api_router.include_router(inventory.router)
api_router.include_router(returns.router)
api_router.include_router(catalogue.router)
api_router.include_router(pricing.router)
api_router.include_router(roadmap.router)
api_router.include_router(releases.router)
api_router.include_router(feedback.router)
from app.api.routes import wishlist
api_router.include_router(wishlist.router)
