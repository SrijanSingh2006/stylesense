from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.catalogue import CatalogueIssue
from app.schemas.operations import CatalogueQualityResponse, CatalogueIssueResponse

def audit_catalogue(db: Session) -> CatalogueQualityResponse:
    products = db.query(Product).all()
    existing_issues = db.query(CatalogueIssue).filter(CatalogueIssue.is_resolved == False).all()

    # If issues table is empty, run audit and populate
    if not existing_issues:
        seen_skus = set()
        for p in products:
            if not p.description or len(p.description.strip()) < 15:
                db.add(CatalogueIssue(
                    product_id=p.id,
                    issue_type="MISSING_DESCRIPTION",
                    severity="MEDIUM",
                    description=f"SKU {p.sku} has an incomplete or missing product description.",
                    suggested_action="Enrich attribute summary and fabric care details."
                ))
            if not p.image_url or "placeholder" in p.image_url.lower():
                db.add(CatalogueIssue(
                    product_id=p.id,
                    issue_type="MISSING_IMAGE",
                    severity="HIGH",
                    description=f"SKU {p.sku} lacks high-resolution lifestyle imagery.",
                    suggested_action="Upload editorial catalog shots."
                ))
            if not p.size_chart or len(p.size_chart) == 0:
                db.add(CatalogueIssue(
                    product_id=p.id,
                    issue_type="MISSING_SIZE_CHART",
                    severity="HIGH",
                    description=f"SKU {p.sku} does not have an attached structured size chart.",
                    suggested_action="Attach standard chest/waist sizing matrix."
                ))
            if p.price <= 0 or (p.original_price and p.original_price < p.price):
                db.add(CatalogueIssue(
                    product_id=p.id,
                    issue_type="INVALID_PRICING",
                    severity="CRITICAL",
                    description=f"SKU {p.sku} has invalid price or original price lower than sale price.",
                    suggested_action="Correct listing MSRP and selling price."
                ))
            if p.sku in seen_skus:
                db.add(CatalogueIssue(
                    product_id=p.id,
                    issue_type="DUPLICATE_SKU",
                    severity="CRITICAL",
                    description=f"SKU {p.sku} appears more than once across catalogue entries.",
                    suggested_action="Consolidate duplicate SKU records."
                ))
            seen_skus.add(p.sku)
        
        db.commit()
        existing_issues = db.query(CatalogueIssue).filter(CatalogueIssue.is_resolved == False).all()

    total_prods = len(products)
    critical_cnt = sum(1 for i in existing_issues if i.severity == "CRITICAL")
    warning_cnt = sum(1 for i in existing_issues if i.severity in ["HIGH", "MEDIUM"])

    penalty = (critical_cnt * 5) + (warning_cnt * 1.5)
    health_score = max(0.0, round(100.0 - penalty, 1))

    by_type: Dict[str, int] = {}
    for i in existing_issues:
        by_type[i.issue_type] = by_type.get(i.issue_type, 0) + 1

    issue_responses = []
    for issue in existing_issues:
        prod = db.query(Product).filter(Product.id == issue.product_id).first()
        issue_responses.append(CatalogueIssueResponse(
            id=issue.id,
            product_id=issue.product_id,
            product_name=prod.name if prod else f"Product #{issue.product_id}",
            issue_type=issue.issue_type,
            severity=issue.severity,
            description=issue.description,
            suggested_action=issue.suggested_action,
            is_resolved=issue.is_resolved,
            created_at=issue.created_at
        ))

    return CatalogueQualityResponse(
        total_products_checked=total_prods,
        catalogue_health_score=health_score,
        critical_issues_count=critical_cnt,
        warning_issues_count=warning_cnt,
        issues_by_type=by_type,
        issues=issue_responses
    )

def resolve_issue(db: Session, issue_id: int) -> CatalogueIssue:
    issue = db.query(CatalogueIssue).filter(CatalogueIssue.id == issue_id).first()
    if not issue:
        raise ValueError(f"Issue {issue_id} not found")
    issue.is_resolved = True
    issue.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(issue)
    return issue
