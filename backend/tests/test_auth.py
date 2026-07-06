REGISTER_PAYLOAD = {"name": "Sushim Malla", "username": "SushiMan", "password": "C@tCtth3mH@nd$"}


def test_register_creates_user_and_returns_token(client):
    response = client.post("/auth/register", json=REGISTER_PAYLOAD)
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_register_rejects_duplicate_username(client):
    client.post("/auth/register", json=REGISTER_PAYLOAD)
    response = client.post("/auth/register", json=REGISTER_PAYLOAD)
    assert response.status_code == 400


def test_login_with_correct_password_returns_token(client):
    client.post("/auth/register", json=REGISTER_PAYLOAD)
    response = client.post(
        "/auth/login", json={"username": "sushi", "password": "hunter2"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_with_wrong_password_is_rejected(client):
    client.post("/auth/register", json=REGISTER_PAYLOAD)
    response = client.post(
        "/auth/login", json={"username": "sushi", "password": "wrong"}
    )
    assert response.status_code == 401


def test_me_requires_a_token(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user_with_valid_token(client):
    register = client.post("/auth/register", json=REGISTER_PAYLOAD)
    token = register.json()["access_token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["username"] == "sushi"


def test_me_rejects_garbage_token(client):
    response = client.get(
        "/auth/me", headers={"Authorization": "Bearer garbage.token.here"}
    )
    assert response.status_code == 401
