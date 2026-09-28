"""
BhuSetu 3D AI Spatial Investigator API Routes
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 10: Natural-Language Spatial Query + AI Spatial Investigator
"""
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.dependencies.auth import security_scheme
from app.models.user import User
from app.core.security import verify_supabase_jwt
from app.services.auth_service import AuthService
from app.schemas.spatial_investigator import (
    InvestigationRequest,
    InvestigationResponse,
    SuggestedQuestion,
)
from app.services.investigator_service import SpatialInvestigatorService

router = APIRouter(prefix="/spatial-investigator", tags=["AI Spatial Investigator"])


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Resolves authenticated user if valid token present, otherwise returns None."""
    if not credentials or not credentials.credentials:
        return None
    try:
        claims = await verify_supabase_jwt(credentials.credentials)
        auth_user_id = claims.get("sub")
        email = claims.get("email")
        if auth_user_id and email:
            return await AuthService.resolve_application_user(db, auth_user_id, email)
    except Exception:
        pass
    return None


@router.post(
    "/query",
    response_model=InvestigationResponse,
    summary="Natural Language Spatial Query Investigation",
    description="Processes natural-language queries through structured spatial intent parsing, PostGIS execution, and grounded AI explanation."
)
async def execute_spatial_investigation(
    request: InvestigationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
) -> InvestigationResponse:
    user_id = current_user.id if current_user else None
    return await SpatialInvestigatorService.investigate(db, request, user_id=user_id)


@router.get(
    "/suggested-questions",
    response_model=List[SuggestedQuestion],
    summary="Get Curated Spatial Investigation Questions",
    description="Returns pre-curated natural language questions for quick investigation prompts."
)
async def list_suggested_questions() -> List[SuggestedQuestion]:
    return SpatialInvestigatorService.get_suggested_questions()


@router.get(
    "/history",
    summary="Get Spatial Investigation History",
    description="Retrieves recent investigation requests from the audit log."
)
async def list_investigation_history(
    limit: int = Query(15, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
) -> List[Dict[str, Any]]:
    return await SpatialInvestigatorService.get_history(db, limit=limit)
