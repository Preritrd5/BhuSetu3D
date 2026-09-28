"""
BhuSetu 3D Authentication & Authorization Endpoints
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 2: Authentication, Authorization & Application Shell
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from app.models.user import User
from app.schemas.auth import (
    AuthenticatedUserResponse,
    RolesListResponse,
    AppRole,
)
from app.services.auth_service import AuthService
from app.dependencies.auth import (
    get_current_user,
    require_role,
    require_any_role,
)

router = APIRouter(prefix="/auth", tags=["Authentication & Authorization"])


@router.get(
    "/me",
    response_model=AuthenticatedUserResponse,
    summary="Get authenticated application user profile and roles",
    description="Resolves Supabase Auth JWT identity against public.users and returns the user's role."
)
async def get_my_profile(
    current_user: User = Depends(get_current_user)
) -> AuthenticatedUserResponse:
    """Returns the authenticated user's authoritative profile and role assignments."""
    return AuthService.map_user_to_response(current_user)


@router.get(
    "/roles",
    response_model=RolesListResponse,
    summary="List canonical platform roles and permissions",
    description="Returns metadata for the 6 locked application roles in BhuSetu 3D."
)
async def list_roles() -> RolesListResponse:
    """Returns list of canonical platform roles."""
    roles = AuthService.get_role_definitions()
    return RolesListResponse(roles=roles)


@router.get(
    "/verify-role/{role_name}",
    response_model=Dict[str, Any],
    summary="Probe endpoint for testing role authorization",
    description="Verifies if the currently authenticated user possesses the specified role."
)
async def verify_user_role(
    role_name: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Verification probe for role authorization testing."""
    has_permission = (current_user.role == "ADMIN") or (current_user.role == role_name.upper())
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Restricted: Your role '{current_user.role}' is not authorized for '{role_name}'."
        )
    return {
        "status": "authorized",
        "user_id": str(current_user.id),
        "user_email": current_user.email,
        "user_role": current_user.role,
        "tested_role": role_name.upper()
    }
