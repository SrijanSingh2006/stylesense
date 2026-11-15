import io, os, uuid, warnings
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from PIL import Image
from app.core.config import settings
from app.db.session import get_db
from app.models.account import (
    User,
    UserAddress,
    UserPreference,
    CartItem,
    CartMergeReceipt,
    UserWishlistItem,
    Notification,
    utcnow,
)
from app.models.order import Order
from app.models.product import Product
from app.models.inventory import InventoryMovement
from app.schemas.account import (
    ProfileUpdate,
    AddressInput,
    AddressPatch,
    PreferenceInput,
    PreferencePatch,
    CartItemInput,
    CartQuantity,
    CartMerge,
    CheckoutInput,
)
from app.schemas.shopping import OrderCreateRequest
from app.schemas.product import ProductResponse
from app.services.security import (
    current_user,
    require,
    user_view,
    record_audit,
    notify,
    own_customer,
)
from app.services.accounts import (
    validate,
    address_view,
    preferences_view,
    owned_address,
    cart_for,
    cart_view,
    validate_cart_product,
    wishlist_for,
    wishlist_products,
    order_view,
    ADDRESS_FIELDS,
    PREFERENCE_FIELDS,
)

router = APIRouter(
    prefix="/users/me", tags=["My account"], dependencies=[Depends(current_user)]
)


@router.get("")
def profile(user=Depends(current_user)):
    return user_view(user)


@router.patch("")
def update_profile(data: ProfileUpdate, user=Depends(current_user), db=Depends(get_db)):
    if not data.full_name.strip():
        raise HTTPException(422, "Full name is required")
    user.full_name = data.full_name.strip()
    user.phone = data.phone
    if user.customer:
        user.customer.display_name = user.full_name
    record_audit(db, user, "account.profile_updated")
    db.commit()
    return user_view(user)


@router.post("/avatar")
async def avatar(
    file: UploadFile = File(...), user=Depends(current_user), db=Depends(get_db)
):
    content = await file.read(2 * 1024 * 1024 + 1)
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(422, "Avatar must be at most 2 MB")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            image = Image.open(io.BytesIO(content))
            if (
                image.format not in {"JPEG", "PNG", "WEBP"}
                or image.width * image.height > 16000000
            ):
                raise ValueError("Invalid avatar image")
            image.load()
            image = image.convert("RGB")
            image.thumbnail((512, 512))
            directory = os.path.join(settings.UPLOAD_DIR, "avatars")
            os.makedirs(directory, exist_ok=True)
            name = uuid.uuid4().hex + ".png"
            image.save(os.path.join(directory, name), "PNG")
    except Exception:
        raise HTTPException(422, "Upload a valid JPG, PNG or WEBP avatar")
    user.avatar_url = "/uploads/avatars/" + name
    record_audit(db, user, "account.avatar_updated")
    db.commit()
    return user_view(user)


@router.get("/addresses")
def addresses(user=Depends(require("addresses.manage")), db=Depends(get_db)):
    return [
        address_view(a)
        for a in db.query(UserAddress)
        .filter_by(user_id=user.id)
        .order_by(UserAddress.is_default.desc(), UserAddress.id)
        .all()
    ]


@router.post("/addresses", status_code=201)
def create_address(
    data: AddressInput, user=Depends(require("addresses.manage")), db=Depends(get_db)
):
    values = data.model_dump()
    first = not db.query(UserAddress).filter_by(user_id=user.id).first()
    values["is_default"] = data.is_default or first
    if values["is_default"]:
        db.query(UserAddress).filter_by(user_id=user.id, is_default=True).update(
            {"is_default": False}
        )
        db.flush()
    address = UserAddress(user_id=user.id, **values)
    db.add(address)
    db.flush()
    record_audit(
        db, user, "account.address_created", resource="address", resource_id=address.id
    )
    db.commit()
    return address_view(address)


@router.patch("/addresses/{address_id}")
def edit_address(
    address_id: int,
    data: AddressPatch,
    user=Depends(require("addresses.manage")),
    db=Depends(get_db),
):
    address = owned_address(db, user, address_id)
    values = {k: v for k, v in address_view(address).items() if k != "id"}
    values.update(data.model_dump(exclude_unset=True))
    valid = validate(AddressInput, values)
    if valid.is_default:
        db.query(UserAddress).filter_by(user_id=user.id, is_default=True).update(
            {"is_default": False}
        )
        db.flush()
    elif address.is_default and not valid.is_default:
        other = (
            db.query(UserAddress)
            .filter(UserAddress.user_id == user.id, UserAddress.id != address.id)
            .first()
        )
        if other:
            address.is_default = False
            db.flush()
            other.is_default = True
        else:
            valid.is_default = True
    for key, value in valid.model_dump().items():
        setattr(address, key, value)
    record_audit(
        db, user, "account.address_updated", resource="address", resource_id=address.id
    )
    db.commit()
    return address_view(address)


@router.delete("/addresses/{address_id}")
def delete_address(
    address_id: int, user=Depends(require("addresses.manage")), db=Depends(get_db)
):
    address = owned_address(db, user, address_id)
    was_default = address.is_default
    db.delete(address)
    db.flush()
    if was_default:
        other = (
            db.query(UserAddress)
            .filter_by(user_id=user.id)
            .order_by(UserAddress.id)
            .first()
        )
        if other:
            other.is_default = True
    record_audit(
        db, user, "account.address_deleted", resource="address", resource_id=address_id
    )
    db.commit()
    return {"message": "Address deleted"}


@router.get("/preferences")
def preferences(user=Depends(require("preferences.manage")), db=Depends(get_db)):
    return preferences_view(db.query(UserPreference).filter_by(user_id=user.id).one())


@router.patch("/preferences")
def update_preferences(
    data: PreferencePatch,
    user=Depends(require("preferences.manage")),
    db=Depends(get_db),
):
    preferences = db.query(UserPreference).filter_by(user_id=user.id).one()
    values = preferences_view(preferences)
    values.update(data.model_dump(exclude_unset=True))
    valid = validate(PreferenceInput, values)
    for key, value in valid.model_dump().items():
        setattr(preferences, key, value)
    if user.customer:
        for key in [
            "preferred_categories",
            "preferred_brands",
            "preferred_colours",
            "budget_min",
            "budget_max",
        ]:
            setattr(user.customer, key, getattr(valid, key))
    record_audit(db, user, "account.preferences_updated")
    db.commit()
    return preferences_view(preferences)


@router.get("/wishlist", response_model=list[ProductResponse])
def wishlist(user=Depends(require("wishlist.manage")), db=Depends(get_db)):
    return wishlist_products(db, user)


@router.put("/wishlist/{product_id}")
def save_wishlist(
    product_id: int, user=Depends(require("wishlist.manage")), db=Depends(get_db)
):
    if not db.get(Product, product_id):
        raise HTTPException(404, "Product not found")
    wishlist = wishlist_for(db, user)
    if (
        not db.query(UserWishlistItem)
        .filter_by(wishlist_id=wishlist.id, product_id=product_id)
        .first()
    ):
        db.add(UserWishlistItem(wishlist_id=wishlist.id, product_id=product_id))
        notify(
            db,
            user.id,
            "Wishlist updated",
            "A product was saved to your wishlist.",
            "wishlist",
        )
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            if (
                not db.query(UserWishlistItem)
                .filter_by(wishlist_id=wishlist.id, product_id=product_id)
                .first()
            ):
                raise
    return {"message": "Product saved"}


@router.delete("/wishlist/{product_id}")
def remove_wishlist(
    product_id: int, user=Depends(require("wishlist.manage")), db=Depends(get_db)
):
    wishlist = wishlist_for(db, user)
    db.query(UserWishlistItem).filter_by(
        wishlist_id=wishlist.id, product_id=product_id
    ).delete()
    db.commit()
    return {"message": "Product removed"}


@router.get("/cart")
def cart(user=Depends(require("cart.manage")), db=Depends(get_db)):
    return cart_view(db, user)


@router.put("/cart/items")
def set_cart_item(
    data: CartItemInput, user=Depends(require("cart.manage")), db=Depends(get_db)
):
    validate_cart_product(db, data.product_id, data.selected_size, data.quantity)
    cart = cart_for(db, user)
    item = (
        db.query(CartItem)
        .filter_by(
            cart_id=cart.id,
            product_id=data.product_id,
            selected_size=data.selected_size,
        )
        .first()
    )
    if item:
        item.quantity = data.quantity
    else:
        if db.query(CartItem).filter_by(cart_id=cart.id).count() >= 100:
            raise HTTPException(422, "A bag supports at most 100 distinct items")
        db.add(CartItem(cart_id=cart.id, **data.model_dump()))
    db.commit()
    return cart_view(db, user)


@router.delete("/cart/items/{item_id}")
def delete_cart_item(
    item_id: int, user=Depends(require("cart.manage")), db=Depends(get_db)
):
    cart = cart_for(db, user)
    item = db.query(CartItem).filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        raise HTTPException(404, "Cart item not found")
    db.delete(item)
    db.commit()
    return cart_view(db, user)


@router.delete("/cart")
def clear_cart(user=Depends(require("cart.manage")), db=Depends(get_db)):
    cart = cart_for(db, user)
    db.query(CartItem).filter_by(cart_id=cart.id).delete()
    db.commit()
    return cart_view(db, user)


@router.post("/cart/merge")
def merge_cart(
    data: CartMerge, user=Depends(require("cart.manage")), db=Depends(get_db)
):
    existing = db.query(CartMergeReceipt).filter_by(merge_key=data.merge_key).first()
    if existing:
        if existing.user_id != user.id:
            raise HTTPException(409, "Cart merge key already used")
        return cart_view(db, user)
    try:
        db.add(CartMergeReceipt(user_id=user.id, merge_key=data.merge_key))
        db.flush()
        cart = cart_for(db, user)
        for entry in data.items:
            item = (
                db.query(CartItem)
                .filter_by(
                    cart_id=cart.id,
                    product_id=entry.product_id,
                    selected_size=entry.selected_size,
                )
                .first()
            )
            quantity = (item.quantity if item else 0) + entry.quantity
            validate_cart_product(db, entry.product_id, entry.selected_size, quantity)
            if item:
                item.quantity = quantity
            else:
                if db.query(CartItem).filter_by(cart_id=cart.id).count() >= 100:
                    raise HTTPException(
                        422, "A bag supports at most 100 distinct items"
                    )
                db.add(
                    CartItem(
                        cart_id=cart.id,
                        product_id=entry.product_id,
                        selected_size=entry.selected_size,
                        quantity=quantity,
                    )
                )
                db.flush()
        db.commit()
    except IntegrityError:
        db.rollback()
        receipt = (
            db.query(CartMergeReceipt)
            .filter_by(merge_key=data.merge_key, user_id=user.id)
            .first()
        )
        if not receipt:
            raise HTTPException(409, "Cart merge conflicts with stored data")
    except Exception:
        db.rollback()
        raise
    return cart_view(db, user)


@router.post("/checkout")
def checkout(
    data: CheckoutInput, user=Depends(require("cart.manage")), db=Depends(get_db)
):
    from app.services.checkout import place_order

    if not user.customer_id:
        raise HTTPException(403, "A customer profile is required")
    address = owned_address(db, user, data.address_id)
    # A replay must work even after the original purchase cleared the server cart.
    previous = db.query(Order).filter_by(idempotency_key=data.idempotency_key).first()
    if previous:
        if (
            previous.user_id != user.id
            or previous.address_snapshot != address_view(address)
            or previous.payment_method != data.payment_method
        ):
            raise HTTPException(409, "Checkout key belongs to different order details")
        return order_view(previous)
    cart = cart_for(db, user)
    items = db.query(CartItem).filter_by(cart_id=cart.id).all()
    request = (
        validate(
            OrderCreateRequest,
            {
                "address_id": data.address_id,
                "customer_id": user.customer_id,
                "session_id": data.session_id,
                "idempotency_key": data.idempotency_key,
                "items": [
                    {
                        "product_id": i.product_id,
                        "selected_size": i.selected_size,
                        "quantity": i.quantity,
                    }
                    for i in items
                ],
            },
        )
        if items
        else None
    )
    if request is None:
        raise HTTPException(400, "Your cart is empty")

    def after_order(order):
        from app.services.payments import get_payment_provider

        authorization = get_payment_provider().authorize(
            order.total_amount, data.payment_method, data.idempotency_key
        )
        if not authorization.approved:
            raise HTTPException(402, "Simulated payment authorization was not approved")
        db.query(CartItem).filter_by(cart_id=cart.id).delete()
        notify(
            db,
            user.id,
            "Order confirmed",
            f"Simulated order #{order.id} is confirmed. No real payment was collected.",
            "order",
        )
        record_audit(
            db, user, "commerce.order_created", resource="order", resource_id=order.id
        )

    order = place_order(
        db,
        request,
        user=user,
        address_snapshot=address_view(address),
        payment_method=data.payment_method,
        after_order=after_order,
    )
    return order_view(order)


@router.get("/orders")
def orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(require("orders.read_own")),
    db=Depends(get_db),
):
    query = db.query(Order).filter_by(user_id=user.id)
    return {
        "total": query.count(),
        "items": [
            order_view(o)
            for o in query.order_by(Order.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        ],
    }


@router.get("/orders/{order_id}")
def order_detail(
    order_id: int, user=Depends(require("orders.read_own")), db=Depends(get_db)
):
    order = db.query(Order).filter_by(id=order_id, user_id=user.id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    return order_view(order)


@router.post("/orders/{order_id}/cancel")
def cancel_order(
    order_id: int, user=Depends(require("orders.read_own")), db=Depends(get_db)
):
    order = (
        db.query(Order)
        .filter_by(id=order_id, user_id=user.id)
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status != "PENDING":
        raise HTTPException(409, "Only pending orders can be cancelled")
    changed = db.execute(
        update(Order)
        .where(
            Order.id == order.id, Order.user_id == user.id, Order.status == "PENDING"
        )
        .values(status="CANCELLED")
    )
    if changed.rowcount != 1:
        raise HTTPException(409, "Order status changed")
    if order.stock_reserved:
        for item in order.items:
            db.execute(
                update(Product)
                .where(Product.id == item.product_id)
                .values(stock_quantity=Product.stock_quantity + item.quantity)
            )
            db.add(
                InventoryMovement(
                    product_id=item.product_id,
                    movement_type="RETURN",
                    quantity=item.quantity,
                    reference=f"Cancelled order #{order.id}",
                )
            )
        order.stock_reserved = False
    notify(db, user.id, "Order cancelled", f"Order #{order.id} was cancelled.", "order")
    record_audit(
        db, user, "commerce.order_cancelled", resource="order", resource_id=order.id
    )
    db.commit()
    db.refresh(order)
    return order_view(order)


@router.get("/notifications")
def notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(current_user),
    db=Depends(get_db),
):
    query = db.query(Notification).filter_by(user_id=user.id)
    return {
        "total": query.count(),
        "unread_count": query.filter(Notification.read_at.is_(None)).count(),
        "items": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "notification_type": n.notification_type,
                "read_at": n.read_at,
                "created_at": n.created_at,
            }
            for n in query.order_by(Notification.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        ],
    }


@router.patch("/notifications/read-all")
def read_all(user=Depends(current_user), db=Depends(get_db)):
    db.query(Notification).filter_by(user_id=user.id, read_at=None).update(
        {"read_at": utcnow()}
    )
    db.commit()
    return {"message": "All notifications marked as read"}


@router.patch("/notifications/{notification_id}/read")
def read_notification(
    notification_id: int, user=Depends(current_user), db=Depends(get_db)
):
    notification = (
        db.query(Notification).filter_by(id=notification_id, user_id=user.id).first()
    )
    if not notification:
        raise HTTPException(404, "Notification not found")
    notification.read_at = notification.read_at or utcnow()
    db.commit()
    return {"message": "Notification marked as read"}


@router.get("/activity")
def activity(
    limit: int = Query(20, ge=1, le=100), user=Depends(current_user), db=Depends(get_db)
):
    from app.models.account import AuditLog

    return {
        "items": [
            {
                "id": a.id,
                "action": a.action,
                "resource_type": a.resource_type,
                "timestamp": a.timestamp,
            }
            for a in db.query(AuditLog)
            .filter_by(actor_user_id=user.id)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
            .all()
        ]
    }


@router.patch("/cart/items/{item_id}")
def update_cart_quantity(
    item_id: int,
    data: CartQuantity,
    user=Depends(require("cart.manage")),
    db=Depends(get_db),
):
    cart = cart_for(db, user)
    item = db.query(CartItem).filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        raise HTTPException(404, "Cart item not found")
    validate_cart_product(db, item.product_id, item.selected_size, data.quantity)
    item.quantity = data.quantity
    db.commit()
    return cart_view(db, user)
