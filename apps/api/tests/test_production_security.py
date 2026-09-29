"""
BhuSetu 3D Production Security & Hardening Test Suite
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 14: Production Deployment + Security + Performance Hardening
"""
import pytest
import io
import zipfile
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import Settings
from app.core.config_validator import validate_production_config, ConfigurationValidationError
from app.core.rate_limiter import SlidingWindowRateLimiter
from app.services.storage_security import (
    StorageSecurityService,
    FileSecurityError,
    ALLOWED_EXTENSIONS
)
from app.services.job_worker import JobWorkerService, JobExecutionError


@pytest.fixture
def client():
    return TestClient(app)


# =============================================================================
# 1. CONFIGURATION VALIDATION TESTS
# =============================================================================

def test_config_validator_detects_debug_in_production():
    """Validator strictly prohibits DEBUG=True in production environment."""
    bad_cfg = Settings(
        ENVIRONMENT="production",
        DEBUG=True,
        SUPABASE_URL="https://qcobqjtrhhdwzmadfykq.supabase.co",
        SUPABASE_PUBLISHABLE_KEY="sb_pub_key",
        DATABASE_URL="postgresql+asyncpg://postgres:pass@db.qcobqjtrhhdwzmadfykq.supabase.co:5432/postgres?ssl=require",
        CORS_ORIGINS=["https://bhusetu3d.gov.in"]
    )
    with pytest.raises(ConfigurationValidationError) as exc_info:
        validate_production_config(bad_cfg)
    assert "DEBUG=True is strictly prohibited" in str(exc_info.value)


def test_config_validator_detects_wildcard_cors_in_production():
    """Validator strictly prohibits wildcard CORS in production with credentials."""
    bad_cfg = Settings(
        ENVIRONMENT="production",
        DEBUG=False,
        SUPABASE_URL="https://qcobqjtrhhdwzmadfykq.supabase.co",
        SUPABASE_PUBLISHABLE_KEY="sb_pub_key",
        DATABASE_URL="postgresql+asyncpg://postgres:pass@db.qcobqjtrhhdwzmadfykq.supabase.co:5432/postgres?ssl=require",
        CORS_ORIGINS=["*"]
    )
    with pytest.raises(ConfigurationValidationError) as exc_info:
        validate_production_config(bad_cfg)
    assert "Wildcard CORS ('*') is prohibited" in str(exc_info.value)


def test_config_validator_detects_localhost_db_in_production():
    """Validator strictly prohibits localhost database in production (Supabase mandatory)."""
    bad_cfg = Settings(
        ENVIRONMENT="production",
        DEBUG=False,
        SUPABASE_URL="https://qcobqjtrhhdwzmadfykq.supabase.co",
        SUPABASE_PUBLISHABLE_KEY="sb_pub_key",
        DATABASE_URL="postgresql+asyncpg://postgres:pass@localhost:5432/postgres",
        CORS_ORIGINS=["https://bhusetu3d.gov.in"]
    )
    with pytest.raises(ConfigurationValidationError) as exc_info:
        validate_production_config(bad_cfg)
    assert "Production database cannot reference localhost" in str(exc_info.value)


def test_config_validator_passes_valid_production_config():
    """Valid production settings pass validation cleanly with 0 errors."""
    valid_cfg = Settings(
        ENVIRONMENT="production",
        DEBUG=False,
        SUPABASE_URL="https://qcobqjtrhhdwzmadfykq.supabase.co",
        SUPABASE_PUBLISHABLE_KEY="sb_pub_key",
        DATABASE_URL="postgresql+asyncpg://postgres:strong_password@db.qcobqjtrhhdwzmadfykq.supabase.co:5432/postgres?ssl=require",
        CORS_ORIGINS=["https://bhusetu3d.gov.in"]
    )
    is_valid, errors = validate_production_config(valid_cfg)
    assert is_valid is True
    assert len(errors) == 0


# =============================================================================
# 2. RATE LIMITING TESTS
# =============================================================================

def test_sliding_window_rate_limiter_blocks_burst():
    """Sliding window limiter blocks clients exceeding requests per window with Retry-After."""
    limiter = SlidingWindowRateLimiter()
    ip = "192.168.1.100"

    # Allow first 3 requests
    assert limiter.check_rate_limit(ip, max_requests=3, window_seconds=60) is None
    assert limiter.check_rate_limit(ip, max_requests=3, window_seconds=60) is None
    assert limiter.check_rate_limit(ip, max_requests=3, window_seconds=60) is None

    # 4th request must be blocked
    retry_after = limiter.check_rate_limit(ip, max_requests=3, window_seconds=60)
    assert retry_after is not None
    assert retry_after > 0


# =============================================================================
# 3. SECURITY MIDDLEWARE & HEADERS TESTS
# =============================================================================

def test_security_middleware_injects_correlation_id_and_headers(client):
    """Every HTTP response receives X-Request-ID, nosniff, and DENY headers."""
    response = client.get("/")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"


def test_security_middleware_rejects_oversized_payload(client):
    """Payloads exceeding maximum size are rejected with HTTP 413 Payload Too Large."""
    oversized_headers = {
        "content-length": str(100 * 1024 * 1024)  # 100 MB > 50 MB limit
    }
    response = client.post("/api/v1/auth/login", headers=oversized_headers, json={})
    assert response.status_code == 413
    assert response.json()["error"] == "PayloadTooLarge"


# =============================================================================
# 4. HEALTH, READINESS & METRICS TESTS
# =============================================================================

def test_liveness_probe_endpoint(client):
    """Liveness probe /health/live returns HTTP 200 immediately."""
    response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alive"
    assert "uptime_seconds" in data


def test_metrics_endpoint(client):
    """Metrics endpoint /health/metrics returns operational health and configuration telemetry."""
    response = client.get("/api/v1/health/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data
    assert "uptime_seconds" in data
    assert "rate_limit_enabled" in data


# =============================================================================
# 5. STORAGE & FILE UPLOAD SECURITY TESTS
# =============================================================================

def test_storage_security_filename_sanitization():
    """Sanitization strips directory traversal patterns and enforces allowlist."""
    cleaned = StorageSecurityService.sanitize_filename("valid_boundary.geojson")
    assert cleaned.endswith("valid_boundary.geojson")

    # Path traversal attack
    traversal = StorageSecurityService.sanitize_filename("../../../etc/shadow.geojson")
    assert ".." not in traversal
    assert "/" not in traversal
    assert traversal.endswith("shadow.geojson")

    # Prohibited extension
    with pytest.raises(FileSecurityError) as exc_info:
        StorageSecurityService.sanitize_filename("malicious_tool.exe")
    assert "Prohibited file extension '.exe'" in str(exc_info.value)


def test_storage_security_executable_magic_byte_rejection():
    """Rejects executable binaries disguised as allowed file formats."""
    # ELF binary payload disguised as .geojson
    elf_bytes = b"\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00"
    with pytest.raises(FileSecurityError) as exc_info:
        StorageSecurityService.validate_file_content(elf_bytes, "exploit.geojson")
    assert "Executable binaries or shell scripts are prohibited" in str(exc_info.value)

    # Windows MZ header disguised as .png
    mz_bytes = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00"
    with pytest.raises(FileSecurityError) as exc_info:
        StorageSecurityService.validate_file_content(mz_bytes, "avatar.png")
    assert "Executable binaries or shell scripts are prohibited" in str(exc_info.value)


def test_storage_security_zip_slip_prevention():
    """Detects and rejects Zip Slip path traversal inside archive members."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("../../etc/cron.d/backdoor", b"malicious script")
    zip_bytes = buf.getvalue()

    with pytest.raises(FileSecurityError) as exc_info:
        StorageSecurityService.verify_zip_archive_safety(zip_bytes)
    assert "Zip Slip path traversal detected" in str(exc_info.value)


# =============================================================================
# 6. JOB RELIABILITY & RETRY TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_job_worker_retries_transient_failure():
    """Job worker retries transient network connection drops and succeeds."""
    from uuid import uuid4
    attempts = 0

    async def flaky_task():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise ConnectionError("Transient Supabase pool reset")
        return "SUCCESS_DATA"

    result = await JobWorkerService.execute_with_retry(
        job_id=uuid4(),
        operation=flaky_task,
        max_retries=3,
        backoff_base=0.01  # fast backoff in tests
    )
    assert result == "SUCCESS_DATA"
    assert attempts == 3


@pytest.mark.asyncio
async def test_job_worker_aborts_on_permanent_failure():
    """Job worker does not loop indefinitely on permanent non-transient input errors."""
    from uuid import uuid4
    attempts = 0

    async def broken_task():
        nonlocal attempts
        attempts += 1
        raise ValueError("Invalid GeoJSON geometry topology")

    with pytest.raises(ValueError) as exc_info:
        await JobWorkerService.execute_with_retry(
            job_id=uuid4(),
            operation=broken_task,
            max_retries=3,
            backoff_base=0.01
        )
    assert "Invalid GeoJSON geometry topology" in str(exc_info.value)
    assert attempts == 1  # Should not retry permanent error


# =============================================================================
# 7. PRODUCTION CORS PREFLIGHT & ORIGIN ENFORCEMENT TESTS
# =============================================================================

def test_cors_preflight_production_vercel_origin(client):
    """OPTIONS preflight from production Vercel frontend must succeed with required CORS headers."""
    response = client.options(
        "/api/v1/verification/queue?page=1&page_size=15",
        headers={
            "Origin": "https://bhusetu3d.vercel.app",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://bhusetu3d.vercel.app"
    assert response.headers.get("access-control-allow-credentials") == "true"
    allow_methods = response.headers.get("access-control-allow-methods", "")
    assert "GET" in allow_methods
    assert "OPTIONS" in allow_methods


def test_cors_preflight_vercel_preview_origin(client):
    """OPTIONS preflight from Vercel preview deployment matches regex and succeeds."""
    response = client.options(
        "/api/v1/verification/queue",
        headers={
            "Origin": "https://bhusetu3d-git-main-preritrd5.vercel.app",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://bhusetu3d-git-main-preritrd5.vercel.app"
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_disallows_untrusted_third_party_origin(client):
    """OPTIONS preflight from untrusted origin is rejected."""
    response = client.options(
        "/api/v1/verification/queue",
        headers={
            "Origin": "https://malicious-attacker-site.com",
            "Access-Control-Request-Method": "GET",
        }
    )
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_assemble_cors_origins_preserves_mandatory_vercel():
    """assemble_cors_origins ensures production Vercel frontends are always included even if overridden."""
    cfg = Settings(CORS_ORIGINS=["http://localhost:3000"])
    assert "https://bhusetu3d.vercel.app" in cfg.CORS_ORIGINS
    assert "https://bhusetu-3d.vercel.app" in cfg.CORS_ORIGINS
    assert "http://localhost:3000" in cfg.CORS_ORIGINS

