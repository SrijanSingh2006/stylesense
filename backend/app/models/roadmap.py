from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from app.db.session import Base

class RoadmapTask(Base):
    __tablename__ = "roadmap_tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    owner = Column(String(100), default="Storefront PM")
    status = Column(String(50), default="BACKLOG", index=True) # BACKLOG, PLANNED, IN_PROGRESS, QA, COMPLETED
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    reach = Column(Float, default=1000.0) # Estimated users reached / quarter
    impact = Column(Float, default=2.0) # 0.25 (minimal) to 3 (massive)
    confidence = Column(Float, default=80.0) # percentage 50% - 100%
    effort = Column(Float, default=4.0) # person-weeks
    rice_score = Column(Float, default=0.0, index=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
