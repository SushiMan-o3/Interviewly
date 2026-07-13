import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from api.app import app
from api.database import Base, get_db


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    app.state.testing_session_local = TestingSessionLocal
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def db_session(client):
    session = client.app.state.testing_session_local()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def register_user(client):
    """Factory fixture: register_user(username="alice") -> Response from /auth/register."""

    def _register(username="testuser", password="Password123!", name="Test User"):
        return client.post(
            "/auth/register",
            json={"name": name, "username": username, "password": password},
        )

    return _register


@pytest.fixture()
def auth_headers(register_user):
    """Factory fixture: auth_headers() -> {"Authorization": "Bearer <token>"} for a freshly registered user."""

    def _auth_headers(username="testuser", password="Password123!", name="Test User"):
        response = register_user(username=username, password=password, name=name)
        assert response.status_code == 200, response.text
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _auth_headers
