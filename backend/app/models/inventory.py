from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    movement_type = Column(String(50), nullable=False) # PURCHASE, RESTOCK, RETURN, ADJUSTMENT
    quantity = Column(Integer, nullable=False) # positive for inbound, negative for outbound
    reference = Column(String(100), nullable=True) # order_id or supplier PO
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    product = relationship("Product", back_populates="movements")
