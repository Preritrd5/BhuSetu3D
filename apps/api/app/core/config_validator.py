"""
BhuSetu 3D Production Configuration Validator
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 14: Production Deployment + Security + Performance Hardening

Enforces fail-fast validation against dangerous production misconfigurations:
- DEBUG=true in production
- Wildcard CORS with credentials
- Insecure database transports or localhost in production
- Missing Supabase keys or secrets
- Leakage of secrets in error messages
"""
from typing import List, Tuple
from app.core.config import Settings, settings
from app.core.logging import logger


class ConfigurationValidationError(RuntimeError):
    """Raised when critical production security parameters fail validation."""
    pass


def validate_production_config(cfg: Settings = settings) -> Tuple[bool, List[str]]:
    """
    Validates operational settings. Returns (is_valid, list_of_errors).
    If in 'production' or 'staging' mode, critical failures will raise ConfigurationValidationError.
    Never prints or leaks secret values.
    """
    errors: List[str] = []
    is_prod = cfg.ENVIRONMENT.lower() in ("production", "staging", "prod")

    # 1. DEBUG mode audit
    if is_prod and cfg.DEBUG:
        errors.append("CRITICAL: DEBUG=True is strictly prohibited in production/staging environments.")

    # 2. CORS audit
    origins = cfg.CORS_ORIGINS if isinstance(cfg.CORS_ORIGINS, list) else [cfg.CORS_ORIGINS]
    if is_prod:
        if "*" in origins:
            errors.append("CRITICAL: Wildcard CORS ('*') is prohibited in production when credentials are enabled.")
        for origin in origins:
            if "localhost" in origin or "127.0.0.1" in origin:
                errors.append(f"WARNING: Development origin '{origin}' detected in production CORS configuration.")

    # 3. Database URL audit
    db_url = cfg.DATABASE_URL.lower()
    if is_prod:
        if "localhost" in db_url or "127.0.0.1" in db_url:
            errors.append("CRITICAL: Production database cannot reference localhost. Supabase is sole production database.")
        if "[your-password]" in db_url:
            errors.append("CRITICAL: DATABASE_URL contains unconfigured placeholder '[YOUR-PASSWORD]'.")

    # 4. Supabase credentials audit
    if not cfg.SUPABASE_URL or not cfg.SUPABASE_URL.startswith("https://"):
        errors.append("CRITICAL: SUPABASE_URL must be a valid secure HTTPS endpoint.")

    if not cfg.SUPABASE_PUBLISHABLE_KEY:
        errors.append("CRITICAL: SUPABASE_PUBLISHABLE_KEY is required for Supabase authentication verification.")

    # 5. Output and evaluation
    if errors:
        for err in errors:
            logger.error(f"[CONFIG_VALIDATION] {err}")
        if is_prod and any(e.startswith("CRITICAL") for e in errors):
            raise ConfigurationValidationError(
                f"Production startup aborted due to {len(errors)} critical configuration violation(s): " + " | ".join(errors)
            )
        return False, errors

    logger.info("[CONFIG_VALIDATION] Production configuration validated successfully. Zero security blockers.")
    return True, []


if __name__ == "__main__":
    import sys
    is_valid, validation_errors = validate_production_config()
    if not is_valid:
        print(f"Validation completed with {len(validation_errors)} error(s):")
        for err in validation_errors:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print("Production configuration is clean and valid.")
        sys.exit(0)
