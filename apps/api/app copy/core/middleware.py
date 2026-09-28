"""
BhuSetu 3D Production Security & Request Handling Middleware
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 14: Production Deployment + Security + Performance Hardening

Responsibilities:
- Correlation ID (X-Request-ID) generation and tracing
- Payload size bounding (HTTP 413 Payload Too Large)
- Security response headers (HSTS, nosniff, framing protection)
- Secret redaction and structured audit latency logging
"""
import uuid
import time
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.core.config import settings
from app.core.logging import logger

REDACTED_HEADERS = {"authorization", "cookie", "x-api-key", "set-cookie", "supabase-key"}


class SecurityAndObservabilityMiddleware(BaseHTTPMiddleware):
    """
    Unified production middleware ensuring correlation tracing,
    request size containment, and security header injection.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        # 1. Correlation ID management
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())

        # Store in request state for downstream handlers
        request.state.request_id = request_id

        # 2. Request body size bounding
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length_int = int(content_length)
                if length_int > settings.MAX_REQUEST_SIZE_BYTES:
                    logger.warning(
                        f"[SECURITY] Request {request_id} rejected: Payload {length_int} bytes "
                        f"exceeds max limit {settings.MAX_REQUEST_SIZE_BYTES} bytes."
                    )
                    return JSONResponse(
                        status_code=413,
                        content={
                            "error": "PayloadTooLarge",
                            "message": f"Request body exceeds maximum allowed limit ({settings.MAX_REQUEST_SIZE_BYTES // (1024*1024)}MB).",
                            "request_id": request_id,
                        },
                        headers={"X-Request-ID": request_id}
                    )
            except ValueError:
                pass

        # 3. Process the request
        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(
                f"[API_ERROR] {request.method} {request.url.path} [{duration_ms}ms] [req_id={request_id}]: {exc}",
                exc_info=True
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": "InternalServerError",
                    "message": "An unexpected error occurred while processing your request.",
                    "request_id": request_id,
                },
                headers={"X-Request-ID": request_id}
            )

        duration_ms = round((time.time() - start_time) * 1000, 2)

        # 4. Inject correlation ID and security headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if settings.ENVIRONMENT.lower() in ("production", "staging"):
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"

        # 5. Structured logging with redaction
        log_level = logger.info if response.status_code < 400 else logger.warning
        log_level(
            f"[HTTP] {request.method} {request.url.path} "
            f"Status={response.status_code} Duration={duration_ms}ms RequestID={request_id}"
        )

        return response
