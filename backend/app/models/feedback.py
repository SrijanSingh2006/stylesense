from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from datetime import datetime
from app.db.session import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    feedback_type = Column(String(50), default="FIT_ISSUE") # FIT_ISSUE, QUALITY, RECOMMENDATION, GENERAL
    rating = Column(Float, default=4.0)
    comment = Column(Text, nullable=True)
    source = Column(String(50), default="Storefront Review") # Storefront Review, Customer Support, Internal Tester
    owner = Column(String(100), default="Storefront PM")
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, URGENT
    sentiment = Column(String(20), default="NEUTRAL") # POSITIVE, NEUTRAL, NEGATIVE
    status = Column(String(20), default="NEW") # NEW, REVIEWED, CONVERTED_TO_ROADMAP, CLOSED
    created_at = Column(DateTime, default=datetime.utcnow)
