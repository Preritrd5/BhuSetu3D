"""
BhuSetu 3D Core Security & Supabase JWT Verification
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 2: Authentication, Authorization & Application Shell
"""
from typing import Dict, Any, Optional
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
import httpx
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.logging import logger


class SupabaseTokenVerifier:
    """Cryptographically verifies Supabase Auth tokens."""

    @staticmethod
    def decode_local_jwt(token: str, secret: str) -> Optional[Dict[str, Any]]:
        """Verifies JWT locally if Supabase JWT secret is configured."""
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            return payload
        except ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Your session has expired. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    @staticmethod
    async def verify_with_supabase_auth(token: str) -> Dict[str, Any]:
        """
        Validates token directly against Supabase Auth gateway:
        GET /auth/v1/user
        Ensures 100% cryptographic validation without requiring a shared local secret.
        """
        url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user"
        headers = {
            "Authorization": f"Bearer {token}",
            "apikey": settings.SUPABASE_PUBLISHABLE_KEY
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "sub": data.get("id"),
                        "email": data.get("email"),
                        "aud": data.get("aud", "authenticated"),
                        "user_metadata": data.get("user_metadata", {})
                    }
                elif response.status_code in (401, 403):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Session invalid or expired. Please sign in again.",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                else:
                    logger.error(f"Supabase Auth gateway returned unexpected status: {response.status_code}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Authentication service verification failed.",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
        except httpx.RequestError as exc:
            logger.error(f"Network error verifying token with Supabase Auth: {exc}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication provider temporarily unavailable. Please retry.",
            )


async def verify_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Main entry point for verifying a Supabase Auth Bearer token.
    Uses local secret if token is signed with HS256, otherwise validates with Supabase Auth service (ES256/asymmetric).
    """
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Inspect token algorithm header
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
    except Exception:
        alg = None

    # 1. If token is signed with symmetric HS256 and secret is provided, verify locally
    if alg == "HS256" and settings.SUPABASE_JWT_SECRET:
        try:
            return SupabaseTokenVerifier.decode_local_jwt(token, settings.SUPABASE_JWT_SECRET)
        except Exception:
            pass

    # 2. For modern Supabase asymmetric tokens (e.g. ES256) or fallback: verify directly with Supabase Auth endpoint
    return await SupabaseTokenVerifier.verify_with_supabase_auth(token)
