from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Index
from datetime import datetime
from app.db.session import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    session_id = Column(String(100), index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    event_type = Column(String(50), index=True, nullable=False)
    event_metadata = Column("metadata", JSON, default=dict)
    experiment_id = Column(Integer, nullable=True, index=True)
    variant = Column(String(20), nullable=True) # control vs treatment
    occurred_at = Column(DateTime, default=datetime.utcnow, index=True)

Index("idx_events_session_type", Event.session_id, Event.event_type)
Index("idx_events_customer_type", Event.customer_id, Event.event_type)
