from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from datetime import datetime
from app.db.session import Base

class Release(Base):
    __tablename__ = "releases"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(50), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    target_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="IN_PREPARATION") # IN_PREPARATION, READY_FOR_DEPLOY, DEPLOYED
    readiness_percentage = Column(Integer, default=0)
    # Checklists storing items like {"engineering": true, "design": true, "qa": false, ...}
    checklist = Column(JSON, default=dict)
    release_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
