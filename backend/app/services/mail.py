"""Development filesystem outbox or explicitly configured SMTP; never log message tokens."""

import json, os, secrets, smtplib, ssl
from email.message import EmailMessage
from datetime import datetime, timezone
from app.core.auth_config import auth_settings


def deliver(to, subject, body):
    if auth_settings.email_mode == "outbox":
        if auth_settings.environment == "production":
            raise RuntimeError("Development outbox forbidden in production")
        auth_settings.outbox.mkdir(mode=0o700, parents=True, exist_ok=True)
        path = auth_settings.outbox / (secrets.token_hex(16) + ".json")
        descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "w") as file:
            json.dump(
                {
                    "to": to,
                    "subject": subject,
                    "body": body,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
                file,
            )
        return "development_outbox"
    host = os.getenv("SMTP_HOST")
    if not host:
        raise RuntimeError("SMTP is not configured")
    message = EmailMessage()
    message["From"] = os.getenv("SMTP_FROM", "noreply@stylesense.example.com")
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    port = int(os.getenv("SMTP_PORT", "587"))
    if port == 465:
        connection = smtplib.SMTP_SSL(
            host, port, context=ssl.create_default_context(), timeout=10
        )
    else:
        connection = smtplib.SMTP(host, port, timeout=10)
        connection.starttls(context=ssl.create_default_context())
    with connection:
        if os.getenv("SMTP_USERNAME"):
            connection.login(
                os.environ["SMTP_USERNAME"], os.getenv("SMTP_PASSWORD", "")
            )
        connection.send_message(message)
    return "smtp_accepted"
