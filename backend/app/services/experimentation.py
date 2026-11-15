import hashlib
import math
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.experiment import Experiment, ExperimentAssignment
from app.models.event import Event
from app.models.order import Order
from app.schemas.experiments import ExperimentResultsResponse, VariantMetrics

def normal_cdf(x: float) -> float:
    """Cumulative distribution function for standard normal distribution using math.erf"""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

def assign_customer_variant(db: Session, experiment_id: int, customer_id: int) -> str:
    """
    Deterministic customer assignment to experiment variant.
    Same customer always receives the same variant for the experiment.
    """
    existing = db.query(ExperimentAssignment).filter(
        ExperimentAssignment.experiment_id == experiment_id,
        ExperimentAssignment.customer_id == customer_id
    ).first()
    if existing:
        return existing.variant

    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    from datetime import datetime
    from fastapi import HTTPException
    from app.models.customer import Customer
    from sqlalchemy.exc import IntegrityError
    if not exp or not db.get(Customer, customer_id):
        raise HTTPException(404, "Experiment or customer not found")
    if exp.status != "RUNNING" or (exp.end_date and exp.end_date <= datetime.utcnow()) or (exp.start_date and exp.start_date > datetime.utcnow()):
        raise HTTPException(409, "Experiment is not accepting new assignments")
    traffic_pct = exp.traffic_percentage if exp else 50.0

    # Deterministic hash using SHA-256
    hash_key = f"exp_{experiment_id}:cust_{customer_id}"
    digest = hashlib.sha256(hash_key.encode('utf-8')).hexdigest()
    bucket = int(digest[:8], 16) % 100

    variant = "treatment" if bucket < traffic_pct else "control"

    assignment = ExperimentAssignment(
        experiment_id=experiment_id,
        customer_id=customer_id,
        variant=variant
    )
    db.add(assignment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return db.query(ExperimentAssignment).filter_by(experiment_id=experiment_id, customer_id=customer_id).one().variant
    db.refresh(assignment)

    return variant

def calculate_experiment_results(db: Session, experiment_id: int) -> ExperimentResultsResponse:
    from datetime import datetime, timedelta
    from scipy.stats import fisher_exact
    exp = db.get(Experiment, experiment_id)
    if not exp:
        raise ValueError("Experiment not found")
    now = datetime.utcnow()
    start = exp.start_date or now
    end = min(exp.end_date or now, now)
    assignments = db.query(ExperimentAssignment).filter_by(experiment_id=experiment_id).all()
    exposures = db.query(Event).filter(Event.experiment_id == experiment_id, Event.event_type == "experiment_exposure",
                                      Event.occurred_at >= start, Event.occurred_at <= end).all()
    metrics = []
    for variant in ("control", "treatment"):
        assigned = {a.customer_id:a for a in assignments if a.variant == variant}
        exposed = {}
        for e in exposures:
            a = assigned.get(e.customer_id)
            if a and e.variant == a.variant and e.occurred_at >= a.assigned_at:
                exposed[e.customer_id] = min(exposed.get(e.customer_id, e.occurred_at), e.occurred_at)
        orders = db.query(Order).filter(Order.status == "COMPLETED", Order.created_at >= start, Order.created_at <= end).all()
        eligible = [o for o in orders if o.customer_id in exposed and exposed[o.customer_id] <= o.created_at <= min(end, exposed[o.customer_id]+timedelta(days=7))]
        converters = {o.customer_id for o in eligible}
        n, x = len(exposed), len(converters)
        metrics.append(VariantMetrics(variant=variant, sample_size=n, assigned_users=len(assigned), exposed_users=n,
             conversions=x, conversion_rate=round(100*x/n, 2) if n else 0.0,
             average_order_value=round(float(sum(o.total_amount for o in eligible))/len(eligible),2) if eligible else 0.0))
    control, treatment = metrics
    n1, n2, x1, x2 = control.sample_size, treatment.sample_size, control.conversions, treatment.conversions
    p1, p2 = x1/n1 if n1 else 0, x2/n2 if n2 else 0
    diff = p2-p1
    adequate = bool(n1 and n2 and min(x1,n1-x1,x2,n2-x2)>=5)
    pvalue, z, ci, test = 1.0, 0.0, [-1.0, 1.0], "Insufficient observations"
    if n1 and n2:
        pooled = (x1+x2)/(n1+n2)
        se = math.sqrt(pooled*(1-pooled)*(1/n1+1/n2))
        z = diff/se if se else 0.0
        if adequate:
            pvalue = math.erfc(abs(z)/math.sqrt(2))
            test = "Two-Proportion Z-Test (Pooled Variance)"
        else:
            pvalue = float(fisher_exact([[x1,n1-x1],[x2,n2-x2]]).pvalue)
            test = "Fisher exact test (small samples)"
        def wilson(x,n):
            p=x/n; d=1+1.96**2/n
            center=(p+1.96**2/(2*n))/d
            half=1.96*math.sqrt(p*(1-p)/n+1.96**2/(4*n*n))/d
            return center-half, center+half
        l1,u1=wilson(x1,n1);l2,u2=wilson(x2,n2)
        ci=[max(-1,diff-math.sqrt((p2-l2)**2+(u1-p1)**2)),min(1,diff+math.sqrt((u2-p2)**2+(p1-l1)**2))]
    supported = exp.primary_metric == "conversion_rate"
    significant = bool(n1 and n2 and pvalue < .05 and supported)
    if not supported:
        decision="Purchase conversion shown as a diagnostic; selected primary metric is not supported for a launch decision."
    elif not n1 or not n2:
        decision="Insufficient evidence: record actual exposures in both variants."
    elif significant:
        decision="Observed significant conversion difference. Review guardrails and planned sample size before rollout."
    else:
        decision="Inconclusive: continue collection according to the prespecified experiment plan."
    return ExperimentResultsResponse(experiment_id=exp.id,name=exp.name,status=exp.status,primary_metric=exp.primary_metric,
          control=control,treatment=treatment,absolute_difference=round(diff,6),relative_lift_pct=round(diff/p1*100,2) if p1 else 0.0,
          relative_lift_available=bool(p1),p_value=pvalue,z_score=round(z,6),confidence_interval_95=ci,
          is_statistically_significant=significant,statistical_test=test,sample_size_adequate=adequate,decision_recommendation=decision,
          attribution="First valid exposure, then completed order within 7 days and experiment UTC start/end. Unique customers; no imputation.")
