"""Authentication settings. Production refuses unsafe development defaults."""

import os
import secrets
from pathlib import Path
from dataclasses import dataclass, field
from app.core.config import settings


def enabled(name, default=False):
    return os.getenv(name, str(default)).lower() in {"1", "true", "yes"}


@dataclass
class AuthSettings:
    environment: str = field(
        default_factory=lambda: os.getenv("ENVIRONMENT", "development").strip().lower()
    )
    secret: str = field(
        default_factory=lambda: os.getenv("AUTH_SECRET_KEY")
        or secrets.token_urlsafe(48)
    )
    access_seconds: int = field(
        default_factory=lambda: int(os.getenv("AUTH_ACCESS_SECONDS", "300"))
    )
    refresh_days: int = field(
        default_factory=lambda: int(os.getenv("AUTH_REFRESH_DAYS", "7"))
    )
    secure_cookie: bool = field(default_factory=lambda: enabled("AUTH_COOKIE_SECURE"))
    same_site: str = field(
        default_factory=lambda: os.getenv("AUTH_COOKIE_SAMESITE", "lax")
    )
    email_mode: str = field(
        default_factory=lambda: os.getenv("AUTH_EMAIL_MODE", "outbox")
    )
    outbox: Path = field(
        default_factory=lambda: Path(
            os.getenv(
                "AUTH_OUTBOX_DIR",
                str(Path(__file__).resolve().parents[2] / ".dev-mail"),
            )
        )
    )
    public_url: str = field(
        default_factory=lambda: os.getenv(
            "APP_PUBLIC_URL", "http://127.0.0.1:5173"
        ).rstrip("/")
    )
    complexity: bool = field(
        default_factory=lambda: enabled("AUTH_PASSWORD_COMPLEXITY", True)
    )
    login_limit: int = field(
        default_factory=lambda: int(os.getenv("AUTH_LOGIN_LIMIT", "5"))
    )
    rate_window: int = field(
        default_factory=lambda: int(os.getenv("AUTH_RATE_WINDOW_SECONDS", "900"))
    )
    demo_enabled: bool = field(default_factory=lambda: enabled("SEED_DEMO_ACCOUNTS"))

    def __post_init__(self):
        if self.same_site not in {"lax", "strict", "none"}:
            raise RuntimeError("Invalid AUTH_COOKIE_SAMESITE")
        if self.same_site == "none" and not self.secure_cookie:
            raise RuntimeError("SameSite=None requires Secure cookies")
        if self.email_mode not in {"outbox", "smtp"}:
            raise RuntimeError("AUTH_EMAIL_MODE must be outbox or smtp")
        if self.environment == "production":
            if len(os.getenv("AUTH_SECRET_KEY", "")) < 32:
                raise RuntimeError(
                    "Production requires AUTH_SECRET_KEY of at least 32 characters"
                )
            if not self.secure_cookie:
                raise RuntimeError("Production requires AUTH_COOKIE_SECURE=true")
            if self.demo_enabled:
                raise RuntimeError(
                    "Development demo accounts are forbidden in production"
                )
            if self.email_mode != "smtp" or not os.getenv("SMTP_HOST"):
                raise RuntimeError("Production requires configured SMTP delivery")
            if (
                not settings.CORS_ORIGINS
                or not self.public_url.startswith("https://")
                or any(not o.startswith("https://") for o in settings.CORS_ORIGINS)
            ):
                raise RuntimeError(
                    "Production requires HTTPS frontend and trusted origins"
                )
        if not 60 <= self.access_seconds <= 900:
            raise RuntimeError("AUTH_ACCESS_SECONDS must be 60–900")
        if not 1 <= self.refresh_days <= 30:
            raise RuntimeError("AUTH_REFRESH_DAYS must be 1–30")


auth_settings = AuthSettings()
COOKIE_NAME = "stylesense_refresh"
COOKIE_PATH = "/api/v1/auth"
