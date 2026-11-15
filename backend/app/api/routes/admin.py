import secrets, logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import update
from app.db.session import get_db
from app.models.account import User, StaffInvitation, AuditLog, SystemSetting, utcnow
from app.models.customer import Customer
from app.schemas.account import (
    StatusUpdate,
    RoleUpdate,
    InvitationInput,
    SystemSettingsInput,
)
from app.services.security import (
    require,
    user_view,
    token_hash,
    record_audit,
    notify,
    revoke_sessions,
)
from app.services.mail import deliver
from app.core.auth_config import auth_settings

router = APIRouter(prefix="/admin", tags=["Administration"])


def admin_target(db, user_id, actor, mutating=True):
    if mutating:
        # Serialize privilege/status edits and re-check the actor after acquiring the lock.
        from sqlalchemy.dialects.sqlite import insert as sqlite_insert
        from sqlalchemy.dialects.postgresql import insert as pg_insert

        insert = pg_insert if db.bind.dialect.name == "postgresql" else sqlite_insert
        db.execute(
            insert(SystemSetting)
            .values(key="admin_privilege_lock", value=1, updated_at=utcnow())
            .on_conflict_do_nothing(index_elements=["key"])
        )
        db.execute(
            update(SystemSetting)
            .where(SystemSetting.key == "admin_privilege_lock")
            .values(value=1)
        )
        db.refresh(actor)
        if actor.role != "admin" or actor.account_status != "active":
            raise HTTPException(403, "Administrator access is no longer available")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if mutating and user.id == actor.id:
        raise HTTPException(
            403, "Administrators cannot change their own role or account status"
        )
    return user


def last_admin(db, user):
    return (
        user.role == "admin"
        and user.account_status == "active"
        and db.query(User).filter_by(role="admin", account_status="active").count() <= 1
    )


def invitation_view(invitation):
    return {
        k: getattr(invitation, k)
        for k in [
            "id",
            "email",
            "role",
            "created_at",
            "expires_at",
            "used_at",
            "revoked_at",
            "invited_by",
        ]
    }


@router.get("/users")
def users(
    search: str = Query("", max_length=100),
    role: str | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    actor=Depends(require("users.manage")),
    db=Depends(get_db),
):
    query = db.query(User)
    if search:
        query = query.filter(
            User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%")
        )
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.account_status == status)
    return {
        "total": query.count(),
        "items": [
            user_view(u)
            for u in query.order_by(User.id)
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        ],
    }


@router.get("/users/{user_id}")
def user_detail(
    user_id: int, actor=Depends(require("users.manage")), db=Depends(get_db)
):
    return user_view(admin_target(db, user_id, actor, False))


@router.patch("/users/{user_id}/status")
def status(
    user_id: int,
    data: StatusUpdate,
    actor=Depends(require("users.manage")),
    db=Depends(get_db),
):
    target = admin_target(db, user_id, actor)
    if last_admin(db, target) and data.status != "active":
        raise HTTPException(409, "The last active administrator must be retained")
    if data.status == "active" and not target.email_verified:
        raise HTTPException(409, "Email verification is required before activation")
    target.account_status = data.status
    if data.status != "active":
        revoke_sessions(db, target.id)
    notify(
        db,
        target.id,
        "Account status updated",
        f"An administrator changed your account status to {data.status}.",
        "security",
    )
    record_audit(
        db, actor, "admin.status_changed", "user", target.id, {"status": data.status}
    )
    db.commit()
    return user_view(target)


@router.patch("/users/{user_id}/role")
def role(
    user_id: int,
    data: RoleUpdate,
    actor=Depends(require("roles.manage")),
    db=Depends(get_db),
):
    target = admin_target(db, user_id, actor)
    if last_admin(db, target) and data.role != "admin":
        raise HTTPException(409, "The last active administrator must be retained")
    if data.role == "customer" and not target.customer_id:
        customer = Customer(
            display_name=target.full_name,
            email=None,
            preferred_categories=[],
            preferred_brands=[],
            preferred_colours=[],
            budget_min=0,
            budget_max=5000,
        )
        db.add(customer)
        db.flush()
        target.customer_id = customer.id
    target.role = data.role
    revoke_sessions(db, target.id)
    notify(
        db,
        target.id,
        "Workspace role updated",
        f'Your role is now {data.role.replace("_"," ")}. Sign in again.',
        "security",
    )
    record_audit(
        db, actor, "admin.role_changed", "user", target.id, {"role": data.role}
    )
    db.commit()
    return user_view(target)


@router.post("/invitations", status_code=201)
def invite(
    data: InvitationInput,
    actor=Depends(require("invitations.manage")),
    db=Depends(get_db),
):
    email = str(data.email).casefold()
    if db.query(User).filter_by(email=email).first():
        raise HTTPException(409, "An account already exists; manage its role instead")
    db.query(StaffInvitation).filter_by(
        email=email, used_at=None, revoked_at=None
    ).update({"revoked_at": utcnow()})
    raw = secrets.token_urlsafe(48)
    invitation = StaffInvitation(
        email=email,
        role=data.role,
        invited_by=actor.id,
        token_hash=token_hash(raw),
        expires_at=utcnow() + timedelta(days=7),
    )
    db.add(invitation)
    db.flush()
    record_audit(
        db,
        actor,
        "admin.invitation_created",
        "invitation",
        invitation.id,
        {"role": data.role},
    )
    notify(
        db,
        actor.id,
        "Staff invitation created",
        f'An invitation for the {data.role.replace("_"," ")} workspace was created.',
        "invitation",
    )
    db.commit()
    try:
        delivery = deliver(
            email,
            "StyleSense staff invitation",
            f'Accept your {data.role.replace("_"," ")} invitation: {auth_settings.public_url}/accept-invitation#token={raw}',
        )
    except Exception:
        logging.getLogger(__name__).error(
            "Staff invitation delivery unavailable; no message secrets logged"
        )
        delivery = "unavailable"
    return {**invitation_view(invitation), "delivery_status": delivery}


@router.get("/invitations")
def invitations(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    actor=Depends(require("invitations.manage")),
    db=Depends(get_db),
):
    query = db.query(StaffInvitation)
    return {
        "total": query.count(),
        "items": [
            invitation_view(i)
            for i in query.order_by(StaffInvitation.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        ],
    }


@router.delete("/invitations/{invitation_id}")
def revoke_invitation(
    invitation_id: int, actor=Depends(require("invitations.manage")), db=Depends(get_db)
):
    invitation = db.get(StaffInvitation, invitation_id)
    if not invitation:
        raise HTTPException(404, "Invitation not found")
    if invitation.used_at:
        raise HTTPException(
            409, "Accepted invitations cannot be revoked; manage the account instead"
        )
    invitation.revoked_at = utcnow()
    record_audit(db, actor, "admin.invitation_revoked", "invitation", invitation.id)
    db.commit()
    return {"message": "Invitation revoked"}


@router.get("/audit-logs")
def audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    actor=Depends(require("audit.read")),
    db=Depends(get_db),
):
    query = db.query(AuditLog)
    return {
        "total": query.count(),
        "items": [
            {
                "id": a.id,
                "actor_user_id": a.actor_user_id,
                "action": a.action,
                "resource_type": a.resource_type,
                "resource_id": a.resource_id,
                "timestamp": a.timestamp,
                "metadata": a.details,
            }
            for a in query.order_by(AuditLog.timestamp.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        ],
    }


@router.get("/settings")
def system_settings(actor=Depends(require("system.manage")), db=Depends(get_db)):
    values = {s.key: s.value for s in db.query(SystemSetting).all()}
    return {
        "registration_enabled": values.get("registration_enabled", True),
        "maintenance_notice": values.get("maintenance_notice", ""),
    }


@router.patch("/settings")
def update_settings(
    data: SystemSettingsInput,
    actor=Depends(require("system.manage")),
    db=Depends(get_db),
):
    for key, value in data.model_dump().items():
        setting = db.get(SystemSetting, key)
        if setting:
            setting.value = value
        else:
            db.add(SystemSetting(key=key, value=value))
    record_audit(db, actor, "admin.settings_changed", "settings")
    db.commit()
    return data.model_dump()
