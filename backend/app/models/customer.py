from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    display_name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=True)
    preferred_categories = Column(JSON, default=list) # e.g. ["Shirts", "Sneakers"]
    preferred_colours = Column(JSON, default=list) # e.g. ["Black", "Navy", "Olive"]
    preferred_brands = Column(JSON, default=list) # e.g. ["UrbanKnit", "Aura Denim"]
    budget_min = Column(Float, default=500.0)
    budget_max = Column(Float, default=5000.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")
