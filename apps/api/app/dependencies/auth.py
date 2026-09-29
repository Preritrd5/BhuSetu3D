"""
BhuSetu 3D Authentication & Authorization Dependencies
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 2: Authentication, Authorization & Application Shell
"""
from typing import Dict, Any, List, Callable, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.models.user import User
from app.core.security import verify_supabase_jwt
from app.services.auth_service import AuthService
from app.core.logging import logger

security_scheme = HTTPBearer(auto_error=False)


async def get_token_claims(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> Dict[str, Any]:
    """
    Extracts and cryptographically validates the Supabase Auth Bearer JWT.
    Raises HTTP 401 if missing, expired, or invalid.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    claims = await verify_supabase_jwt(token)
    return claims


async def get_current_user(
    claims: Dict[str, Any] = Depends(get_token_claims),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Resolves the authenticated Supabase user against the canonical public.users table.
    Enforces active status and identity binding.
    """
    auth_user_id = claims.get("sub")
    email = claims.get("email")

    if not auth_user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing essential identity claims.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await AuthService.resolve_application_user(
        db=db,
        auth_user_id=auth_user_id,
        email=email
    )
    return user


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Optional user resolution. Returns None if unauthenticated or token invalid.
    """
    if not credentials or not credentials.credentials:
        return None
    try:
        claims = await verify_supabase_jwt(credentials.credentials)
        auth_user_id = claims.get("sub")
        email = claims.get("email")
        if not auth_user_id or not email:
            return None
        return await AuthService.resolve_application_user(
            db=db,
            auth_user_id=auth_user_id,
            email=email
        )
    except Exception:
        return None


ROLE_ALIASES = {
    "GOVERNMENT_OFFICER": {"GOVERNMENT_OFFICER", "OFFICER"},
    "OFFICER": {"GOVERNMENT_OFFICER", "OFFICER"},
}


def require_role(required_role: str) -> Callable:
    """
    Dependency factory enforcing a specific role requirement.
    ADMIN role always has access across all endpoints.
    Normalizes aliases (e.g. OFFICER and GOVERNMENT_OFFICER).
    """
    valid_roles = ROLE_ALIASES.get(required_role.upper(), {required_role.upper()})

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == "ADMIN":
            return current_user
        user_roles = ROLE_ALIASES.get(current_user.role.upper(), {current_user.role.upper()})
        if not user_roles.intersection(valid_roles):
            logger.warning(
                f"Access denied for user {current_user.email} (Role: {current_user.role}). Required: {required_role}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Restricted: This action requires the '{required_role}' role."
            )
        return current_user

    return role_checker


def require_any_role(allowed_roles: List[str]) -> Callable:
    """
    Dependency factory enforcing that the user possesses at least one of the allowed roles.
    ADMIN role always possesses access.
    Normalizes aliases (e.g. OFFICER and GOVERNMENT_OFFICER).
    """
    valid_roles = set()
    for r in allowed_roles:
        valid_roles.update(ROLE_ALIASES.get(r.upper(), {r.upper()}))

    async def multi_role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == "ADMIN":
            return current_user
        user_roles = ROLE_ALIASES.get(current_user.role.upper(), {current_user.role.upper()})
        if not user_roles.intersection(valid_roles):
            logger.warning(
                f"Access denied for user {current_user.email} (Role: {current_user.role}). Allowed: {allowed_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Restricted: Your role '{current_user.role}' is not authorized for this resource."
            )
        return current_user

    return multi_role_checker
