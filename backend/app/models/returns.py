from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from app.db.session import Base

class Return(Base):
    __tablename__ = "returns"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    return_reason = Column(String(150), nullable=False) # e.g. "Size too small", "Color mismatch", "Quality not as expected"
    condition = Column(String(50), default="UNWORN") # UNWORN, DAMAGED, OPENED
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
