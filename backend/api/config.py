import os

from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
STT_MODEL = os.getenv("STT_MODEL", "nova-2")
TTS_MODEL = os.getenv("TTS_MODEL", "aura-asteria-en")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 300))
