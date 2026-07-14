"""Tests for the /auth endpoints (register, login, forgot_password)."""

import pytest


# ---------------------------------------------------------------------------
# register
# ---------------------------------------------------------------------------


def test_register_returns_access_token(register_user):
    response = register_user(username="SushiMan", password="C@tchM3!", name="Sushim Malla")

    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["access_token"]


def test_register_with_duplicate_username_fails(register_user):
    register_user(username="alice")

    response = register_user(username="alice")

    assert response.status_code == 400


def test_register_missing_password_returns_422(client):
    response = client.post(
        "/auth/register",
        json={"name": "Alice", "username": "alice"},
    )

    assert response.status_code == 422


def test_register_missing_username_returns_422(client):
    response = client.post(
        "/auth/register",
        json={"name": "Alice", "password": "Password123!"},
    )

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# login
# ---------------------------------------------------------------------------


def test_login_with_valid_credentials_returns_token(client, register_user):
    register_user(username="alice", password="Password123!")

    response = client.post(
        "/auth/login", json={"username": "alice", "password": "Password123!"}
    )

    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_with_nonexistent_username_fails(client):
    response = client.post(
        "/auth/login", json={"username": "ghost", "password": "whatever"}
    )

    assert response.status_code == 401


def test_login_with_invalid_password_fails(client, register_user):
    register_user(username="alice", password="Password123!")

    response = client.post(
        "/auth/login", json={"username": "alice", "password": "wrong-password"}
    )

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# token usage on protected routes
# ---------------------------------------------------------------------------


def test_access_token_allows_protected_route(client, auth_headers):
    headers = auth_headers()

    response = client.get("/interviews/interviews", headers=headers)

    assert response.status_code == 200


def test_protected_route_without_token_returns_401(client):
    response = client.get("/interviews/interviews")

    assert response.status_code == 401


def test_protected_route_with_invalid_token_returns_401(client):
    response = client.get(
        "/interviews/interviews", headers={"Authorization": "Bearer not-a-real-token"}
    )

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# forgot_password
# ---------------------------------------------------------------------------


def test_forgot_password_with_nonexistent_username_returns_404(client):
    response = client.put(
        "/auth/forgot_password", json={"username": "ghost", "password": "whatever"}
    )

    assert response.status_code == 404


@pytest.mark.skip(
    reason="forgot_password is a stub (api/routes/auth.py) that never returns a Token "
    "for an existing user yet; enable this once email/reset flow is implemented."
)
def test_forgot_password_with_existing_user_sends_reset(client, register_user):
    register_user(username="alice", password="Password123!")

    response = client.put(
        "/auth/forgot_password", json={"username": "alice", "password": "whatever"}
    )

    assert response.status_code == 200
