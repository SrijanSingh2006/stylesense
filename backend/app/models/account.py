from datetime import datetime, UTC
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Numeric,
    Text,
    UniqueConstraint,
    CheckConstraint,
    Index,
    text,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


def utcnow():
    return datetime.now(UTC).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role IN ('customer','product_manager','operations_manager','admin')",
            name="ck_user_role",
        ),
        CheckConstraint(
            "account_status IN ('pending_verification','active','suspended','deactivated')",
            name="ck_user_status",
        ),
    )
    id = Column(Integer, primary_key=True)
    customer_id = Column(
        Integer, ForeignKey("customers.id"), unique=True, nullable=True
    )
    full_name = Column(String(100), nullable=False)
    email = Column(String(254), nullable=False, unique=True, index=True)
    password_hash = Column(String(512), nullable=False)
    role = Column(String(30), nullable=False, default="customer", index=True)
    account_status = Column(
        String(30), nullable=False, default="pending_verification", index=True
    )
    email_verified = Column(Boolean, nullable=False, default=False)
    email_verified_at = Column(DateTime)
    terms_accepted_at = Column(DateTime)
    avatar_url = Column(String(500))
    phone = Column(String(25))
    created_at = Column(DateTime, nullable=False, default=utcnow)
    updated_at = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)
    last_login_at = Column(DateTime)
    customer = relationship("Customer")
    preferences = relationship("UserPreference", uselist=False, back_populates="user")
    sessions = relationship("UserSession", back_populates="user")


class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    refresh_token_hash = Column(String(64), nullable=False, unique=True)
    csrf_hash = Column(String(64), nullable=False)
    token_family_id = Column(String(36), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)
    expires_at = Column(DateTime, nullable=False, index=True)
    last_used_at = Column(DateTime, nullable=False, default=utcnow)
    revoked_at = Column(DateTime, index=True)
    user_agent = Column(String(250))
    user = relationship("User", back_populates="sessions")


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime)
    created_at = Column(DateTime, nullable=False, default=utcnow)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime)
    created_at = Column(DateTime, nullable=False, default=utcnow)


class UserAddress(Base):
    __tablename__ = "user_addresses"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(25), nullable=False)
    address_line_1 = Column(String(200), nullable=False)
    address_line_2 = Column(String(200))
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(15), nullable=False)
    country = Column(String(2), nullable=False, default="IN")
    address_type = Column(String(20), nullable=False, default="shipping")
    is_default = Column(Boolean, nullable=False, default=False)


Index(
    "uq_default_address",
    UserAddress.user_id,
    unique=True,
    sqlite_where=text("is_default = 1"),
    postgresql_where=text("is_default = true"),
)


class UserPreference(Base):
    __tablename__ = "user_preferences"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    preferred_categories = Column(JSON, nullable=False, default=list)
    preferred_brands = Column(JSON, nullable=False, default=list)
    preferred_colours = Column(JSON, nullable=False, default=list)
    budget_min = Column(Numeric(12, 2), nullable=False, default=0)
    budget_max = Column(Numeric(12, 2), nullable=False, default=5000)
    preferred_fit = Column(String(20), nullable=False, default="Regular")
    onboarding_completed = Column(Boolean, nullable=False, default=False)
    updated_at = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)
    user = relationship("User", back_populates="preferences")


class UserWishlist(Base):
    __tablename__ = "user_wishlists"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)


class UserWishlistItem(Base):
    __tablename__ = "user_wishlist_items"
    __table_args__ = (
        UniqueConstraint("wishlist_id", "product_id", name="uq_user_wishlist_product"),
    )
    id = Column(Integer, primary_key=True)
    wishlist_id = Column(
        Integer, ForeignKey("user_wishlists.id"), nullable=False, index=True
    )
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=utcnow)


class Cart(Base):
    __tablename__ = "carts"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    updated_at = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint(
            "cart_id", "product_id", "selected_size", name="uq_cart_product_size"
        ),
        CheckConstraint("quantity > 0", name="ck_cart_quantity"),
    )
    id = Column(Integer, primary_key=True)
    cart_id = Column(Integer, ForeignKey("carts.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    selected_size = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)


class CartMergeReceipt(Base):
    __tablename__ = "cart_merge_receipts"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    merge_key = Column(String(100), nullable=False, unique=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(40), nullable=False)
    read_at = Column(DateTime)
    created_at = Column(DateTime, nullable=False, default=utcnow, index=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), index=True)
    action = Column(String(80), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100))
    timestamp = Column(DateTime, nullable=False, default=utcnow, index=True)
    details = Column("metadata", JSON, nullable=False, default=dict)


class StaffInvitation(Base):
    __tablename__ = "staff_invitations"
    id = Column(Integer, primary_key=True)
    email = Column(String(254), nullable=False, index=True)
    role = Column(String(30), nullable=False)
    token_hash = Column(String(64), nullable=False, unique=True)
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=utcnow)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime)
    revoked_at = Column(DateTime)


class RateLimitBucket(Base):
    __tablename__ = "auth_rate_limits"
    key = Column(String(64), primary_key=True)
    attempts = Column(Integer, nullable=False, default=0)
    expires_at = Column(DateTime, nullable=False, index=True)


class SystemSetting(Base):
    __tablename__ = "system_settings"
    key = Column(String(80), primary_key=True)
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)
