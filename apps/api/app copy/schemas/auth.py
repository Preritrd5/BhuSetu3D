"""
BhuSetu 3D Authentication & Authorization Schemas
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 2: Authentication, Authorization & Application Shell
"""
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class AppRole(str, Enum):
    ADMIN = "ADMIN"
    SURVEYOR = "SURVEYOR"
    GOVERNMENT_OFFICER = "GOVERNMENT_OFFICER"
    PLANNER = "PLANNER"
    ANALYST = "ANALYST"
    PUBLIC_USER = "PUBLIC_USER"


class AuthenticatedUserResponse(BaseModel):
    """
    Standardized authenticated user representation returned to the frontend.
    Contains no secrets, passwords, or service-role keys.
    """
    id: str = Field(..., description="Application user UUID from public.users")
    email: str = Field(..., description="User's verified email address")
    name: str = Field(..., description="User's full name")
    roles: List[str] = Field(..., description="Assigned application roles")
    department: Optional[str] = Field(None, description="Government department or agency")
    is_active: bool = Field(True, description="Account active status")


class RoleInfo(BaseModel):
    role: AppRole
    label: str
    description: str
    allowed_modules: List[str]


class RolesListResponse(BaseModel):
    roles: List[RoleInfo]


class AuthErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
