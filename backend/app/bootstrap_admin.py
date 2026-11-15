"""Operator-only first-admin creation; email verification is required, including production."""

import os
from app.db.session import SessionLocal
from app.models.account import User, EmailVerificationToken
from app.api.routes.auth import create_account, mint, deliver_link
from app.services.security import record_audit
from email_validator import validate_email


def main():
    email = validate_email(
        os.environ["ADMIN_EMAIL"], check_deliverability=False
    ).normalized.casefold()
    password = os.environ["ADMIN_PASSWORD"]
    with SessionLocal() as db:
        if db.query(User).filter_by(role="admin").first():
            raise RuntimeError(
                "An administrator already exists; use authenticated staff invitations"
            )
        if db.query(User).filter_by(email=email).first():
            raise RuntimeError(
                "Email already belongs to an account; no automatic promotion is allowed"
            )
        user = create_account(
            db,
            os.getenv("ADMIN_FULL_NAME", "StyleSense Administrator"),
            email,
            password,
            role="admin",
            verified=False,
        )
        raw = mint(db, user, EmailVerificationToken, 24)
        record_audit(db, user, "account.admin_bootstrapped")
        db.commit()
        status = deliver_link(user, raw, "verification")
        print("Administrator pending email verification. Delivery status:", status)


if __name__ == "__main__":
    main()
