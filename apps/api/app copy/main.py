"""
BhuSetu 3D Main FastAPI Application Entrypoint
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 14: Production Deployment + Security + Performance Hardening
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging import logger
from app.core.config_validator import validate_production_config
from app.core.middleware import SecurityAndObservabilityMiddleware
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup validation and graceful shutdown."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    logger.info(f"Configured API prefix: {settings.API_V1_PREFIX}")
    logger.info(f"Allowed CORS origins: {settings.CORS_ORIGINS}")

    # Validate production configuration before serving traffic
    validate_production_config(settings)

    yield
    logger.info(f"Gracefully shutting down {settings.PROJECT_NAME}")


# Instantiate the FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Evidence-Backed 3D Property Intelligence Platform (SIH26011)",
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json" if settings.DEBUG or settings.ENVIRONMENT == "development" else None,
    docs_url=f"{settings.API_V1_PREFIX}/docs" if settings.DEBUG or settings.ENVIRONMENT == "development" else None,
    redoc_url=f"{settings.API_V1_PREFIX}/redoc" if settings.DEBUG or settings.ENVIRONMENT == "development" else None,
    lifespan=lifespan
)

# 1. Security & Observability Middleware (Correlation IDs, size limits, security headers, logging)
app.add_middleware(SecurityAndObservabilityMiddleware)

# 2. Configure Cross-Origin Resource Sharing (CORS) - Outermost
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Unhandled Exception on {request.method} {request.url.path} [req_id={req_id}]: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred while processing your request.",
            "request_id": req_id
        },
        headers={"X-Request-ID": req_id}
    )


# Mount the versioned API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint providing service descriptor and API health links."""
    return {
        "project": "BhuSetu 3D",
        "product": "Evidence-Backed 3D Property Intelligence Platform",
        "team": "TANTRAKATHA",
        "hackathon": "Smart India Hackathon 2026",
        "problem_statement": "SIH26011",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "health_check": f"{settings.API_V1_PREFIX}/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=(settings.ENVIRONMENT == "development")
    )
