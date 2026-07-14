from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from api.config import DATABASE_URL

# DATABASE_URL points at Neon's pooled (pgbouncer, transaction-mode) endpoint.
# Stacking SQLAlchemy's own connection pool on top of that causes stale/desynced
# connections to be reused and fail with confusing errors (missing tables,
# "SSL connection closed"). NullPool opens a fresh connection per checkout and
# lets pgbouncer do the actual pooling, which is the supported combination.
engine = create_engine(DATABASE_URL, poolclass=NullPool)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
