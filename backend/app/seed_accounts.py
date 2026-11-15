"""Explicit opt-in development users. Never seeds accounts in production."""

import os
from app.db.session import SessionLocal
from app.core.auth_config import auth_settings
from app.models.account import User
from app.api.routes.auth import create_account
from app.services.security import password_valid, record_audit

ROLES = ["customer", "product_manager", "operations_manager", "admin"]


def seed_accounts(session_factory=SessionLocal):
    if auth_settings.environment == "production":
        raise RuntimeError("Demo accounts cannot be seeded in production")
    if not auth_settings.demo_enabled:
        raise RuntimeError(
            "Set SEED_DEMO_ACCOUNTS=true explicitly to create development accounts"
        )
    entries = []
    for role in ROLES:
        prefix = "DEMO_" + role.upper()
        email = (
            os.getenv(prefix + "_EMAIL", role + "@stylesense.example.com")
            .strip()
            .casefold()
        )
        password = os.getenv(prefix + "_PASSWORD", "")
        if not password_valid(password):
            raise RuntimeError(
                f"{prefix}_PASSWORD must be supplied and satisfy the password policy"
            )
        entries.append((role, email, password))
    if len({email for _, email, _ in entries}) != len(entries):
        raise RuntimeError("Demo emails must be distinct")
    with session_factory() as db:
        for role, email, password in entries:
            existing = db.query(User).filter_by(email=email).first()
            if existing:
                if existing.role != role:
                    raise RuntimeError(
                        "Existing demo email has a different role; no automatic role changes are allowed"
                    )
                continue
            user = create_account(
                db,
                "Demo " + role.replace("_", " ").title(),
                email,
                password,
                role=role,
                verified=True,
            )
            record_audit(db, user, "development.demo_account_created")
        db.commit()
    print(
        "Development accounts ready. Passwords were read from environment and are not printed."
    )


if __name__ == "__main__":
    seed_accounts()
