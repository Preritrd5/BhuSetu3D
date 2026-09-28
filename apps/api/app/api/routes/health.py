"""
BhuSetu 3D Health & Readiness API Endpoints
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 14: Production Deployment + Security + Performance Hardening
"""
from fastapi import APIRouter, status, Response
from app.schemas.health import HealthResponse, DatabaseHealthResponse, SystemHealthResponse
from app.services.health_service import HealthService

router = APIRouter(prefix="/health", tags=["Health & Observability"])


@router.get("", response_model=HealthResponse, summary="Basic API Health")
async def get_health():
    """Returns instantaneous operational health of the FastAPI backend application."""
    return HealthService.get_api_health()


@router.get("/live", summary="Kubernetes / Docker Liveness Probe")
async def get_liveness():
    """
    Liveness probe: returns HTTP 200 immediately if process is alive.
    Independent of external service availability.
    """
    return HealthService.get_liveness()


@router.get("/ready", summary="Kubernetes / Docker Readiness Probe")
async def get_readiness(response: Response):
    """
    Readiness probe: validates database connectivity.
    Returns HTTP 200 if ready to serve, HTTP 503 if database is disconnected.
    """
    readiness = await HealthService.get_readiness()
    if readiness["status"] != "ready":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return readiness


@router.get("/database", response_model=DatabaseHealthResponse, summary="Database & PostGIS Health")
async def get_database_health(response: Response):
    """
    Executes a real probe to verify PostgreSQL connectivity and PostGIS extension status.
    Returns HTTP 200 if connected, or HTTP 503 if the database is unreachable.
    """
    db_health = await HealthService.get_database_health()
    if not db_health.connected:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return db_health


@router.get("/system", response_model=SystemHealthResponse, summary="Full System Health")
async def get_system_health(response: Response):
    """Aggregates API and Database telemetry into a single payload for the UI Shell."""
    system_health = await HealthService.get_system_health()
    if not system_health.database.connected:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return system_health


@router.get("/metrics", summary="Operational Metrics")
async def get_metrics():
    """Exposes high-level operational performance and uptime metrics."""
    return await HealthService.get_metrics()
