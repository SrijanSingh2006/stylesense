from decimal import Decimal
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import update
from app.models.account import (
    UserAddress,
    UserPreference,
    UserWishlist,
    UserWishlistItem,
    Cart,
    CartItem,
    Notification,
    utcnow,
)
from app.models.product import Product
from app.models.order import Order
from app.schemas.product import ProductResponse
from app.services.security import own_customer, record_audit, notify


def validate(cls, values):
    try:
        return cls.model_validate(values)
    except ValidationError as error:
        raise HTTPException(
            422,
            [
                {"loc": ["body", *e["loc"]], "msg": e["msg"], "type": e["type"]}
                for e in error.errors()
            ],
        )


def public_row(record, fields):
    return {key: getattr(record, key) for key in fields}


ADDRESS_FIELDS = [
    "id",
    "full_name",
    "phone",
    "address_line_1",
    "address_line_2",
    "city",
    "state",
    "postal_code",
    "country",
    "address_type",
    "is_default",
]
PREFERENCE_FIELDS = [
    "preferred_categories",
    "preferred_brands",
    "preferred_colours",
    "budget_min",
    "budget_max",
    "preferred_fit",
    "onboarding_completed",
]


def address_view(address):
    return public_row(address, ADDRESS_FIELDS)


def preferences_view(preferences):
    result = public_row(preferences, PREFERENCE_FIELDS)
    result["budget_min"] = float(result["budget_min"])
    result["budget_max"] = float(result["budget_max"])
    return result


def owned_address(db, user, address_id):
    address = db.query(UserAddress).filter_by(id=address_id, user_id=user.id).first()
    if not address:
        raise HTTPException(404, "Address not found")
    return address


def cart_for(db, user):
    cart = db.query(Cart).filter_by(user_id=user.id).first()
    if not cart:
        raise HTTPException(409, "Account cart is not initialized")
    return cart


def cart_view(db, user):
    cart = cart_for(db, user)
    items = []
    total = Decimal("0")
    for item in (
        db.query(CartItem).filter_by(cart_id=cart.id).order_by(CartItem.id).all()
    ):
        product = db.get(Product, item.product_id)
        if not product:
            continue
        price = Decimal(str(product.price)).quantize(Decimal(".01"))
        total += price * item.quantity
        items.append(
            {
                "id": item.id,
                "product": ProductResponse.model_validate(product).model_dump(),
                "quantity": item.quantity,
                "selected_size": item.selected_size,
                "available": bool(
                    product.active
                    and product.stock_quantity >= item.quantity
                    and item.selected_size in (product.sizes_available or [])
                ),
            }
        )
    return {
        "items": items,
        "subtotal": float(total),
        "shipping": 0,
        "total": float(total),
        "payment_mode": "simulated",
    }


def validate_cart_product(db, product_id, size, quantity):
    if not isinstance(quantity, int) or not 1 <= quantity <= 10000:
        raise HTTPException(422, "Cart quantity must be an integer between 1 and 10000")
    product = db.get(Product, product_id)
    if not product or not product.active:
        raise HTTPException(404, "Product not available")
    if size not in (product.sizes_available or []):
        raise HTTPException(422, "Invalid size selection")
    if product.stock_quantity < quantity:
        raise HTTPException(409, "Requested quantity exceeds current stock")
    from app.services.checkout import money

    money(product.price)
    return product


def wishlist_for(db, user):
    wishlist = db.query(UserWishlist).filter_by(user_id=user.id).first()
    if not wishlist:
        raise HTTPException(409, "Account wishlist is not initialized")
    return wishlist


def wishlist_products(db, user):
    wishlist = wishlist_for(db, user)
    return (
        db.query(Product)
        .join(UserWishlistItem, UserWishlistItem.product_id == Product.id)
        .filter(UserWishlistItem.wishlist_id == wishlist.id)
        .order_by(UserWishlistItem.id)
        .all()
    )


def order_view(order):
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "session_id": order.session_id,
        "total_amount": float(order.total_amount),
        "status": order.status,
        "created_at": order.created_at,
        "payment_method": order.payment_method,
        "address": order.address_snapshot,
        "items": [
            {
                "product_id": i.product_id,
                "name": i.product.name if i.product else "Unavailable product",
                "quantity": i.quantity,
                "unit_price": float(i.unit_price),
                "selected_size": i.selected_size,
            }
            for i in order.items
        ],
    }
