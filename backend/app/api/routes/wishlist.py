from fastapi import APIRouter, Depends
from app.db.session import get_db
from app.schemas.product import ProductResponse
from app.services.security import require, own_customer
from app.api.routes.accounts import wishlist, save_wishlist, remove_wishlist

router = APIRouter()


@router.get(
    "/wishlist/{customer_id}", response_model=list[ProductResponse], tags=["Wishlist"]
)
def list_wishlist(
    customer_id: int, user=Depends(require("wishlist.manage")), db=Depends(get_db)
):
    own_customer(user, customer_id)
    return wishlist(user, db)


@router.put("/wishlist/{customer_id}/{product_id}", tags=["Wishlist"])
def add_wishlist(
    customer_id: int,
    product_id: int,
    user=Depends(require("wishlist.manage")),
    db=Depends(get_db),
):
    own_customer(user, customer_id)
    return save_wishlist(product_id, user, db)


@router.delete("/wishlist/{customer_id}/{product_id}", tags=["Wishlist"])
def delete_wishlist(
    customer_id: int,
    product_id: int,
    user=Depends(require("wishlist.manage")),
    db=Depends(get_db),
):
    own_customer(user, customer_id)
    return remove_wishlist(product_id, user, db)
