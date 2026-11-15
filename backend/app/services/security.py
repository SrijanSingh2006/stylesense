"""Server-authoritative sessions, permissions and anti-CSRF checks."""

import hashlib, hmac, secrets, uuid
from datetime import timedelta, datetime, UTC
import jwt
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerificationError, InvalidHashError
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import update, case
from app.core.auth_config import auth_settings, COOKIE_NAME, COOKIE_PATH
from app.core.config import settings
from app.db.session import get_db
from app.models.account import (
    User,
    UserSession,
    AuditLog,
    Notification,
    RateLimitBucket,
    utcnow,
)

PASSWORD_HASHER = PasswordHasher(
    time_cost=2, memory_cost=19456, parallelism=1, type=Type.ID
)
DUMMY_HASH = PASSWORD_HASHER.hash(secrets.token_urlsafe(32))
bearer = HTTPBearer(auto_error=False)
PERMISSIONS = {
    "customer": {
        "storefront.read",
        "products.read",
        "recommendations.read",
        "cart.manage",
        "wishlist.manage",
        "profile.manage",
        "addresses.manage",
        "orders.read_own",
        "preferences.manage",
    },
    "product_manager": {
        "analytics.read",
        "experiments.manage",
        "segments.read",
        "roadmap.manage",
        "feedback.manage",
        "releases.read",
        "feature_flags.manage",
        "profile.manage",
    },
    "operations_manager": {
        "inventory.read",
        "inventory.manage",
        "returns.read",
        "catalogue.manage",
        "pricing.simulate",
        "releases.read",
        "releases.manage",
        "profile.manage",
    },
    "admin": {
        "users.manage",
        "roles.manage",
        "invitations.manage",
        "audit.read",
        "system.manage",
    },
}


def token_hash(raw):
    return hashlib.sha256(raw.encode()).hexdigest()


def csrf_for(raw):
    return hmac.new(
        auth_settings.secret.encode(), ("csrf:" + raw).encode(), hashlib.sha256
    ).hexdigest()


def has_permission(user, permission):
    return user.role == "admin" or permission in PERMISSIONS.get(user.role, set())


def password_valid(password):
    if not 12 <= len(password) <= 128:
        return False
    if not auth_settings.complexity:
        return True
    return (
        sum(
            [
                any(c.islower() for c in password),
                any(c.isupper() for c in password),
                any(c.isdigit() for c in password),
                any(not c.isalnum() for c in password),
            ]
        )
        >= 3
    )


def hash_password(password):
    if not password_valid(password):
        raise HTTPException(
            422,
            "Password must contain 12–128 characters and at least three of lowercase, uppercase, numbers and symbols",
        )
    return PASSWORD_HASHER.hash(password)


def verify_password(password, encoded):
    try:
        return PASSWORD_HASHER.verify(encoded, password)
    except (VerificationError, InvalidHashError):
        return False


def origin_check(request, required=True):
    origin = request.headers.get("origin")
    if (required and not origin) or (origin and origin not in settings.CORS_ORIGINS):
        raise HTTPException(403, "Request origin is not trusted")


def csrf_check(request, session, raw):
    origin_check(request)
    supplied = request.headers.get("x-csrf-token", "")
    if (
        not supplied
        or not hmac.compare_digest(token_hash(supplied), session.csrf_hash)
        or not hmac.compare_digest(supplied, csrf_for(raw))
    ):
        raise HTTPException(403, "CSRF verification failed")


def record_audit(db, user, action, resource="account", resource_id=None, details=None):
    # Callers provide only explicitly chosen non-secret metadata.
    db.add(
        AuditLog(
            actor_user_id=user.id if user else None,
            action=action,
            resource_type=resource,
            resource_id=str(resource_id) if resource_id is not None else None,
            details=details or {},
        )
    )


def notify(db, user_id, title, message, kind="account"):
    db.add(
        Notification(
            user_id=user_id, title=title, message=message, notification_type=kind
        )
    )


def limit(db, request, scope, identifier="", maximum=10, window=None):
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert
    from sqlalchemy.dialects.postgresql import insert as pg_insert

    now = utcnow()
    expiry = now + timedelta(seconds=window or auth_settings.rate_window)
    key = token_hash(
        f'{scope}:{identifier or (request.client.host if request.client else "unknown")}'
    )
    insert = pg_insert if db.bind.dialect.name == "postgresql" else sqlite_insert
    statement = insert(RateLimitBucket).values(key=key, attempts=1, expires_at=expiry)
    statement = statement.on_conflict_do_update(
        index_elements=["key"],
        set_={
            "attempts": case(
                (RateLimitBucket.expires_at <= now, 1),
                else_=RateLimitBucket.attempts + 1,
            ),
            "expires_at": case(
                (RateLimitBucket.expires_at <= now, expiry),
                else_=RateLimitBucket.expires_at,
            ),
        },
    ).returning(RateLimitBucket.attempts)
    count = db.execute(statement).scalar_one()
    db.commit()
    if count > maximum:
        raise HTTPException(
            429,
            "Too many attempts. Please try again later.",
            headers={"Retry-After": str(window or auth_settings.rate_window)},
        )
    return key


def user_view(user):
    preferences = user.preferences
    return {
        "id": user.id,
        "customer_id": user.customer_id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "account_status": user.account_status,
        "email_verified": user.email_verified,
        "avatar_url": user.avatar_url,
        "phone": user.phone,
        "created_at": user.created_at,
        "last_login_at": user.last_login_at,
        "onboarding_completed": bool(preferences and preferences.onboarding_completed),
        "permissions": sorted(
            set().union(*PERMISSIONS.values())
            if user.role == "admin"
            else PERMISSIONS[user.role]
        ),
    }


def access_for(user, session):
    now = datetime.now(UTC)
    return jwt.encode(
        {
            "sub": str(user.id),
            "sid": session.id,
            "iat": now,
            "exp": now + timedelta(seconds=auth_settings.access_seconds),
            "iss": "stylesense",
            "aud": "stylesense-web",
            "jti": str(uuid.uuid4()),
        },
        auth_settings.secret,
        algorithm="HS256",
    )


def create_session(db, user, request, family=None, remember=True):
    raw = secrets.token_urlsafe(48)
    csrf = csrf_for(raw)
    session = UserSession(
        id=str(uuid.uuid4()),
        user_id=user.id,
        refresh_token_hash=token_hash(raw),
        csrf_hash=token_hash(csrf),
        token_family_id=family or str(uuid.uuid4()),
        expires_at=utcnow()
        + timedelta(days=auth_settings.refresh_days if remember else 1),
        user_agent=request.headers.get("user-agent", "")[:250],
    )
    db.add(session)
    db.flush()
    return session, raw, csrf


def session_response(user, session, csrf):
    return {
        "access_token": access_for(user, session),
        "token_type": "bearer",
        "expires_in": auth_settings.access_seconds,
        "csrf_token": csrf,
        "user": user_view(user),
    }


def set_refresh(response, raw, session, remember=True):
    kwargs = (
        {"max_age": max(0, int((session.expires_at - utcnow()).total_seconds()))}
        if remember
        else {}
    )
    response.set_cookie(
        COOKIE_NAME,
        raw,
        httponly=True,
        secure=auth_settings.secure_cookie,
        samesite=auth_settings.same_site,
        path=COOKIE_PATH,
        **kwargs,
    )


def clear_refresh(response):
    response.delete_cookie(
        COOKIE_NAME,
        path=COOKIE_PATH,
        secure=auth_settings.secure_cookie,
        samesite=auth_settings.same_site,
        httponly=True,
    )


def cookie_session(db, request):
    raw = request.cookies.get(COOKIE_NAME)
    if not raw:
        raise HTTPException(401, "Session is not available")
    session = (
        db.query(UserSession).filter_by(refresh_token_hash=token_hash(raw)).first()
    )
    if not session or session.expires_at <= utcnow():
        raise HTTPException(401, "Session is not available")
    return session, raw


def current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db=Depends(get_db),
):
    if not credentials:
        raise HTTPException(
            401, "Sign in required", headers={"WWW-Authenticate": "Bearer"}
        )
    try:
        payload = jwt.decode(
            credentials.credentials,
            auth_settings.secret,
            algorithms=["HS256"],
            issuer="stylesense",
            audience="stylesense-web",
            options={"require": ["exp", "iat", "sub", "sid", "iss", "aud"]},
        )
        user_id = int(payload["sub"])
        sid = payload["sid"]
    except (jwt.PyJWTError, ValueError, TypeError, KeyError):
        raise HTTPException(401, "Session expired or invalid")
    session = db.get(UserSession, sid)
    user = db.get(User, user_id)
    if (
        not user
        or not session
        or session.user_id != user.id
        or session.revoked_at
        or session.expires_at <= utcnow()
        or user.account_status != "active"
        or not user.email_verified
    ):
        raise HTTPException(401, "Session expired or account unavailable")
    request.state.auth_session = session
    return user


def optional_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db=Depends(get_db),
):
    return current_user(request, credentials, db) if credentials else None


def require(permission):
    def dependency(user: User = Depends(current_user)):
        if not has_permission(user, permission):
            raise HTTPException(403, "You do not have permission for this action")
        return user

    return dependency


def own_customer(user, customer_id):
    if user.customer_id is None or user.customer_id != customer_id:
        raise HTTPException(403, "This customer data does not belong to your account")


def revoke_sessions(db, user_id, except_id=None):
    q = db.query(UserSession).filter(
        UserSession.user_id == user_id, UserSession.revoked_at.is_(None)
    )
    if except_id:
        q = q.filter(UserSession.id != except_id)
    q.update({"revoked_at": utcnow()}, synchronize_session=False)
