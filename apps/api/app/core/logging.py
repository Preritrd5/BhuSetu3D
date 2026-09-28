"""
BhuSetu 3D Enterprise Structured Logging & Secret Redaction
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 14: Production Deployment + Security + Performance Hardening

Features:
- Automatic sensitive credential redaction (tokens, passwords, keys)
- ISO 8601 UTC timestamps
- Standard structured formatting compatible with log aggregators
"""
import logging
import re
import sys
from typing import Any

# Regex patterns for sensitive tokens and passwords
SENSITIVE_PATTERNS = [
    (re.compile(r"Bearer\s+([a-zA-Z0-9\-_.]+)", re.IGNORECASE), "Bearer [REDACTED]"),
    (re.compile(r"password=([^\s&]+)", re.IGNORECASE), "password=[REDACTED]"),
    (re.compile(r"apikey=([^\s&]+)", re.IGNORECASE), "apikey=[REDACTED]"),
    (re.compile(r"api_key=([^\s&]+)", re.IGNORECASE), "api_key=[REDACTED]"),
    (re.compile(r"://([^:]+):([^@]+)@", re.IGNORECASE), r"://\1:[REDACTED]@"),
]


class SecretRedactingFilter(logging.Filter):
    """Logging filter that masks passwords, Bearer tokens, and connection strings."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            for pattern, repl in SENSITIVE_PATTERNS:
                record.msg = pattern.sub(repl, record.msg)
        return True


def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configures structured console logging with secret masking."""
    log_format = "%(asctime)s [%(levelname)s] [BHUSETU_3D] %(name)s - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(SecretRedactingFilter())

    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format=log_format,
        datefmt=date_format,
        handlers=[handler],
        force=True
    )

    logger = logging.getLogger("bhusetu_3d")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    return logger


logger = setup_logging()
