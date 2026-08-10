# app/core/database.py

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os


# ==========================================================
# LOAD ENV
# ==========================================================

load_dotenv()


# ==========================================================
# DATABASE URL
# ==========================================================

DATABASE_URL = os.getenv("DATABASE_URL")


if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is not set in environment variables"
    )


# ==========================================================
# DATABASE ENGINE
# ==========================================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


# ==========================================================
# CHECK DATABASE CONNECTION
# ==========================================================

try:

    with engine.connect() as conn:

        result = conn.execute(
            text("SELECT current_database();")
        )

        print(
            "CONNECTED DATABASE:",
            result.fetchone()
        )

except Exception as e:

    print(
        "DATABASE CONNECTION ERROR:",
        e
    )


# ==========================================================
# SESSION
# ==========================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ==========================================================
# BASE MODEL
# ==========================================================

Base = declarative_base()


# ==========================================================
# GET DATABASE SESSION
# ==========================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()