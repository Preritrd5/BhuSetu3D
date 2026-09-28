"""
ASTATINE Database Connection & PostGIS Engine
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 1: Project Foundation
"""
from typing import AsyncGenerator, Dict, Any, Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from app.core.config import settings
from app.core.logging import logger


def normalize_async_database_url(url: str) -> str:
    """Ensures database URL uses the asyncpg driver for async SQLAlchemy."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


# Normalize the URL
ASYNC_DATABASE_URL = normalize_async_database_url(settings.DATABASE_URL)

from sqlalchemy.pool import NullPool
import ssl

# Create SSL context compatible with Supabase pooler proxy
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Create the async engine with NullPool for cloud Supabase PgBouncer pooler
engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    future=True,
    poolclass=NullPool,
    connect_args={
        "timeout": 30,
        "command_timeout": 30,
        "statement_cache_size": 0,
        "ssl": ssl_context,
    }
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for obtaining an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def check_database_connectivity() -> Dict[str, Any]:
    """
    Executes a real probe against PostgreSQL and verifies PostGIS extension status.
    Returns structured health telemetry. Does NOT mock or fake status.
    """
    result: Dict[str, Any] = {
        "connected": False,
        "database_type": "PostgreSQL",
        "database_version": None,
        "postgis_enabled": False,
        "postgis_version": None,
        "error": None
    }

    try:
        async with engine.connect() as conn:
            # 1. Verify basic connection and retrieve PostgreSQL version
            version_row = await conn.execute(text("SELECT version();"))
            db_version_raw = version_row.scalar()
            result["connected"] = True
            result["database_version"] = str(db_version_raw).split(",")[0] if db_version_raw else "Unknown"

            # 2. Check PostGIS extension status in PostgreSQL
            postgis_check = await conn.execute(
                text("SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';")
            )
            pg_ext = postgis_check.fetchone()

            if pg_ext:
                result["postgis_enabled"] = True
                result["postgis_version"] = pg_ext[1]
                try:
                    full_ver = await conn.execute(text("SELECT PostGIS_Full_Version();"))
                    result["postgis_full_details"] = full_ver.scalar()
                except Exception:
                    pass
            else:
                # Check if postgis extension is at least available for installation
                avail_check = await conn.execute(
                    text("SELECT default_version FROM pg_available_extensions WHERE name = 'postgis';")
                )
                avail_ver = avail_check.scalar()
                if avail_ver:
                    result["postgis_version"] = f"Available ({avail_ver}), but not yet activated with CREATE EXTENSION postgis;"
                else:
                    result["postgis_version"] = "Not found in pg_available_extensions"

    except Exception as exc:
        logger.warning(f"Database connectivity check failed: {exc}")
        result["connected"] = False
        result["error"] = str(exc)

    return result
