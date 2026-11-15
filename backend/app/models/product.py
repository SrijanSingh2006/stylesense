from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("stock_quantity >= 0", name="ck_product_stock_nonnegative"),
        CheckConstraint("price >= 0", name="ck_product_price_nonnegative"),
    )

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), index=True, nullable=False)
    brand = Column(String(100), index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    subcategory = Column(String(100), index=True, nullable=True)
    description = Column(Text, nullable=True)
    colour = Column(String(50), index=True, nullable=False)
    dominant_colour = Column(String(50), nullable=True)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)
    sizes_available = Column(JSON, default=list) # e.g. ["S", "M", "L", "XL"]
    size_chart = Column(JSON, default=dict) # e.g. {"S": {"chest": 38, "waist": 30}, ...}
    fit_type = Column(String(50), default="Regular") # Slim, Regular, Relaxed, Oversized
    material = Column(String(100), default="Cotton")
    occasion = Column(String(100), default="Casual") # Casual, Formal, Party, Sports
    tags = Column(JSON, default=list) # e.g. ["breathable", "sustainable", "trending"]
    rating = Column(Float, default=4.2)
    review_count = Column(Integer, default=0)
    stock_quantity = Column(Integer, default=50)
    reorder_point = Column(Integer, default=15)
    image_url = Column(String(500), nullable=True)
    active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    movements = relationship("InventoryMovement", back_populates="product", cascade="all, delete-orphan")
