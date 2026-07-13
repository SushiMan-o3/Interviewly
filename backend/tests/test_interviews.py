"""Tests for the /interviews endpoints (auth required for all of them)."""


def make_interview_payload(**overrides):
    payload = {
        "company": "Acme",
        "role": "Backend Engineer",
        "interview_type": "technical",
        "difficulty": "medium",
        "planned_duration": 30,
    }
    payload.update(overrides)
    return payload


def create_interview(client, headers, **overrides):
    return client.post(
        "/interviews/create_interview",
        json=make_interview_payload(**overrides),
        headers=headers,
    )


# ---------------------------------------------------------------------------
# GET /interviews/interviews (list)
# ---------------------------------------------------------------------------


def test_get_interviews_requires_auth(client):
    response = client.get("/interviews/interviews")

    assert response.status_code == 401


def test_get_interviews_empty_when_none_created(client, auth_headers):
    headers = auth_headers()

    response = client.get("/interviews/interviews", headers=headers)

    assert response.status_code == 200
    assert response.json() == []


def test_get_interviews_returns_created_interviews(client, auth_headers):
    headers = auth_headers()
    for company in ("Acme", "Globex", "Initech"):
        create_interview(client, headers, company=company)

    response = client.get("/interviews/interviews", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 3
    assert [interview["company"] for interview in body] == ["Acme", "Globex", "Initech"]


def test_get_interviews_default_limit_is_6(client, auth_headers):
    headers = auth_headers()
    for i in range(8):
        create_interview(client, headers, company=f"Company {i}")

    response = client.get("/interviews/interviews", headers=headers)

    assert response.status_code == 200
    assert len(response.json()) == 6


def test_get_interviews_respects_custom_limit_and_skip(client, auth_headers):
    headers = auth_headers()
    for i in range(5):
        create_interview(client, headers, company=f"Company {i}")

    response = client.get(
        "/interviews/interviews", params={"skip": 2, "limit": 2}, headers=headers
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert [interview["company"] for interview in body] == ["Company 2", "Company 3"]


def test_get_interviews_only_returns_current_users_interviews(client, auth_headers):
    alice_headers = auth_headers(username="alice")
    bob_headers = auth_headers(username="bob")
    create_interview(client, alice_headers, company="Alice's Interview")
    create_interview(client, bob_headers, company="Bob's Interview")

    response = client.get("/interviews/interviews", headers=alice_headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["company"] == "Alice's Interview"


# ---------------------------------------------------------------------------
# GET /interviews/{interview_id}
# ---------------------------------------------------------------------------


def test_get_interview_by_id_success(client, auth_headers):
    headers = auth_headers()
    created = create_interview(client, headers).json()

    response = client.get(f"/interviews/{created['id']}", headers=headers)

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]
    assert response.json()["company"] == "Acme"


def test_get_interview_with_nonexistent_id_returns_404(client, auth_headers):
    headers = auth_headers()

    response = client.get("/interviews/999999", headers=headers)

    assert response.status_code == 404


def test_get_interview_owned_by_another_user_returns_404(client, auth_headers):
    alice_headers = auth_headers(username="alice")
    bob_headers = auth_headers(username="bob")
    alice_interview = create_interview(client, alice_headers).json()

    response = client.get(f"/interviews/{alice_interview['id']}", headers=bob_headers)

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# POST /interviews/create_interview
# ---------------------------------------------------------------------------


def test_create_interview_success(client, auth_headers):
    headers = auth_headers()

    response = create_interview(client, headers)

    assert response.status_code == 200
    body = response.json()
    assert body["company"] == "Acme"
    assert body["role"] == "Backend Engineer"
    assert body["completed"] is False
    assert body["questions"] == []


def test_create_interview_requires_auth(client):
    response = client.post(
        "/interviews/create_interview", json=make_interview_payload()
    )

    assert response.status_code == 401


def test_create_interview_missing_field_returns_422(client, auth_headers):
    headers = auth_headers()
    payload = make_interview_payload()
    del payload["company"]

    response = client.post(
        "/interviews/create_interview", json=payload, headers=headers
    )

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# DELETE /interviews/{interview_id}
# ---------------------------------------------------------------------------


def test_delete_interview_success(client, auth_headers):
    headers = auth_headers()
    created = create_interview(client, headers).json()

    response = client.delete(f"/interviews/{created['id']}", headers=headers)
    assert response.status_code == 204

    get_response = client.get(f"/interviews/{created['id']}", headers=headers)
    assert get_response.status_code == 404


def test_delete_interview_with_nonexistent_id_returns_404(client, auth_headers):
    headers = auth_headers()

    response = client.delete("/interviews/999999", headers=headers)

    assert response.status_code == 404


def test_delete_interview_owned_by_another_user_returns_404(client, auth_headers):
    alice_headers = auth_headers(username="alice")
    bob_headers = auth_headers(username="bob")
    alice_interview = create_interview(client, alice_headers).json()

    response = client.delete(
        f"/interviews/{alice_interview['id']}", headers=bob_headers
    )
    assert response.status_code == 404

    still_there = client.get(
        f"/interviews/{alice_interview['id']}", headers=alice_headers
    )
    assert still_there.status_code == 200
