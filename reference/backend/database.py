import os
import re
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Fetch database URL from environment
raw_db_url = os.environ.get("DATABASE_URL", "").strip()

if raw_db_url:
    # Standardize Render/Heroku postgres URLs for SQLAlchemy asyncpg
    if raw_db_url.startswith("postgres://"):
        db_url = raw_db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif raw_db_url.startswith("postgresql://"):
        db_url = raw_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    else:
        db_url = raw_db_url
else:
    # Local fallback for standalone developer testing
    os.makedirs("./data", exist_ok=True)
    db_url = "sqlite+aiosqlite:///./data/masterclass.db"

# Engine configuration
engine_kwargs = {"echo": False}
if "sqlite" in db_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_async_engine(db_url, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency for database session injection."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    """Initializes schema tables asynchronously."""
    from . import models  # Ensures models are registered on Base.metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
