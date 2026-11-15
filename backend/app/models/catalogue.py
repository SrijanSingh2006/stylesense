from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from datetime import datetime
from app.db.session import Base

class CatalogueIssue(Base):
    __tablename__ = "catalogue_issues"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    issue_type = Column(String(100), nullable=False) # MISSING_DESCRIPTION, MISSING_IMAGE, MISSING_SIZE_CHART, INVALID_PRICING, DUPLICATE_SKU
    severity = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    suggested_action = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
