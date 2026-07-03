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
├── main.py                 # entry point — run this with uvicorn
└── api/
    ├── app.py               # FastAPI app instance, CORS, router mounting
    ├── config.py            # loads .env, exposes config values
    ├── database.py          # SQLAlchemy engine/session, init_db(), get_db()
    ├── prompts.py            # Claude system prompts
    ├── models/
    │   ├── __init__.py       # re-exports models
    │   └── user.py           # User SQLAlchemy model
    ├── routes/
    │   ├── __init__.py
    │   └── auth.py           # /auth/register, /auth/login
    ├── schemas/
    │   ├── __init__.py
    │   └── user.py           # Pydantic User/UserCreate schemas
    └── services/
        └── __init__.py       # business logic (e.g. Claude calls) goes here
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

   You'll need a running PostgreSQL instance for `DATABASE_URL` to work. Tables are created automatically on startup via `init_db()`.

4. **Run the server:**

   ```sh
   python main.py
   ```

   This starts uvicorn on `http://127.0.0.1:8000` with auto-reload enabled.

   Interactive API docs are available at `http://127.0.0.1:8000/docs`.

## Notes

- CORS is currently configured to allow only `http://localhost:3000` and `http://127.0.0.1:3000` (the default React dev server). Update `origins` in `api/app.py` if your frontend runs elsewhere.
- All environment variables are loaded once in `api/config.py` — import from there rather than calling `load_dotenv()`/`os.getenv()` elsewhere.
- Claude system prompts live in `api/prompts.py` as plain string constants — import them wherever you call the Claude API.
- `api/routes/auth.py` currently registers/looks up users by email only — there's no password field on the `User` model yet, so it isn't real authentication until that's added.
- Business logic (e.g. wrapping Claude API calls) belongs in `api/services/`, keeping route handlers thin.