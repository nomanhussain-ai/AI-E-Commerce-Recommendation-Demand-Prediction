import pytest


async def _register(client, email="user@example.com", password="secret123", name="Jane Doe"):
    return await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": name},
    )


async def test_register_returns_token_pair_and_user(client):
    resp = await _register(client)
    assert resp.status_code == 201
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"] and body["refresh_token"]
    assert body["user"]["email"] == "user@example.com"
    assert body["user"]["role"] == "customer"


async def test_register_rejects_duplicate_email(client):
    await _register(client)
    resp = await _register(client)
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "CONFLICT"


async def test_login_success_and_wrong_password(client):
    await _register(client, email="a@b.com")

    ok = await client.post("/api/v1/auth/login", json={"email": "a@b.com", "password": "secret123"})
    assert ok.status_code == 200

    bad = await client.post("/api/v1/auth/login", json={"email": "a@b.com", "password": "nope"})
    assert bad.status_code == 401
    assert bad.json()["error"]["code"] == "UNAUTHENTICATED"


async def test_me_requires_bearer_token(client):
    anon = await client.get("/api/v1/auth/me")
    assert anon.status_code == 401

    tokens = (await _register(client)).json()
    resp = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == "user@example.com"


async def test_refresh_rotates_and_old_token_is_rejected(client):
    tokens = (await _register(client)).json()
    old_refresh = tokens["refresh_token"]

    first = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert first.status_code == 200
    assert first.json()["refresh_token"] != old_refresh

    reuse = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert reuse.status_code == 401


async def test_forgot_then_reset_password_flow(client):
    await _register(client, email="reset@example.com")

    forgot = await client.post(
        "/api/v1/auth/forgot-password", json={"email": "reset@example.com"}
    )
    assert forgot.status_code == 200
    token = forgot.json()["debug_reset_token"]

    done = await client.post(
        "/api/v1/auth/reset-password", json={"token": token, "password": "brandnew123"}
    )
    assert done.status_code == 204

    old = await client.post(
        "/api/v1/auth/login", json={"email": "reset@example.com", "password": "secret123"}
    )
    assert old.status_code == 401
    new = await client.post(
        "/api/v1/auth/login", json={"email": "reset@example.com", "password": "brandnew123"}
    )
    assert new.status_code == 200


async def test_forgot_password_hides_unknown_email(client):
    resp = await client.post(
        "/api/v1/auth/forgot-password", json={"email": "ghost@example.com"}
    )
    assert resp.status_code == 200
    assert "debug_reset_token" not in resp.json()


@pytest.mark.parametrize("password", ["short", "1234567"])
async def test_register_rejects_weak_password(client, password):
    resp = await _register(client, password=password)
    assert resp.status_code == 422
