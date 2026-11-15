from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.session import get_db
from app.models.wishlist import WishlistEntry
from app.models.customer import Customer
from app.models.product import Product
from app.schemas.product import ProductResponse

router = APIRouter()

def customer_exists(db, customer_id):
    if not db.get(Customer, customer_id):
        raise HTTPException(404, "Customer not found")

@router.get("/wishlist/{customer_id}", response_model=list[ProductResponse], tags=["Wishlist"])
def list_wishlist(customer_id: int, db: Session = Depends(get_db)):
    customer_exists(db, customer_id)
    return db.query(Product).join(WishlistEntry, WishlistEntry.product_id == Product.id).filter(
        WishlistEntry.customer_id == customer_id).order_by(WishlistEntry.id).all()

@router.put("/wishlist/{customer_id}/{product_id}", tags=["Wishlist"])
def add_wishlist(customer_id: int, product_id: int, db: Session = Depends(get_db)):
    customer_exists(db, customer_id)
    if not db.get(Product, product_id):
        raise HTTPException(404, "Product not found")
    existing = db.query(WishlistEntry).filter_by(customer_id=customer_id, product_id=product_id).first()
    if not existing:
        db.add(WishlistEntry(customer_id=customer_id, product_id=product_id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            if not db.query(WishlistEntry).filter_by(customer_id=customer_id, product_id=product_id).first():
                raise
    return {"status": "saved"}

@router.delete("/wishlist/{customer_id}/{product_id}", tags=["Wishlist"])
def remove_wishlist(customer_id: int, product_id: int, db: Session = Depends(get_db)):
    customer_exists(db, customer_id)
    db.query(WishlistEntry).filter_by(customer_id=customer_id, product_id=product_id).delete()
    db.commit()
    return {"status": "removed"}
