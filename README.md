# Interviewly
AI mock interviewer that asks questions, listens to your answers, and gives real-time feedback — for technical and behavioral interview prep.


## How it works


## Technologies

**Backend**
- Python
- FastAPI — web framework / REST + WebSocket routes
- Uvicorn — ASGI server
- SQLAlchemy — ORM
- PostgreSQL (via `psycopg2-binary`) — database
- Pydantic — request/response validation & schemas
- PyJWT — auth tokens
- bcrypt — password hashing
- python-multipart — file/form uploads (resume PDFs)
- websockets — real-time interview session
- python-dotenv — environment config
- pytest — testing

**AI & speech**
- Anthropic Claude — interview questions, follow-ups, feedback, resume parsing
- Deepgram — speech-to-text and text-to-speech

**Frontend**
- React 19 + TypeScript
- Vite — dev server / build tool
- React Router — client-side routing
- Axios — HTTP client
- oxlint — linting

## System Architectue
<img width="707" height="741" alt="image" src="https://github.com/user-attachments/assets/38f0bfc8-a437-4518-b2df-bf11013fbbdf" />



## Insipiration
After taking a few interviews and realizing how difficult interviews can be and how much preparation is needed for them, I thought it would be a good idea to create a tool that could help me and my friends pass interviews and hopefully land us an internship where nice. 

If youre a recruiter, pls dm me for internship :pray:. 

I made it free for you guys to use given that you spend a 10-15 dollars on an Anthropic's API keys and a Deepgram key, which you get a $100 dollars for free. 

I'd add the buy me a coffee stuff but I dont have it set up. 

## Set Up

- ill write this later

