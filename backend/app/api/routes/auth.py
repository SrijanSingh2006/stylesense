import logging, secrets
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from app.db.session import get_db
from app.core.auth_config import auth_settings
from app.models.customer import Customer
from app.models.account import (
    User,
    UserSession,
    UserPreference,
    UserWishlist,
    Cart,
    EmailVerificationToken,
    PasswordResetToken,
    StaffInvitation,
    RateLimitBucket,
    SystemSetting,
    utcnow,
)
from app.schemas.account import (
    Registration,
    Login,
    EmailInput,
    TokenInput,
    ResetPassword,
    ChangePassword,
    InvitationAcceptance,
)
from app.services.security import (
    PASSWORD_HASHER,
    DUMMY_HASH,
    token_hash,
    hash_password,
    verify_password,
    origin_check,
    csrf_check,
    record_audit,
    notify,
    limit,
    user_view,
    create_session,
    session_response,
    set_refresh,
    clear_refresh,
    cookie_session,
    current_user,
    revoke_sessions,
)
from app.services.mail import deliver

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


def create_account(db, name, email, password, role="customer", verified=False):
    customer = None
    if role == "customer":
        customer = Customer(
            display_name=name,
            email=email,
            preferred_categories=[],
            preferred_brands=[],
            preferred_colours=[],
            budget_min=0,
            budget_max=5000,
        )
        db.add(customer)
        db.flush()
    user = User(
        full_name=name.strip(),
        email=email.casefold(),
        password_hash=hash_password(password),
        role=role,
        customer_id=customer.id if customer else None,
        account_status="active" if verified else "pending_verification",
        email_verified=verified,
        email_verified_at=utcnow() if verified else None,
    )
    db.add(user)
    db.flush()
    db.add(UserPreference(user_id=user.id))
    db.add(UserWishlist(user_id=user.id))
    db.add(Cart(user_id=user.id))
    db.flush()
    return user


def mint(db, user, model, hours):
    db.query(model).filter(model.user_id == user.id, model.used_at.is_(None)).update(
        {"used_at": utcnow()}, synchronize_session=False
    )
    raw = secrets.token_urlsafe(48)
    db.add(
        model(
            user_id=user.id,
            token_hash=token_hash(raw),
            expires_at=utcnow() + timedelta(hours=hours),
        )
    )
    return raw


def deliver_link(user, raw, kind):
    route = "verify-email" if kind == "verification" else "reset-password"
    try:
        return deliver(
            user.email,
            f"StyleSense {kind}",
            f"Open this single-use link: {auth_settings.public_url}/{route}#token={raw}\nIf you did not request this, ignore it.",
        )
    except Exception:
        logger.error("Account email delivery unavailable; no message secrets logged")
        return "unavailable"


def consume(db, model, raw):
    record = db.query(model).filter_by(token_hash=token_hash(raw)).first()
    if not record or record.used_at or record.expires_at <= utcnow():
        raise HTTPException(400, "Link is invalid, expired or already used")
    changed = db.execute(
        update(model)
        .where(
            model.id == record.id, model.used_at.is_(None), model.expires_at > utcnow()
        )
        .values(used_at=utcnow())
    )
    if changed.rowcount != 1:
        raise HTTPException(400, "Link is invalid, expired or already used")
    return db.get(User, record.user_id)


@router.post("/register", status_code=201)
def register(data: Registration, request: Request, db=Depends(get_db)):
    origin_check(request)
    limit(db, request, "registration", maximum=10, window=3600)
    setting = db.get(SystemSetting, "registration_enabled")
    if setting and not setting.value:
        raise HTTPException(403, "Registration is temporarily unavailable")
    email = str(data.email).casefold()
    if (
        db.query(User).filter_by(email=email).first()
        or db.query(Customer).filter_by(email=email).first()
    ):
        raise HTTPException(409, "An account with this email cannot be registered")
    try:
        user = create_account(db, data.full_name, email, data.password)
        user.terms_accepted_at = utcnow()
        raw = mint(db, user, EmailVerificationToken, 24)
        notify(
            db,
            user.id,
            "Welcome to StyleSense",
            "Verify your email to activate your account.",
            "registration",
        )
        record_audit(db, user, "account.registered", resource_id=user.id)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "An account with this email cannot be registered")
    delivery = deliver_link(user, raw, "verification")
    return {
        "message": "Account created. Verify your email before signing in.",
        "delivery_status": delivery,
        "email": user.email,
    }


@router.post("/login")
def login(data: Login, request: Request, response: Response, db=Depends(get_db)):
    origin_check(request)
    limit(db, request, "login-ip", maximum=60)
    email = str(data.email).casefold()
    key = limit(db, request, "login-email", email, maximum=auth_settings.login_limit)
    user = db.query(User).filter_by(email=email).first()
    valid = verify_password(data.password, user.password_hash if user else DUMMY_HASH)
    if (
        not user
        or not valid
        or not user.email_verified
        or user.account_status != "active"
    ):
        record_audit(db, user, "auth.login_failed")
        db.commit()
        raise HTTPException(
            401, "Unable to sign in. Check credentials and account verification."
        )
    if PASSWORD_HASHER.check_needs_rehash(user.password_hash):
        user.password_hash = hash_password(data.password)
    db.query(RateLimitBucket).filter_by(key=key).delete()
    session, raw, csrf = create_session(db, user, request, remember=data.remember_me)
    user.last_login_at = utcnow()
    record_audit(db, user, "auth.login", resource="session", resource_id=session.id)
    db.commit()
    set_refresh(response, raw, session, data.remember_me)
    return session_response(user, session, csrf)


@router.get("/csrf")
def bootstrap_csrf(request: Request, db=Depends(get_db)):
    origin_check(request, required=False)
    session, raw = cookie_session(db, request)
    if session.revoked_at:
        raise HTTPException(401, "Session is not available")
    user = db.get(User, session.user_id)
    if not user or user.account_status != "active" or not user.email_verified:
        raise HTTPException(401, "Session is not available")
    from app.services.security import csrf_for

    return {"csrf_token": csrf_for(raw)}


@router.post("/refresh")
def refresh(request: Request, response: Response, db=Depends(get_db)):
    origin_check(request)
    session, raw = cookie_session(db, request)
    csrf_check(request, session, raw)
    user = db.get(User, session.user_id)
    if session.revoked_at:
        db.query(UserSession).filter_by(token_family_id=session.token_family_id).update(
            {"revoked_at": utcnow()}, synchronize_session=False
        )
        record_audit(db, user, "auth.refresh_reuse", resource="session")
        db.commit()
        result = JSONResponse(
            {"detail": "Session reuse detected. Sign in again."}, status_code=401
        )
        clear_refresh(result)
        return result
    if not user or user.account_status != "active" or not user.email_verified:
        raise HTTPException(401, "Account is unavailable")
    changed = db.execute(
        update(UserSession)
        .where(UserSession.id == session.id, UserSession.revoked_at.is_(None))
        .values(revoked_at=utcnow(), last_used_at=utcnow())
    )
    if changed.rowcount != 1:
        db.query(UserSession).filter_by(token_family_id=session.token_family_id).update(
            {"revoked_at": utcnow()}, synchronize_session=False
        )
        db.commit()
        raise HTTPException(401, "Session is no longer available")
    remember = (session.expires_at - session.created_at) > timedelta(days=1, seconds=10)
    new, token, csrf = create_session(
        db, user, request, family=session.token_family_id, remember=remember
    )
    db.commit()
    set_refresh(response, token, new, remember)
    return session_response(user, new, csrf)


@router.post("/logout")
def logout(request: Request, response: Response, db=Depends(get_db)):
    origin_check(request)
    try:
        session, raw = cookie_session(db, request)
    except HTTPException as error:
        if error.status_code != 401:
            raise
        clear_refresh(response)
        return {"message": "Signed out"}
    csrf_check(request, session, raw)
    db.query(UserSession).filter_by(token_family_id=session.token_family_id).update(
        {"revoked_at": utcnow()}, synchronize_session=False
    )
    record_audit(db, db.get(User, session.user_id), "auth.logout", resource="session")
    db.commit()
    clear_refresh(response)
    return {"message": "Signed out"}


@router.post("/logout-all")
def logout_all(
    request: Request, response: Response, user=Depends(current_user), db=Depends(get_db)
):
    session, raw = cookie_session(db, request)
    csrf_check(request, session, raw)
    if session.user_id != user.id:
        raise HTTPException(403, "Session owner mismatch")
    revoke_sessions(db, user.id)
    record_audit(db, user, "auth.logout_all")
    db.commit()
    clear_refresh(response)
    return {"message": "All sessions revoked"}


@router.get("/me")
def me(user=Depends(current_user)):
    return user_view(user)


@router.post("/verify-email")
def verify(data: TokenInput, request: Request, db=Depends(get_db)):
    origin_check(request)
    limit(db, request, "verify-email", maximum=30)
    user = consume(db, EmailVerificationToken, data.token)
    if not user or user.account_status != "pending_verification":
        raise HTTPException(400, "Account cannot be verified with this link")
    user.email_verified = True
    user.email_verified_at = utcnow()
    user.account_status = "active"
    notify(
        db,
        user.id,
        "Email verified",
        "Your StyleSense account is active.",
        "verification",
    )
    record_audit(db, user, "account.email_verified")
    db.commit()
    return {"message": "Email verified. You can now sign in."}


@router.post("/resend-verification")
def resend(data: EmailInput, request: Request, db=Depends(get_db)):
    origin_check(request)
    limit(db, request, "resend-ip", maximum=20, window=3600)
    email = str(data.email).casefold()
    limit(db, request, "resend-email", email, maximum=5, window=3600)
    user = db.query(User).filter_by(email=email).first()
    if (
        user
        and not user.email_verified
        and user.account_status == "pending_verification"
    ):
        raw = mint(db, user, EmailVerificationToken, 24)
        db.commit()
        deliver_link(user, raw, "verification")
    return {
        "message": "If the account is eligible, verification instructions are available through the configured delivery channel.",
        "delivery_mode": auth_settings.email_mode,
    }


@router.post("/forgot-password")
def forgot(data: EmailInput, request: Request, db=Depends(get_db)):
    origin_check(request)
    limit(db, request, "reset-ip", maximum=20, window=3600)
    email = str(data.email).casefold()
    limit(db, request, "reset-email", email, maximum=5, window=3600)
    user = db.query(User).filter_by(email=email).first()
    if user and user.account_status == "active" and user.email_verified:
        raw = mint(db, user, PasswordResetToken, 1)
        notify(
            db,
            user.id,
            "Password reset requested",
            "If this was not you, review your account sessions.",
            "security",
        )
        record_audit(db, user, "auth.password_reset_requested")
        db.commit()
        deliver_link(user, raw, "password reset")
    return {
        "message": "If the account is eligible, reset instructions are available through the configured delivery channel.",
        "delivery_mode": auth_settings.email_mode,
    }


@router.post("/reset-password")
def reset(
    data: ResetPassword, request: Request, response: Response, db=Depends(get_db)
):
    origin_check(request)
    limit(db, request, "reset-consume", maximum=20)
    user = consume(db, PasswordResetToken, data.token)
    if not user or user.account_status != "active":
        raise HTTPException(400, "Account cannot be reset with this link")
    user.password_hash = hash_password(data.password)
    revoke_sessions(db, user.id)
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None)
    ).update({"used_at": utcnow()}, synchronize_session=False)
    notify(
        db,
        user.id,
        "Password changed",
        "All previous sessions were signed out.",
        "security",
    )
    record_audit(db, user, "auth.password_reset")
    db.commit()
    clear_refresh(response)
    return {"message": "Password reset. Sign in with your new password."}


@router.post("/change-password")
def change_password(
    data: ChangePassword,
    request: Request,
    response: Response,
    user=Depends(current_user),
    db=Depends(get_db),
):
    origin_check(request, required=False)
    limit(db, request, "change-password", str(user.id), maximum=10)
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    user.password_hash = hash_password(data.password)
    revoke_sessions(db, user.id)
    notify(
        db,
        user.id,
        "Password changed",
        "All sessions were signed out after your password change.",
        "security",
    )
    record_audit(db, user, "auth.password_changed")
    db.commit()
    clear_refresh(response)
    return {"message": "Password changed. Sign in again."}


@router.get("/sessions")
def sessions(request: Request, user=Depends(current_user), db=Depends(get_db)):
    return [
        {
            "id": s.id,
            "created_at": s.created_at,
            "last_used_at": s.last_used_at,
            "expires_at": s.expires_at,
            "user_agent": s.user_agent,
            "current": s.id == request.state.auth_session.id,
        }
        for s in db.query(UserSession)
        .filter(
            UserSession.user_id == user.id,
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > utcnow(),
        )
        .order_by(UserSession.created_at.desc())
        .all()
    ]


@router.delete("/sessions/{session_id}")
def revoke(
    session_id: str,
    request: Request,
    response: Response,
    user=Depends(current_user),
    db=Depends(get_db),
):
    origin_check(request, required=False)
    session = db.query(UserSession).filter_by(id=session_id, user_id=user.id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    db.query(UserSession).filter_by(token_family_id=session.token_family_id).update(
        {"revoked_at": utcnow()}, synchronize_session=False
    )
    if session.id == request.state.auth_session.id:
        clear_refresh(response)
    record_audit(
        db, user, "auth.session_revoked", resource="session", resource_id=session.id
    )
    db.commit()
    return {"message": "Session revoked"}


@router.post("/accept-invitation", status_code=201)
def accept_invitation(data: InvitationAcceptance, request: Request, db=Depends(get_db)):
    origin_check(request)
    limit(db, request, "invitation-consume", maximum=20)
    invitation = (
        db.query(StaffInvitation).filter_by(token_hash=token_hash(data.token)).first()
    )
    if (
        not invitation
        or invitation.used_at
        or invitation.revoked_at
        or invitation.expires_at <= utcnow()
    ):
        raise HTTPException(400, "Invitation is invalid, expired or revoked")
    if db.query(User).filter_by(email=invitation.email).first():
        raise HTTPException(
            409, "Account already exists; an administrator must manage its role"
        )
    changed = db.execute(
        update(StaffInvitation)
        .where(
            StaffInvitation.id == invitation.id,
            StaffInvitation.used_at.is_(None),
            StaffInvitation.revoked_at.is_(None),
            StaffInvitation.expires_at > utcnow(),
        )
        .values(used_at=utcnow())
    )
    if changed.rowcount != 1:
        raise HTTPException(400, "Invitation is no longer available")
    user = create_account(
        db,
        data.full_name,
        invitation.email,
        data.password,
        invitation.role,
        verified=True,
    )
    notify(
        db,
        user.id,
        "Staff access activated",
        f'Your {user.role.replace("_"," ")} workspace is available.',
        "invitation",
    )
    record_audit(db, user, "account.invitation_accepted")
    db.commit()
    return {"message": "Staff account created. Sign in to continue."}


@router.get("/policy")
def public_policy(db=Depends(get_db)):
    registration = db.get(SystemSetting, "registration_enabled")
    notice = db.get(SystemSetting, "maintenance_notice")
    return {
        "minimum_password_length": 12,
        "maximum_password_length": 128,
        "password_complexity": auth_settings.complexity,
        "registration_enabled": registration.value if registration else True,
        "maintenance_notice": notice.value if notice else "",
        "email_mode": auth_settings.email_mode,
    }
