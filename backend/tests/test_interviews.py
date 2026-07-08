from api.models import Question as QuestionModel
from api.models import Response as ResponseModel

USER_A = {"name": "Alice A", "username": "alice", "password": "C@tCtth3mH@nd$"}
USER_B = {"name": "Bob B", "username": "bob", "password": "C@tCtth3mH@nd$"}

INTERVIEW_PAYLOAD = {
    "company": "Acme",
    "role": "Software Engineer",
    "interview_type": "technical",
    "difficulty": "medium",
    "planned_duration": 45,
}


def register(client, payload=USER_A):
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 200
    return response.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def create_interview(client, token, **overrides):
    payload = {**INTERVIEW_PAYLOAD, **overrides}
    response = client.post("/interviews/create_interview", json=payload, headers=auth_headers(token))
    assert response.status_code == 200
    return response.json()


# --- create_interview ---------------------------------------------------


def test_create_interview_requires_auth(client):
    response = client.post("/interviews/create_interview", json=INTERVIEW_PAYLOAD)
    assert response.status_code == 401


def test_create_interview_returns_full_interview(client):
    token = register(client)
    response = client.post(
        "/interviews/create_interview", json=INTERVIEW_PAYLOAD, headers=auth_headers(token)
    )
    assert response.status_code == 200
    body = response.json()

    assert body["company"] == INTERVIEW_PAYLOAD["company"]
    assert body["role"] == INTERVIEW_PAYLOAD["role"]
    assert body["interview_type"] == INTERVIEW_PAYLOAD["interview_type"]
    assert body["difficulty"] == INTERVIEW_PAYLOAD["difficulty"]
    assert body["planned_duration"] == INTERVIEW_PAYLOAD["planned_duration"]
    assert body["completed"] is False
    assert body["start_time"] is None
    assert body["end_time"] is None
    assert body["overall_score"] is None
    assert body["feedback"] is None
    assert body["questions"] == []
    assert isinstance(body["id"], int)
    assert body["created_at"] is not None


def test_create_interview_assigns_current_user(client):
    token = register(client)
    me = client.get("/auth/me", headers=auth_headers(token))
    body = create_interview(client, token)
    if me.status_code == 200:
        assert body["user_id"] == me.json()["id"]
    else:
        assert isinstance(body["user_id"], int)


def test_create_interview_missing_field_returns_422(client):
    token = register(client)
    payload = {**INTERVIEW_PAYLOAD}
    del payload["company"]
    response = client.post("/interviews/create_interview", json=payload, headers=auth_headers(token))
    assert response.status_code == 422


# --- get_interview (single) ---------------------------------------------


def test_get_interview_requires_auth(client):
    response = client.get("/interviews/1")
    assert response.status_code == 401


def test_get_interview_returns_created_interview(client):
    token = register(client)
    created = create_interview(client, token)

    response = client.get(f"/interviews/{created['id']}", headers=auth_headers(token))
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["company"] == INTERVIEW_PAYLOAD["company"]


def test_get_interview_not_found_returns_404(client):
    token = register(client)
    response = client.get("/interviews/999", headers=auth_headers(token))
    assert response.status_code == 404


def test_get_interview_of_another_user_returns_404(client):
    token_a = register(client, USER_A)
    token_b = register(client, USER_B)
    created = create_interview(client, token_a)

    response = client.get(f"/interviews/{created['id']}", headers=auth_headers(token_b))
    assert response.status_code == 404


# --- get_interviews (list) -----------------------------------------------


def test_get_interviews_requires_auth(client):
    response = client.get("/interviews/")
    assert response.status_code == 401


def test_get_interviews_empty_when_none_created(client):
    token = register(client)
    response = client.get("/interviews/", headers=auth_headers(token))
    assert response.status_code == 200
    assert response.json() == []


def test_get_interviews_returns_only_current_users_interviews(client):
    token_a = register(client, USER_A)
    token_b = register(client, USER_B)
    create_interview(client, token_a, company="Alice's Co")
    create_interview(client, token_b, company="Bob's Co")

    response = client.get("/interviews/", headers=auth_headers(token_a))
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["company"] == "Alice's Co"


def test_get_interviews_summary_shape(client):
    token = register(client)
    create_interview(client, token)

    response = client.get("/interviews/", headers=auth_headers(token))
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert set(body[0].keys()) == {
        "id",
        "user_id",
        "created_at",
        "completed",
        "planned_duration",
        "interview_type",
        "difficulty",
        "role",
        "company",
    }


def test_get_interviews_default_limit_is_six(client):
    token = register(client)
    for i in range(8):
        create_interview(client, token, company=f"Company {i}")

    response = client.get("/interviews/", headers=auth_headers(token))
    assert response.status_code == 200
    assert len(response.json()) == 6


def test_get_interviews_sorted_oldest_first(client):
    token = register(client)
    created = [create_interview(client, token, company=f"Company {i}") for i in range(3)]

    response = client.get("/interviews/", headers=auth_headers(token))
    body = response.json()
    assert [i["id"] for i in body] == [i["id"] for i in created]
    assert [i["company"] for i in body] == ["Company 0", "Company 1", "Company 2"]


def test_get_interviews_pagination_shows_more_six_at_a_time(client):
    token = register(client)
    created = [create_interview(client, token, company=f"Company {i}") for i in range(14)]
    created_ids = [i["id"] for i in created]

    first_page = client.get("/interviews/?skip=0&limit=6", headers=auth_headers(token)).json()
    second_page = client.get("/interviews/?skip=6&limit=6", headers=auth_headers(token)).json()
    third_page = client.get("/interviews/?skip=12&limit=6", headers=auth_headers(token)).json()

    assert len(first_page) == 6
    assert len(second_page) == 6
    assert len(third_page) == 2

    all_ids = [i["id"] for i in first_page + second_page + third_page]
    assert all_ids == created_ids


def test_get_interviews_limit_can_be_overridden(client):
    token = register(client)
    for i in range(5):
        create_interview(client, token, company=f"Company {i}")

    response = client.get("/interviews/?limit=3", headers=auth_headers(token))
    assert response.status_code == 200
    assert len(response.json()) == 3


# --- delete_interview -----------------------------------------------------


def seed_question_with_response(db_session, interview_id):
    question = QuestionModel(
        interview_id=interview_id,
        sequence_number=1,
        question_text="Tell me about yourself.",
    )
    db_session.add(question)
    db_session.commit()
    db_session.refresh(question)

    response = ResponseModel(
        question_id=question.id,
        transcript_text="I am a software engineer.",
    )
    db_session.add(response)
    db_session.commit()
    db_session.refresh(response)

    return question.id, response.id


def test_delete_interview_requires_auth(client):
    response = client.delete("/interviews/1")
    assert response.status_code == 401


def test_delete_interview_not_found_returns_404(client):
    token = register(client)
    response = client.delete("/interviews/999", headers=auth_headers(token))
    assert response.status_code == 404


def test_delete_interview_of_another_user_returns_404(client):
    token_a = register(client, USER_A)
    token_b = register(client, USER_B)
    created = create_interview(client, token_a)

    response = client.delete(f"/interviews/{created['id']}", headers=auth_headers(token_b))
    assert response.status_code == 404

    # the interview must still exist for its owner
    still_there = client.get(f"/interviews/{created['id']}", headers=auth_headers(token_a))
    assert still_there.status_code == 200


def test_delete_interview_removes_it(client):
    token = register(client)
    created = create_interview(client, token)

    response = client.delete(f"/interviews/{created['id']}", headers=auth_headers(token))
    assert response.status_code == 204

    follow_up = client.get(f"/interviews/{created['id']}", headers=auth_headers(token))
    assert follow_up.status_code == 404

    listing = client.get("/interviews/", headers=auth_headers(token)).json()
    assert listing == []


def test_delete_interview_also_removes_its_questions_and_responses(client, db_session):
    token = register(client)
    created = create_interview(client, token)
    question_id, response_id = seed_question_with_response(db_session, created["id"])

    delete_response = client.delete(f"/interviews/{created['id']}", headers=auth_headers(token))
    assert delete_response.status_code == 204

    assert db_session.query(QuestionModel).filter(QuestionModel.id == question_id).first() is None
    assert db_session.query(ResponseModel).filter(ResponseModel.id == response_id).first() is None
