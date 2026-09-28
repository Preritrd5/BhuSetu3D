"""
BhuSetu 3D Enterprise Health & Observability Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 14: Production Deployment + Security + Performance Hardening
"""
import time
from datetime import datetime, timezone
from typing import Dict, Any
from app.core.config import settings
from app.database.connection import check_database_connectivity
from app.schemas.health import HealthResponse, DatabaseHealthResponse, SystemHealthResponse

# Application startup timestamp
START_TIME = time.time()


class HealthService:
    @staticmethod
    def get_api_health() -> HealthResponse:
        """Returns instantaneous API status without blocking on database probes."""
        return HealthResponse(
            status="ok",
            service=settings.PROJECT_NAME,
            version=settings.VERSION,
            environment=settings.ENVIRONMENT
        )

    @staticmethod
    def get_liveness() -> Dict[str, Any]:
        """
        Liveness probe: verifies process is alive and responsive.
        Never depends on external network services.
        """
        return {
            "status": "alive",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "uptime_seconds": round(time.time() - START_TIME, 1),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    async def get_readiness() -> Dict[str, Any]:
        """
        Readiness probe: verifies that the application and its critical Supabase DB
        dependency are healthy and ready to serve incoming traffic.
        """
        db_telemetry = await check_database_connectivity()
        is_ready = bool(db_telemetry["connected"])

        return {
            "status": "ready" if is_ready else "not_ready",
            "database": "connected" if is_ready else "disconnected",
            "postgis": bool(db_telemetry.get("postgis_enabled", False)),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    async def get_database_health() -> DatabaseHealthResponse:
        """Executes a real database probe and returns structured PostGIS telemetry."""
        db_telemetry = await check_database_connectivity()

        status_str = "connected" if db_telemetry["connected"] else "unavailable"
        if db_telemetry["connected"] and not db_telemetry["postgis_enabled"]:
            status_str = "degraded"

        return DatabaseHealthResponse(
            status=status_str,
            connected=db_telemetry["connected"],
            database_type=db_telemetry["database_type"],
            database_version=db_telemetry["database_version"],
            postgis_enabled=db_telemetry["postgis_enabled"],
            postgis_version=db_telemetry["postgis_version"],
            error=db_telemetry["error"]
        )

    @staticmethod
    async def get_system_health() -> SystemHealthResponse:
        """Returns comprehensive system health combining API runtime and database probe."""
        db_health = await HealthService.get_database_health()
        api_status = "ok" if db_health.connected else "degraded"

        return SystemHealthResponse(
            service=settings.PROJECT_NAME,
            version=settings.VERSION,
            environment=settings.ENVIRONMENT,
            api_status=api_status,
            database=db_health,
            timestamp=datetime.now(timezone.utc).isoformat()
        )

    @staticmethod
    async def get_metrics() -> Dict[str, Any]:
        """Exposes operational performance metrics without high-cardinality leakage."""
        db_telemetry = await check_database_connectivity()
        uptime = round(time.time() - START_TIME, 1)

        return {
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "uptime_seconds": uptime,
            "database_connected": bool(db_telemetry["connected"]),
            "rate_limit_enabled": settings.RATE_LIMIT_ENABLED,
            "max_request_size_bytes": settings.MAX_REQUEST_SIZE_BYTES,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
