import json, re, secrets
from datetime import timedelta, datetime, UTC
from types import SimpleNamespace
import jwt, pytest
from app.models.account import (
    User,
    UserSession,
    EmailVerificationToken,
    PasswordResetToken,
    UserAddress,
    UserPreference,
    UserWishlistItem,
    CartItem,
    Notification,
    AuditLog,
    StaffInvitation,
    RateLimitBucket,
    utcnow,
)
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order
from app.core.auth_config import auth_settings, COOKIE_NAME, COOKIE_PATH
from app.api.routes.auth import create_account
from app.services.security import token_hash

PASSWORD = "StrongAuth2026!"


def registration(email="shopper@example.com", **changes):
    return {
        "full_name": "New Shopper",
        "email": email,
        "password": PASSWORD,
        "confirm_password": PASSWORD,
        "terms_accepted": True,
        **changes,
    }


def email_token(email, subject):
    messages = [json.loads(p.read_text()) for p in auth_settings.outbox.glob("*.json")]
    message = next(
        m for m in reversed(messages) if m["to"] == email and subject in m["subject"]
    )
    return re.search(r"#token=([A-Za-z0-9_-]+)", message["body"]).group(1)


def register_verify(client, email="shopper@example.com"):
    response = client.post("/api/v1/auth/register", json=registration(email))
    assert response.status_code == 201, response.text
    raw = email_token(email, "verification")
    verified = client.post("/api/v1/auth/verify-email", json={"token": raw})
    assert verified.status_code == 200, verified.text
    return raw


def login(client, email="shopper@example.com", password=PASSWORD, remember=False):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "remember_me": remember},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    client.headers["Authorization"] = "Bearer " + data["access_token"]
    client.headers["X-CSRF-Token"] = data["csrf_token"]
    return response, data


@pytest.fixture
def account_data(empty_client, db):
    db.add(
        Product(
            id=101,
            sku="AUTH-101",
            name="Auth cotton shirt",
            brand="Test",
            category="Shirts",
            colour="Blue",
            price=100,
            stock_quantity=20,
            sizes_available=["M", "L"],
            active=True,
        )
    )
    db.commit()
    return empty_client


def staff(db, client, role, email=None):
    email = email or role + "@example.com"
    user = create_account(db, role.title(), email, PASSWORD, role, verified=True)
    db.commit()
    response, data = login(client, email)
    return user, data


ADDRESS = {
    "full_name": "New Shopper",
    "phone": "9999999999",
    "address_line_1": "10 Market Street",
    "address_line_2": "Unit 3",
    "city": "Bengaluru",
    "state": "Karnataka",
    "postal_code": "560001",
    "country": "IN",
    "address_type": "home",
    "is_default": True,
}


def test_registration_verification_and_secure_storage(account_data, db):
    client = account_data
    response = client.post(
        "/api/v1/auth/register", json=registration("Shopper@EXAMPLE.com")
    )
    assert (
        response.status_code == 201
        and response.json()["delivery_status"] == "development_outbox"
    )
    user = db.query(User).one()
    assert user.email == "shopper@example.com" and user.role == "customer"
    assert (
        user.password_hash.startswith("$argon2id$")
        and PASSWORD not in user.password_hash
    )
    assert user.account_status == "pending_verification" and user.terms_accepted_at
    raw = email_token(user.email, "verification")
    assert db.query(EmailVerificationToken).one().token_hash == token_hash(raw)
    assert raw not in response.text and "password_hash" not in response.text
    rejected = client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": PASSWORD}
    )
    assert rejected.status_code == 401
    assert (
        client.post("/api/v1/auth/verify-email", json={"token": raw}).status_code == 200
    )
    assert (
        client.post("/api/v1/auth/verify-email", json={"token": raw}).status_code == 400
    )
    response, data = login(client)
    cookie = response.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=lax" in cookie and COOKIE_PATH in cookie
    session = db.query(UserSession).one()
    assert session.refresh_token_hash != response.cookies.get(COOKIE_NAME)
    assert "password_hash" not in client.get("/api/v1/auth/me").text
    assert client.get("/api/v1/auth/me").headers["cache-control"] == "no-store"


@pytest.mark.parametrize(
    "changes",
    [
        {"password": "short", "confirm_password": "short"},
        {"email": "bad-email"},
        {"confirm_password": "does-not-match"},
        {"terms_accepted": False},
        {"role": "admin"},
        {"account_status": "active"},
        {"full_name": " "},
    ],
)
def test_registration_rejects_invalid_and_escalating_input(empty_client, db, changes):
    response = empty_client.post("/api/v1/auth/register", json=registration(**changes))
    assert response.status_code == 422, response.text
    assert db.query(User).count() == 0
    assert all("input" not in detail for detail in response.json()["detail"])
    assert "StrongAuth2026!" not in response.text


def test_duplicate_email_normalized(empty_client):
    assert (
        empty_client.post("/api/v1/auth/register", json=registration()).status_code
        == 201
    )
    assert (
        empty_client.post(
            "/api/v1/auth/register", json=registration("SHOPPER@EXAMPLE.COM")
        ).status_code
        == 409
    )


def test_email_expiry_resend_and_invalid_token(empty_client, db):
    empty_client.post("/api/v1/auth/register", json=registration())
    raw = email_token("shopper@example.com", "verification")
    row = db.query(EmailVerificationToken).one()
    row.expires_at = utcnow() - timedelta(seconds=1)
    db.commit()
    assert (
        empty_client.post("/api/v1/auth/verify-email", json={"token": raw}).status_code
        == 400
    )
    assert (
        empty_client.post(
            "/api/v1/auth/verify-email", json={"token": "x" * 40}
        ).status_code
        == 400
    )
    a = empty_client.post(
        "/api/v1/auth/resend-verification", json={"email": "shopper@example.com"}
    )
    b = empty_client.post(
        "/api/v1/auth/resend-verification", json={"email": "missing@example.com"}
    )
    assert a.json() == b.json() and a.status_code == b.status_code == 200
    token = (
        db.query(EmailVerificationToken)
        .order_by(EmailVerificationToken.id.desc())
        .first()
    )
    messages = [json.loads(p.read_text()) for p in auth_settings.outbox.glob("*.json")]
    raw = next(
        re.search(r"#token=([A-Za-z0-9_-]+)", m["body"]).group(1)
        for m in messages
        if token_hash(re.search(r"#token=([A-Za-z0-9_-]+)", m["body"]).group(1))
        == token.token_hash
    )
    assert (
        empty_client.post("/api/v1/auth/verify-email", json={"token": raw}).status_code
        == 200
    )


@pytest.mark.parametrize("status", ["suspended", "deactivated"])
def test_inactive_accounts_rejected(empty_client, db, status):
    register_verify(empty_client)
    user = db.query(User).one()
    user.account_status = status
    db.commit()
    response = empty_client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": PASSWORD}
    )
    assert response.status_code == 401 and response.json()["detail"].startswith(
        "Unable to sign in"
    )


def test_login_rate_limit_persisted(empty_client, db):
    register_verify(empty_client)
    for _ in range(auth_settings.login_limit):
        assert (
            empty_client.post(
                "/api/v1/auth/login",
                json={"email": "shopper@example.com", "password": "incorrect"},
            ).status_code
            == 401
        )
    assert (
        empty_client.post(
            "/api/v1/auth/login",
            json={"email": "shopper@example.com", "password": PASSWORD},
        ).status_code
        == 429
    )
    db.query(RateLimitBucket).update({"expires_at": utcnow() - timedelta(seconds=1)})
    db.commit()
    login(empty_client)


@pytest.mark.parametrize(
    "route,data",
    [
        ("/auth/register", registration()),
        ("/auth/forgot-password", {"email": "someone@example.com"}),
    ],
)
def test_registration_and_reset_rate_limits(empty_client, db, route, data):
    from app.services.security import token_hash

    scope = "registration" if route.endswith("register") else "reset-ip"
    # HTTPX TestClient's source host is testclient.
    db.add(
        RateLimitBucket(
            key=token_hash(scope + ":testclient"),
            attempts=100,
            expires_at=utcnow() + timedelta(hours=1),
        )
    )
    db.commit()
    assert empty_client.post("/api/v1" + route, json=data).status_code == 429


def test_refresh_rotation_and_reuse_revokes_family(empty_client, db):
    register_verify(empty_client)
    response, data = login(empty_client, remember=True)
    old_raw = response.cookies.get(COOKIE_NAME)
    old_csrf = data["csrf_token"]
    old_access = data["access_token"]
    assert empty_client.get("/api/v1/auth/csrf").json()["csrf_token"] == old_csrf
    rotated = empty_client.post("/api/v1/auth/refresh")
    assert rotated.status_code == 200, rotated.text
    new_data = rotated.json()
    assert rotated.cookies.get(COOKIE_NAME) != old_raw
    assert (
        empty_client.get(
            "/api/v1/auth/me", headers={"Authorization": "Bearer " + old_access}
        ).status_code
        == 401
    )
    assert (
        empty_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer " + new_data["access_token"]},
        ).status_code
        == 200
    )
    empty_client.cookies.clear()
    empty_client.cookies.set(COOKIE_NAME, old_raw, path=COOKIE_PATH)
    reused = empty_client.post(
        "/api/v1/auth/refresh", headers={"X-CSRF-Token": old_csrf}
    )
    assert reused.status_code == 401
    assert (
        empty_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer " + new_data["access_token"]},
        ).status_code
        == 401
    )
    db.expire_all()
    assert all(s.revoked_at for s in db.query(UserSession).all())


@pytest.mark.parametrize(
    "headers",
    [
        {"Origin": "https://evil.example", "X-CSRF-Token": "bad"},
        {"X-CSRF-Token": "bad"},
        {"X-CSRF-Token": ""},
    ],
)
def test_refresh_csrf_and_origin(empty_client, headers):
    register_verify(empty_client)
    login(empty_client)
    assert empty_client.post("/api/v1/auth/refresh", headers=headers).status_code == 403


def test_expired_and_revoked_sessions(empty_client, db):
    register_verify(empty_client)
    _, data = login(empty_client)
    claims = jwt.decode(
        data["access_token"],
        auth_settings.secret,
        algorithms=["HS256"],
        audience="stylesense-web",
        issuer="stylesense",
    )
    claims["exp"] = datetime.now(UTC) - timedelta(seconds=1)
    expired = jwt.encode(claims, auth_settings.secret, algorithm="HS256")
    assert (
        empty_client.get(
            "/api/v1/auth/me", headers={"Authorization": "Bearer " + expired}
        ).status_code
        == 401
    )
    row = db.query(UserSession).one()
    row.expires_at = utcnow() - timedelta(seconds=1)
    db.commit()
    assert empty_client.post("/api/v1/auth/refresh").status_code == 401
    assert empty_client.get("/api/v1/auth/me").status_code == 401


def test_logout_and_logout_all(empty_client, db):
    register_verify(empty_client)
    _, first = login(empty_client)
    _, second = login(empty_client)
    assert len(empty_client.get("/api/v1/auth/sessions").json()) == 2
    assert empty_client.post("/api/v1/auth/logout-all").status_code == 200
    for token in [first["access_token"], second["access_token"]]:
        assert (
            empty_client.get(
                "/api/v1/auth/me", headers={"Authorization": "Bearer " + token}
            ).status_code
            == 401
        )
    _, third = login(empty_client)
    assert empty_client.post("/api/v1/auth/logout").status_code == 200
    assert empty_client.get("/api/v1/auth/me").status_code == 401


def test_session_revocation_and_cross_user_denial(empty_client, db):
    register_verify(empty_client)
    _, first = login(empty_client)
    first_sid = empty_client.get("/api/v1/auth/sessions").json()[0]["id"]
    register_verify(empty_client, "other@example.com")
    _, other = login(empty_client, "other@example.com")
    assert empty_client.delete("/api/v1/auth/sessions/" + first_sid).status_code == 404
    assert (
        empty_client.delete(
            "/api/v1/auth/sessions/" + first_sid,
            headers={"Authorization": "Bearer " + first["access_token"]},
        ).status_code
        == 200
    )
    assert (
        empty_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer " + first["access_token"]},
        ).status_code
        == 401
    )


def test_forgot_generic_reset_single_use_and_revocation(empty_client, db):
    register_verify(empty_client)
    _, data = login(empty_client)
    a = empty_client.post(
        "/api/v1/auth/forgot-password", json={"email": "shopper@example.com"}
    )
    b = empty_client.post(
        "/api/v1/auth/forgot-password", json={"email": "unknown@example.com"}
    )
    assert a.status_code == b.status_code == 200 and a.json() == b.json()
    raw = email_token("shopper@example.com", "password reset")
    assert db.query(PasswordResetToken).one().token_hash == token_hash(raw)
    new = "ChangedPassword2026!"
    payload = {"token": raw, "password": new, "confirm_password": new}
    assert (
        empty_client.post("/api/v1/auth/reset-password", json=payload).status_code
        == 200
    )
    assert (
        empty_client.post("/api/v1/auth/reset-password", json=payload).status_code
        == 400
    )
    assert empty_client.get("/api/v1/auth/me").status_code == 401
    assert (
        empty_client.post(
            "/api/v1/auth/login",
            json={"email": "shopper@example.com", "password": PASSWORD},
        ).status_code
        == 401
    )
    login(empty_client, password=new)


def test_invalid_and_expired_reset_tokens(empty_client, db):
    register_verify(empty_client)
    empty_client.post(
        "/api/v1/auth/forgot-password", json={"email": "shopper@example.com"}
    )
    raw = email_token("shopper@example.com", "password reset")
    db.query(PasswordResetToken).one().expires_at = utcnow() - timedelta(seconds=1)
    db.commit()
    for token in [raw, "x" * 40]:
        assert (
            empty_client.post(
                "/api/v1/auth/reset-password",
                json={
                    "token": token,
                    "password": PASSWORD,
                    "confirm_password": PASSWORD,
                },
            ).status_code
            == 400
        )


def test_change_password_requires_current_and_revokes_sessions(empty_client):
    register_verify(empty_client)
    login(empty_client)
    new = "AnotherPassword2026!"
    assert (
        empty_client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "wrong",
                "password": new,
                "confirm_password": new,
            },
        ).status_code
        == 400
    )
    assert (
        empty_client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": PASSWORD,
                "password": new,
                "confirm_password": new,
            },
        ).status_code
        == 200
    )
    assert empty_client.get("/api/v1/auth/me").status_code == 401
    login(empty_client, password=new)


@pytest.mark.parametrize(
    "role,allowed,denied",
    [
        (
            "customer",
            ["/users/me"],
            ["/analytics/overview", "/inventory", "/admin/users"],
        ),
        (
            "product_manager",
            [
                "/analytics/overview",
                "/segments",
                "/experiments",
                "/roadmap/tasks",
                "/releases",
            ],
            ["/inventory", "/admin/users"],
        ),
        (
            "operations_manager",
            ["/inventory", "/returns/overview", "/catalogue/quality", "/releases"],
            ["/analytics/overview", "/admin/users"],
        ),
        (
            "admin",
            ["/admin/users", "/admin/audit-logs", "/analytics/overview", "/inventory"],
            [],
        ),
    ],
)
def test_role_matrix_direct_api(account_data, db, role, allowed, denied):
    user, data = staff(db, account_data, role)
    for path in allowed:
        assert account_data.get("/api/v1" + path).status_code == 200, path
    for path in denied:
        assert account_data.get("/api/v1" + path).status_code == 403, path
    if role == "product_manager":
        assert (
            account_data.post(
                "/api/v1/releases", json={"name": "Forbidden", "version": "1"}
            ).status_code
            == 403
        )


@pytest.mark.parametrize(
    "path",
    [
        "/users/me",
        "/users/me/cart",
        "/users/me/wishlist",
        "/users/me/orders",
        "/analytics/overview",
        "/inventory",
        "/admin/users",
        "/wishlist/1",
    ],
)
def test_anonymous_protected_requests_are_rejected(empty_client, path):
    assert empty_client.get("/api/v1" + path).status_code == 401


def test_profiles_preferences_addresses_and_data_ownership(account_data, db):
    client = account_data
    register_verify(client)
    _, first = login(client)
    first_id = first["user"]["id"]
    customer = first["user"]["customer_id"]
    assert (
        client.patch(
            "/api/v1/users/me",
            json={"full_name": "Updated Shopper", "phone": "9999999999"},
        ).status_code
        == 200
    )
    preferences = client.patch(
        "/api/v1/users/me/preferences",
        json={
            "preferred_categories": ["Shirts"],
            "preferred_colours": ["Blue"],
            "budget_min": 100,
            "budget_max": 2000,
            "onboarding_completed": True,
        },
    )
    assert preferences.status_code == 200 and preferences.json()["onboarding_completed"]
    db.expire_all()
    assert db.get(Customer, customer).preferred_categories == ["Shirts"]
    address = client.post("/api/v1/users/me/addresses", json=ADDRESS)
    assert address.status_code == 201, address.text
    address_id = address.json()["id"]
    assert (
        client.patch(
            f"/api/v1/users/me/addresses/{address_id}", json={"city": "Mumbai"}
        ).json()["city"]
        == "Mumbai"
    )
    assert client.put("/api/v1/users/me/wishlist/101").status_code == 200
    assert client.put("/api/v1/users/me/wishlist/101").status_code == 200
    assert db.query(UserWishlistItem).count() == 1
    merge = {
        "merge_key": "guest-merge-123",
        "items": [{"product_id": 101, "selected_size": "M", "quantity": 2}],
    }
    assert client.post("/api/v1/users/me/cart/merge", json=merge).status_code == 200
    assert (
        client.post("/api/v1/users/me/cart/merge", json=merge).json()["items"][0][
            "quantity"
        ]
        == 2
    )
    assert (
        client.put(
            "/api/v1/users/me/cart/items",
            json={"product_id": 101, "selected_size": "M", "quantity": 3},
        ).json()["total"]
        == 300
    )
    order = client.post(
        "/api/v1/users/me/checkout",
        json={"idempotency_key": "account-checkout-001", "address_id": address_id},
    )
    assert order.status_code == 200, order.text
    order_id = order.json()["id"]
    assert order.json()["address"]["city"] == "Mumbai"
    assert client.get("/api/v1/users/me/cart").json()["items"] == []
    assert (
        client.post(
            "/api/v1/users/me/checkout",
            json={"idempotency_key": "account-checkout-001", "address_id": address_id},
        ).json()["id"]
        == order_id
    )
    assert client.get("/api/v1/users/me/orders").json()["total"] == 1
    assert client.post(f"/api/v1/users/me/orders/{order_id}/cancel").status_code == 409
    notification = client.get("/api/v1/users/me/notifications").json()["items"][0]["id"]
    register_verify(client, "other@example.com")
    _, other = login(client, "other@example.com")
    assert client.get("/api/v1/users/me/orders").json()["items"] == []
    assert client.get("/api/v1/users/me/wishlist").json() == []
    assert client.get("/api/v1/users/me/addresses").json() == []
    assert client.get(f"/api/v1/users/me/orders/{order_id}").status_code == 404
    assert (
        client.patch(
            f"/api/v1/users/me/addresses/{address_id}", json={"city": "Stolen"}
        ).status_code
        == 404
    )
    assert client.delete(f"/api/v1/users/me/addresses/{address_id}").status_code == 404
    assert (
        client.patch(f"/api/v1/users/me/notifications/{notification}/read").status_code
        == 404
    )
    assert client.get(f"/api/v1/wishlist/{customer}").status_code == 403
    assert (
        client.post(
            "/api/v1/users/me/checkout",
            json={"idempotency_key": "steal-order-001", "address_id": address_id},
        ).status_code
        == 404
    )
    assert (
        client.post(
            "/api/v1/orders",
            json={
                "customer_id": customer,
                "address_id": address_id,
                "session_id": "steal",
                "idempotency_key": "steal-order-002",
                "items": [{"product_id": 101, "selected_size": "M", "quantity": 1}],
            },
        ).status_code
        == 403
    )
    assert (
        client.patch(
            "/api/v1/users/me/preferences", json={"budget_min": 9999, "budget_max": 1}
        ).status_code
        == 422
    )
    client.headers["Authorization"] = "Bearer " + first["access_token"]
    assert client.get("/api/v1/users/me/orders").json()["items"][0]["id"] == order_id
    assert client.get("/api/v1/users/me/wishlist").json()[0]["id"] == 101
    assert client.patch("/api/v1/users/me/notifications/read-all").status_code == 200
    assert client.get("/api/v1/users/me/notifications").json()["unread_count"] == 0


def test_admin_status_roles_invitations_and_audit(account_data, db):
    client = account_data
    admin, auth = staff(db, client, "admin")
    assert (
        client.patch(
            f"/api/v1/admin/users/{admin.id}/role", json={"role": "customer"}
        ).status_code
        == 403
    )
    assert (
        client.patch(
            f"/api/v1/admin/users/{admin.id}/status", json={"status": "deactivated"}
        ).status_code
        == 403
    )
    customer = create_account(
        db, "Customer", "customer@example.com", PASSWORD, verified=True
    )
    db.commit()
    assert client.get("/api/v1/admin/users?role=customer").json()["total"] == 1
    assert (
        client.patch(
            f"/api/v1/admin/users/{customer.id}/status", json={"status": "suspended"}
        ).json()["account_status"]
        == "suspended"
    )
    assert (
        client.patch(
            f"/api/v1/admin/users/{customer.id}/status", json={"status": "active"}
        ).status_code
        == 200
    )
    assert (
        client.patch(
            f"/api/v1/admin/users/{customer.id}/role", json={"role": "product_manager"}
        ).json()["role"]
        == "product_manager"
    )
    response = client.post(
        "/api/v1/admin/invitations",
        json={"email": "newstaff@example.com", "role": "operations_manager"},
    )
    assert (
        response.status_code == 201
        and response.json()["delivery_status"] == "development_outbox"
    )
    raw = email_token("newstaff@example.com", "invitation")
    assert raw not in response.text
    invitation_id = response.json()["id"]
    row = db.get(StaffInvitation, invitation_id)
    assert row.token_hash == token_hash(raw)
    accepted = client.post(
        "/api/v1/auth/accept-invitation",
        json={
            "token": raw,
            "full_name": "New Operations",
            "password": PASSWORD,
            "confirm_password": PASSWORD,
        },
    )
    assert accepted.status_code == 201, accepted.text
    assert (
        client.post(
            "/api/v1/auth/accept-invitation",
            json={
                "token": raw,
                "full_name": "Again",
                "password": PASSWORD,
                "confirm_password": PASSWORD,
            },
        ).status_code
        == 400
    )
    assert (
        client.delete(f"/api/v1/admin/invitations/{invitation_id}").status_code == 409
    )
    assert (
        client.patch(
            "/api/v1/admin/settings",
            json={"registration_enabled": False, "maintenance_notice": "Demo update"},
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/v1/auth/register", json=registration("blocked@example.com")
        ).status_code
        == 403
    )
    logs = client.get("/api/v1/admin/audit-logs").text
    assert "admin.role_changed" in logs and PASSWORD not in logs and raw not in logs
    login(client, "newstaff@example.com")
    assert (
        client.get("/api/v1/inventory").status_code == 200
        and client.get("/api/v1/admin/users").status_code == 403
    )


def test_invalid_signature_and_role_claim_never_grant_access(empty_client, db):
    register_verify(empty_client)
    _, data = login(empty_client)
    claims = jwt.decode(
        data["access_token"],
        auth_settings.secret,
        algorithms=["HS256"],
        audience="stylesense-web",
        issuer="stylesense",
    )
    claims["role"] = "admin"
    spoofed = jwt.encode(claims, auth_settings.secret, algorithm="HS256")
    assert (
        empty_client.get(
            "/api/v1/admin/users", headers={"Authorization": "Bearer " + spoofed}
        ).status_code
        == 403
    )
    invalid = jwt.encode(
        claims, "not-the-server-secret-key-at-all-123456", algorithm="HS256"
    )
    assert (
        empty_client.get(
            "/api/v1/auth/me", headers={"Authorization": "Bearer " + invalid}
        ).status_code
        == 401
    )
    db.query(User).one().account_status = "suspended"
    db.commit()
    assert empty_client.get("/api/v1/auth/me").status_code == 401
    assert empty_client.post("/api/v1/auth/refresh").status_code == 401


def test_missing_origin_and_cookie_do_not_refresh(empty_client):
    register_verify(empty_client)
    login(empty_client)
    empty_client.headers.pop("Origin")
    assert empty_client.post("/api/v1/auth/refresh").status_code == 403
    empty_client.headers["Origin"] = "http://127.0.0.1:5173"
    empty_client.cookies.clear()
    assert empty_client.post("/api/v1/auth/refresh").status_code == 401


def test_session_listing_never_exposes_token_material(empty_client):
    register_verify(empty_client)
    response, data = login(empty_client)
    listing = empty_client.get("/api/v1/auth/sessions").text
    assert (
        response.cookies.get(COOKIE_NAME) not in listing
        and data["access_token"] not in listing
    )
    assert "hash" not in listing and "csrf" not in listing


def test_expired_revoked_and_replaced_invitations(account_data, db):
    client = account_data
    staff(db, client, "admin")
    first = client.post(
        "/api/v1/admin/invitations",
        json={"email": "expired@example.com", "role": "product_manager"},
    ).json()
    raw = email_token("expired@example.com", "invitation")
    db.get(StaffInvitation, first["id"]).expires_at = utcnow() - timedelta(seconds=1)
    db.commit()
    data = {
        "token": raw,
        "full_name": "Expired Staff",
        "password": PASSWORD,
        "confirm_password": PASSWORD,
    }
    assert client.post("/api/v1/auth/accept-invitation", json=data).status_code == 400
    second = client.post(
        "/api/v1/admin/invitations",
        json={"email": "revoked@example.com", "role": "product_manager"},
    ).json()
    raw = email_token("revoked@example.com", "invitation")
    assert client.delete(f"/api/v1/admin/invitations/{second['id']}").status_code == 200
    assert (
        client.post(
            "/api/v1/auth/accept-invitation", json={**data, "token": raw}
        ).status_code
        == 400
    )


def test_default_address_is_unique_and_private(account_data, db):
    client = account_data
    register_verify(client)
    login(client)
    first = client.post("/api/v1/users/me/addresses", json=ADDRESS).json()
    second = client.post(
        "/api/v1/users/me/addresses",
        json={**ADDRESS, "address_line_1": "20 Another Street"},
    ).json()
    listing = client.get("/api/v1/users/me/addresses").json()
    assert sum(a["is_default"] for a in listing) == 1
    assert (
        client.patch(
            f"/api/v1/users/me/addresses/{first['id']}", json={"is_default": True}
        ).status_code
        == 200
    )
    assert client.delete(f"/api/v1/users/me/addresses/{first['id']}").status_code == 200
    assert client.get("/api/v1/users/me/addresses").json()[0]["is_default"] is True
    assert (
        client.patch(
            f"/api/v1/users/me/addresses/{second['id']}", json={"city": None}
        ).status_code
        == 422
    )


def test_safe_avatar_validation(account_data):
    import io
    from PIL import Image

    client = account_data
    register_verify(client)
    login(client)
    assert (
        client.post(
            "/api/v1/users/me/avatar",
            files={"file": ("../../bad.jpg", b"not an image", "image/jpeg")},
        ).status_code
        == 422
    )
    content = io.BytesIO()
    Image.new("RGB", (10, 10), "blue").save(content, "PNG")
    response = client.post(
        "/api/v1/users/me/avatar",
        files={"file": ("../../photo.png", content.getvalue(), "image/png")},
    )
    assert response.status_code == 200 and re.fullmatch(
        r"/uploads/avatars/[0-9a-f]{32}\.png", response.json()["avatar_url"]
    )


def test_simulated_payment_failure_rolls_back_order_cart_stock(
    account_data, db, monkeypatch
):
    from app.services.payments import Authorization

    client = account_data
    register_verify(client)
    login(client)
    address = client.post("/api/v1/users/me/addresses", json=ADDRESS).json()
    client.put(
        "/api/v1/users/me/cart/items",
        json={"product_id": 101, "quantity": 2, "selected_size": "M"},
    )

    class FailedProvider:
        def authorize(self, *args):
            return Authorization(False, "test-declined")

    monkeypatch.setattr(
        "app.services.payments.get_payment_provider", lambda: FailedProvider()
    )
    response = client.post(
        "/api/v1/users/me/checkout",
        json={"idempotency_key": "declined-request-001", "address_id": address["id"]},
    )
    assert response.status_code == 402
    db.expire_all()
    assert db.query(Order).count() == 0 and db.get(Product, 101).stock_quantity == 20
    assert client.get("/api/v1/users/me/cart").json()["items"][0]["quantity"] == 2


def test_server_cart_quantity_updates_owner_and_empty_checkout(account_data, db):
    client = account_data
    register_verify(client)
    _, first = login(client)
    item = client.put(
        "/api/v1/users/me/cart/items",
        json={"product_id": 101, "quantity": 2, "selected_size": "M"},
    ).json()["items"][0]
    assert (
        client.patch(
            f"/api/v1/users/me/cart/items/{item['id']}", json={"quantity": 3}
        ).json()["total"]
        == 300
    )
    assert (
        client.put(
            "/api/v1/users/me/cart/items",
            json={"product_id": 101, "quantity": 0, "selected_size": "M"},
        ).status_code
        == 422
    )
    register_verify(client, "other@example.com")
    login(client, "other@example.com")
    assert (
        client.patch(
            f"/api/v1/users/me/cart/items/{item['id']}", json={"quantity": 1}
        ).status_code
        == 404
    )
    assert client.delete(f"/api/v1/users/me/cart/items/{item['id']}").status_code == 404


def test_demo_seed_requires_opt_in_and_never_production(
    empty_client, db, db_engine, monkeypatch
):
    from app.seed_accounts import seed_accounts, ROLES
    from sqlalchemy.orm import sessionmaker

    with pytest.raises(RuntimeError, match="explicitly"):
        seed_accounts(sessionmaker(bind=db_engine))
    monkeypatch.setattr(auth_settings, "demo_enabled", True)
    with pytest.raises(RuntimeError, match="PASSWORD"):
        seed_accounts(sessionmaker(bind=db_engine))
    for role in ROLES:
        monkeypatch.setenv("DEMO_" + role.upper() + "_PASSWORD", PASSWORD)
    seed_accounts(sessionmaker(bind=db_engine))
    assert db.query(User).count() == 4
    seed_accounts(sessionmaker(bind=db_engine))
    assert db.query(User).count() == 4
    monkeypatch.setattr(auth_settings, "environment", "production")
    with pytest.raises(RuntimeError, match="production"):
        seed_accounts(sessionmaker(bind=db_engine))


def test_production_refuses_development_configuration(monkeypatch):
    from app.core.auth_config import AuthSettings

    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("AUTH_SECRET_KEY", raising=False)
    with pytest.raises(RuntimeError, match="AUTH_SECRET_KEY"):
        AuthSettings()
    monkeypatch.setenv("AUTH_SECRET_KEY", secrets.token_urlsafe(48))
    with pytest.raises(RuntimeError, match="COOKIE_SECURE"):
        AuthSettings()
    monkeypatch.setenv("AUTH_COOKIE_SECURE", "true")
    with pytest.raises(RuntimeError, match="SMTP"):
        AuthSettings()


def test_concurrent_refresh_reuse_revokes_every_descendant(empty_client, db):
    from concurrent.futures import ThreadPoolExecutor
    from fastapi.testclient import TestClient
    from app.main import app

    register_verify(empty_client)
    response, data = login(empty_client)
    raw = response.cookies.get(COOKIE_NAME)

    def refresh_once(_):
        with TestClient(app, raise_server_exceptions=False) as peer:
            peer.cookies.set(COOKIE_NAME, raw, path=COOKIE_PATH)
            return peer.post(
                "/api/v1/auth/refresh",
                headers={
                    "Origin": "http://127.0.0.1:5173",
                    "X-CSRF-Token": data["csrf_token"],
                },
            ).status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses = list(pool.map(refresh_once, range(2)))
    assert sorted(statuses) == [200, 401]
    db.expire_all()
    assert db.query(UserSession).filter(UserSession.revoked_at.is_(None)).count() == 0


def test_concurrent_admin_deactivation_retains_active_administrator(empty_client, db):
    from concurrent.futures import ThreadPoolExecutor
    from fastapi.testclient import TestClient
    from app.main import app

    first, one = staff(db, empty_client, "admin", "first-admin@example.com")
    second, two = staff(db, empty_client, "admin", "second-admin@example.com")

    def deactivate(entry):
        auth, target = entry
        with TestClient(app, raise_server_exceptions=False) as peer:
            return peer.patch(
                f"/api/v1/admin/users/{target}/status",
                json={"status": "deactivated"},
                headers={
                    "Origin": "http://127.0.0.1:5173",
                    "Authorization": "Bearer " + auth["access_token"],
                },
            ).status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses = list(pool.map(deactivate, [(one, second.id), (two, first.id)]))
    assert statuses.count(200) == 1 and all(s in [200, 401, 403, 409] for s in statuses)
    db.expire_all()
    assert db.query(User).filter_by(role="admin", account_status="active").count() == 1


def test_pending_cancellation_restores_reserved_stock_exactly_once(account_data, db):
    client = account_data
    register_verify(client)
    login(client)
    address = client.post("/api/v1/users/me/addresses", json=ADDRESS).json()["id"]
    client.put(
        "/api/v1/users/me/cart/items",
        json={"product_id": 101, "selected_size": "M", "quantity": 2},
    )
    placed = client.post(
        "/api/v1/users/me/checkout",
        json={"idempotency_key": "cancel-pending-001", "address_id": address},
    )
    assert placed.status_code == 200
    order_id = placed.json()["id"]
    db.expire_all()
    order = db.get(Order, order_id)
    order.status = "PENDING"
    db.commit()
    assert db.get(Product, 101).stock_quantity == 18
    assert client.post(f"/api/v1/users/me/orders/{order_id}/cancel").status_code == 200
    assert client.post(f"/api/v1/users/me/orders/{order_id}/cancel").status_code == 409
    db.expire_all()
    assert db.get(Product, 101).stock_quantity == 20
    assert not db.get(Order, order_id).stock_reserved


def test_former_customer_cannot_bypass_new_role_using_legacy_routes(account_data, db):
    client = account_data
    register_verify(client)
    _, customer_auth = login(client)
    user_id = customer_auth["user"]["id"]
    customer_id = customer_auth["user"]["customer_id"]
    address = client.post("/api/v1/users/me/addresses", json=ADDRESS).json()["id"]
    staff(db, client, "admin")
    assert (
        client.patch(
            f"/api/v1/admin/users/{user_id}/role", json={"role": "product_manager"}
        ).status_code
        == 200
    )
    login(client)
    payload = {
        "customer_id": customer_id,
        "address_id": address,
        "idempotency_key": "former-customer-role-001",
        "items": [{"product_id": 101, "selected_size": "M", "quantity": 1}],
    }
    assert client.post("/api/v1/orders", json=payload).status_code == 403
    assert client.get(f"/api/v1/recommendations/{customer_id}").status_code == 403
    assert (
        client.get(
            f"/api/v1/recommendations/{customer_id}/complete-look?product_id=101"
        ).status_code
        == 403
    )
    assert client.get("/api/v1/users/me/cart").status_code == 403
    assert client.get("/api/v1/recommendations/0").status_code == 200
    assert db.query(Order).count() == 0
