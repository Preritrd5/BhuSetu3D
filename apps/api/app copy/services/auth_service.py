"""
BhuSetu 3D Authentication Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 2: Authentication, Authorization & Application Shell
"""
import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.auth import AuthenticatedUserResponse, RoleInfo, AppRole
from app.core.logging import logger


class AuthService:
    """Orchestrates user identity resolution and role mapping against Supabase PostgreSQL."""

    @staticmethod
    async def resolve_application_user(
        db: AsyncSession,
        auth_user_id: str,
        email: str
    ) -> User:
        """
        Resolves the authenticated Supabase user to the canonical public.users record.
        Enforces account active status and links the Supabase Auth UUID if not yet bound.
        """
        parsed_uuid: Optional[uuid.UUID] = None
        try:
            parsed_uuid = uuid.UUID(auth_user_id)
        except (ValueError, TypeError):
            logger.warning(f"Could not parse auth_user_id as UUID: {auth_user_id}")

        # Construct query matching auth_user_id, id, or email
        conditions = [User.email == email.lower().strip()]
        if parsed_uuid:
            conditions.append(User.auth_user_id == parsed_uuid)
            conditions.append(User.id == parsed_uuid)

        stmt = select(User).where(or_(*conditions))
        result = await db.execute(stmt)
        user: Optional[User] = result.scalars().first()

        if not user:
            logger.warning(f"Authenticated Supabase user not authorized in public.users: {email} ({auth_user_id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is authenticated with Supabase, but is not yet authorized for BhuSetu 3D."
            )

        # Check account active status
        if not user.is_active:
            logger.warning(f"Deactivated user attempted access: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact your administrator."
            )

        # Establish permanent direct link if not yet bound
        if parsed_uuid and user.auth_user_id is None:
            user.auth_user_id = parsed_uuid
            try:
                await db.commit()
                await db.refresh(user)
                logger.info(f"Bound auth_user_id {parsed_uuid} to public.users record for {user.email}")
            except Exception as e:
                await db.rollback()
                logger.error(f"Error binding auth_user_id to user {user.id}: {e}")

        return user

    @staticmethod
    def map_user_to_response(user: User) -> AuthenticatedUserResponse:
        """Transforms database User model into the public authenticated user schema."""
        return AuthenticatedUserResponse(
            id=str(user.id),
            email=user.email,
            name=user.full_name,
            roles=[user.role],
            department=user.department,
            is_active=user.is_active
        )

    @staticmethod
    def get_role_definitions() -> List[RoleInfo]:
        """Provides metadata for the 6 locked application roles."""
        return [
            RoleInfo(
                role=AppRole.ADMIN,
                label="System Administrator",
                description="Platform administration, user management, and system configuration.",
                allowed_modules=["*"]
            ),
            RoleInfo(
                role=AppRole.SURVEYOR,
                label="Cadastral Surveyor",
                description="Field survey workflows, geometry submission, and evidence documentation.",
                allowed_modules=["overview", "properties", "evidence", "city-3d"]
            ),
            RoleInfo(
                role=AppRole.GOVERNMENT_OFFICER,
                label="Government Officer",
                description="Statutory land approvals, conflict resolution, and verification reviews.",
                allowed_modules=["overview", "properties", "conflicts", "verification", "history", "evidence"]
            ),
            RoleInfo(
                role=AppRole.PLANNER,
                label="Urban Planner",
                description="Zoning guidelines, 3D envelope compliance, and municipal infrastructure planning.",
                allowed_modules=["overview", "city-3d", "spatial-analysis", "properties"]
            ),
            RoleInfo(
                role=AppRole.ANALYST,
                label="Spatial Data Analyst",
                description="Multi-epoch trend analytics, data quality intelligence, and metric reports.",
                allowed_modules=["overview", "spatial-analysis", "history", "properties"]
            ),
            RoleInfo(
                role=AppRole.PUBLIC_USER,
                label="Public Citizen / Applicant",
                description="Restricted public portal access, ULPIN search, and certificate downloads.",
                allowed_modules=["overview", "properties"]
            ),
        ]
