from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime
from datetime import datetime
from app.db.session import Base

class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    enabled = Column(Boolean, default=False)
    rollout_percentage = Column(Float, default=100.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
