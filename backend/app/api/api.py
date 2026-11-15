from fastapi import APIRouter, Depends
from app.services.security import require
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
api_router.include_router(analytics.router, dependencies=[Depends(require("analytics.read"))])
api_router.include_router(segments.router, dependencies=[Depends(require("segments.read"))])
api_router.include_router(experiments.router, dependencies=[Depends(require("experiments.manage"))])
api_router.include_router(feature_flags.router, dependencies=[Depends(require("feature_flags.manage"))])
api_router.include_router(inventory.router, dependencies=[Depends(require("inventory.read"))])
api_router.include_router(returns.router, dependencies=[Depends(require("returns.read"))])
api_router.include_router(catalogue.router, dependencies=[Depends(require("catalogue.manage"))])
api_router.include_router(pricing.router, dependencies=[Depends(require("pricing.simulate"))])
api_router.include_router(roadmap.router, dependencies=[Depends(require("roadmap.manage"))])
api_router.include_router(releases.router, dependencies=[Depends(require("releases.read"))])
api_router.include_router(feedback.router, dependencies=[Depends(require("feedback.manage"))])
from app.api.routes import wishlist
api_router.include_router(wishlist.router)

from app.api.routes import auth, accounts, admin
api_router.include_router(auth.router)
api_router.include_router(accounts.router)
api_router.include_router(admin.router)
