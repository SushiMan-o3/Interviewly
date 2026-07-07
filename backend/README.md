# Interviewly Backend

FastAPI backend with Anthropic (Claude) integration and a PostgreSQL database via SQLAlchemy.

## Project structure

```
backend/
├── .env                    # local environment variables (not committed)
├── .env.example            # template for .env
├── .gitignore
├── README.md
├── requirements.txt
├── pytest.ini               # pythonpath config for tests
├── main.py                 # entry point — run this with uvicorn
├── tests/
│   ├── conftest.py          # TestClient fixture backed by an in-memory SQLite db
│   ├── test_auth.py         # /auth/* endpoint tests
│   ├── test_interviews.py   # /interviews/* endpoint tests (placeholder, routes are stubs)
│   ├── test_claude_service.py     # ask_claude tests (mocks the Anthropic client)
│   ├── test_speech_service.py     # transcribe_audio/synthesize_speech tests (mocks Deepgram/gTTS/SpeechRecognition)
│   └── test_interview_engine.py   # placeholder for interview_engine tests
└── api/
    ├── app.py               # FastAPI app instance, CORS, router mounting
    ├── config.py            # loads .env, exposes config values
    ├── database.py          # SQLAlchemy engine/session, init_db(), get_db()
    ├── prompts.py            # Claude system prompts (INTERVIEWER_SYSTEM_PROMPT, FEEDBACK_SYSTEM_PROMPT)
    ├── models/
    │   ├── __init__.py       # re-exports models
    │   ├── user.py           # User SQLAlchemy model (id, name, username, hashed_password)
    │   ├── interview.py      # Interview SQLAlchemy model (belongs to a User, has many Questions)
    │   ├── question.py       # Question SQLAlchemy model (belongs to an Interview, self-referential parent/children, has many Responses)
    │   ├── response.py       # Response SQLAlchemy model (belongs to a Question)
    │   └── additional_user_information.py  # AdditionalUserInformation SQLAlchemy model (1:1 with User)
    ├── routes/
    │   ├── __init__.py
    │   ├── auth.py           # /auth/register, /auth/login, /auth/me
    │   └── interviews.py     # /interviews CRUD + /interviews/ws websocket (currently stubs, see Notes)
    ├── schemas/
    │   ├── __init__.py
    │   ├── token.py          # Pydantic Token schema (JWT response)
    │   ├── user.py           # Pydantic User/UserCreate/UserLogin schemas
    │   ├── interview.py      # Pydantic Interview/InterviewCreate/CompletedInterview schemas
    │   ├── question.py       # Pydantic Question/QuestionCreate schemas
    │   └── response.py       # Pydantic Response/ResponseCreate schemas
    └── services/
        ├── __init__.py
        ├── security.py       # password hashing + JWT helpers (create_access_token, get_current_user)
        ├── claude_service.py     # ask_claude(messages, system_prompt) — wraps the Anthropic client
        ├── speech_service.py     # transcribe_audio/synthesize_speech — Deepgram, with free fallbacks (see Notes)
        └── interview_engine.py   # interview session orchestration (not yet implemented)
```

## Setup

1. **Create and activate a virtual environment** (from the `backend/` directory):

   ```sh
   python -m venv venv
   venv\Scripts\activate      # Windows
   source venv/bin/activate   # macOS/Linux
   ```

2. **Install dependencies:**

   ```sh
   pip install -r requirements.txt
   ```

3. **Configure environment variables.** Copy `.env.example` to `.env` and fill in your values:

   ```sh
   cp .env.example .env
   ```

   | Variable | Description |
   | --- | --- |
   | `ANTHROPIC_API_KEY` | Your Claude API key from the [Anthropic Console](https://console.anthropic.com/) |
   | `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://USER:PASSWORD@localhost:5432/DB_NAME` |
   | `DEEPGRAM_API_KEY` | Optional. Your Deepgram API key, used for speech-to-text and text-to-speech. If unset, `speech_service` falls back to free alternatives — see Notes |
   | `STT_MODEL` | Deepgram speech-to-text model, defaults to `nova-2` |
   | `TTS_MODEL` | Deepgram text-to-speech model, defaults to `aura-asteria-en` |
   | `SECRET_KEY` | Secret used to sign JWT access tokens — keep this out of version control |
   | `ALGORITHM` | JWT signing algorithm, e.g. `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | How long issued access tokens stay valid, in minutes |

   You'll need a running PostgreSQL instance for `DATABASE_URL` to work. Tables are created automatically on startup via `init_db()`.

4. **Run the server:**

   ```sh
   python main.py
   ```

   This starts uvicorn on `http://127.0.0.1:8000` with auto-reload enabled.

   Interactive API docs are available at `http://127.0.0.1:8000/docs`.

5. **Run the tests** (from the `backend/` directory):

   ```sh
   pytest
   ```

   Tests use an in-memory SQLite database (see `tests/conftest.py`) and mock out Deepgram/Anthropic/gTTS, so no `.env` values or external API keys are required to run the suite.

## Notes

- CORS is currently configured to allow only `http://localhost:3000` and `http://127.0.0.1:3000` (the default React dev server). Update `origins` in `api/app.py` if your frontend runs elsewhere.
- All environment variables are loaded once in `api/config.py` — import from there rather than calling `load_dotenv()`/`os.getenv()` elsewhere.
- Claude system prompts live in `api/prompts.py` as plain string constants — import them wherever you call the Claude API.
- `api/services/claude_service.py` wraps the Anthropic client in `ask_claude(messages, system_prompt)`, used for asking Claude interview-related prompts.
- `api/services/speech_service.py` handles speech-to-text and text-to-speech. If `DEEPGRAM_API_KEY` is set, both `transcribe_audio` and `synthesize_speech` use Deepgram. If it's unset: `transcribe_audio` falls back to `SpeechRecognition`'s free Google Web Speech API recognizer, and `synthesize_speech` falls back to `gTTS` (Google Translate's free text-to-speech endpoint) — both require internet access but no API key.
- `api/services/interview_engine.py` is a placeholder for the interview session orchestration logic (calling Claude for questions/follow-ups, scoring responses, etc.) — not yet implemented.
- `api/routes/auth.py` implements real authentication: `/auth/register` and `/auth/login` hash/verify passwords with `bcrypt` and return a signed JWT (`api/schemas/token.py`). `/auth/me` is a protected route that reads the current user via the `get_current_user` dependency in `api/services/security.py`.
- To call a protected route, send the returned `access_token` as `Authorization: Bearer <token>`.
- `api/routes/interviews.py` defines the `/interviews` CRUD routes and the `/interviews/ws` websocket for a live interview session, but the handlers are currently stubs (`pass`). Note that FastAPI websocket routes don't support `response_model` — once `interview_session` is implemented, the final message should be serialized manually with `CompletedInterview.model_validate(interview).model_dump(mode="json")` before `websocket.send_json(...)`.
- `Interview` → `Question` → `Response` model the interview flow: an interview belongs to a user and has many questions (ordered by `sequence_number`); a question can reference a parent question (for follow-ups) and has many responses; a response holds the transcript, timing, score, and feedback for one answer. `api/schemas/interview.py` also defines `CompletedInterview`, an `Interview` subtype where `start_time`, `end_time`, `overall_score`, and `feedback` are required (used once an interview session finishes).
- `AdditionalUserInformation` holds optional profile fields (`target_role`, `experience`, `industry`, `resume_url`) in a 1:1 relationship with `User` (`user.additional_info`). No Pydantic schema or routes yet — model only.
- Business logic (e.g. wrapping Claude API calls) belongs in `api/services/`, keeping route handlers thin.
- Tests live in `tests/`, using `pytest` with the `client` fixture from `tests/conftest.py` (a `TestClient` backed by an in-memory SQLite db). `test_interviews.py` and `test_interview_engine.py` are currently empty placeholders since their corresponding routes/services aren't implemented yet.