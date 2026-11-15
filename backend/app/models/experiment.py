from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Index
from datetime import datetime
from app.db.session import Base

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    hypothesis = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    primary_metric = Column(String(50), default="conversion_rate") # conversion_rate, ctr, aov
    status = Column(String(20), default="DRAFT", index=True) # DRAFT, RUNNING, CONCLUDED, PAUSED
    traffic_percentage = Column(Float, default=50.0) # e.g. 50% treatment
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ExperimentAssignment(Base):
    __tablename__ = "experiment_assignments"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    variant = Column(String(20), nullable=False) # control, treatment
    assigned_at = Column(DateTime, default=datetime.utcnow)

Index("idx_exp_cust_unique", ExperimentAssignment.experiment_id, ExperimentAssignment.customer_id, unique=True)
