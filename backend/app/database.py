"""
Database configuration: MySQL engine and session.
Uses DATABASE_URL (e.g. mysql+pymysql://user:pass@host:3306/dbname).
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import settings

db_url = settings.database_url
# Ensure charset for MySQL
if db_url.startswith("mysql"):
    db_url += "?charset=utf8mb4" if "?" not in db_url else "&charset=utf8mb4"

engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that yields a DB session and closes it after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
