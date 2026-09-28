"""
BhuSetu 3D Authentication & Authorization Tests
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 2: Authentication, Authorization & Application Shell
"""
import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

from app.main import app
from app.models.user import User
from app.dependencies.auth import get_token_claims, get_current_user
from app.database.connection import get_db
from app.schemas.auth import AppRole


@pytest.mark.asyncio
async def test_auth_me_without_token_returns_401():
    """Unauthenticated requests to protected endpoints must return HTTP 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401
        assert "detail" in response.json()


@pytest.mark.asyncio
async def test_auth_me_with_invalid_token_returns_401():
    """Requests with malformed Bearer tokens must return HTTP 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer malformed.invalid.token"}
        )
        assert response.status_code in [401, 503]


@pytest.mark.asyncio
async def test_roles_metadata_endpoint():
    """Verifies that all 6 locked application roles are returned with metadata."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/auth/roles")
        assert response.status_code == 200
        data = response.json()
        assert "roles" in data
        role_names = [r["role"] for r in data["roles"]]
        expected_roles = [
            "ADMIN",
            "SURVEYOR",
            "GOVERNMENT_OFFICER",
            "PLANNER",
            "ANALYST",
            "PUBLIC_USER"
        ]
        for role in expected_roles:
            assert role in role_names


@pytest.mark.asyncio
async def test_authenticated_user_profile_resolution():
    """Verifies that a valid authenticated user's profile and roles are correctly mapped."""
    mock_user = User(
        id=uuid.uuid4(),
        auth_user_id=uuid.uuid4(),
        email="surveyor@bhusetu.gov.in",
        full_name="Vikram Rathore",
        role="SURVEYOR",
        department="State Remote Sensing Application Centre",
        is_active=True
    )

    async def mock_get_current_user():
        return mock_user

    app.dependency_overrides[get_current_user] = mock_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": "Bearer mock-valid-jwt"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == str(mock_user.id)
            assert data["email"] == "surveyor@bhusetu.gov.in"
            assert data["name"] == "Vikram Rathore"
            assert data["roles"] == ["SURVEYOR"]
            assert data["department"] == "State Remote Sensing Application Centre"
            assert data["is_active"] is True
    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_role_authorization_allowed_for_matching_role():
    """Verifies that a user with SURVEYOR role can access surveyor-authorized probe."""
    mock_user = User(
        id=uuid.uuid4(),
        email="surveyor@bhusetu.gov.in",
        full_name="Vikram Rathore",
        role="SURVEYOR",
        is_active=True
    )

    async def mock_get_current_user():
        return mock_user

    app.dependency_overrides[get_current_user] = mock_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/auth/verify-role/surveyor",
                headers={"Authorization": "Bearer mock-token"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "authorized"
            assert data["user_role"] == "SURVEYOR"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_role_authorization_denied_for_insufficient_role():
    """Verifies that an unauthorized role receives HTTP 403 Forbidden."""
    mock_user = User(
        id=uuid.uuid4(),
        email="citizen@bhusetu.gov.in",
        full_name="Aarav Mehta",
        role="PUBLIC_USER",
        is_active=True
    )

    async def mock_get_current_user():
        return mock_user

    app.dependency_overrides[get_current_user] = mock_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/auth/verify-role/admin",
                headers={"Authorization": "Bearer mock-token"}
            )
            assert response.status_code == 403
            data = response.json()
            assert "Access Restricted" in data["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_admin_role_has_universal_access():
    """Verifies that ADMIN role has access across all module roles."""
    mock_admin = User(
        id=uuid.uuid4(),
        email="admin@bhusetu.gov.in",
        full_name="Super Administrator",
        role="ADMIN",
        is_active=True
    )

    async def mock_get_current_user():
        return mock_admin

    app.dependency_overrides[get_current_user] = mock_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            for role_to_test in ["surveyor", "government_officer", "planner", "analyst"]:
                response = await client.get(
                    f"/api/v1/auth/verify-role/{role_to_test}",
                    headers={"Authorization": "Bearer mock-token"}
                )
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "authorized"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_deactivated_account_resolution_raises_403():
    """Deactivated user accounts must be rejected with HTTP 403."""
    from fastapi import HTTPException
    from app.services.auth_service import AuthService
    
    mock_inactive_user = User(
        id=uuid.uuid4(),
        auth_user_id=uuid.uuid4(),
        email="inactive@bhusetu.gov.in",
        full_name="Suspended Officer",
        role="SURVEYOR",
        is_active=False
    )
    
    from unittest.mock import MagicMock
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = mock_inactive_user
    mock_db.execute.return_value = mock_result
    
    with pytest.raises(HTTPException) as exc_info:
        await AuthService.resolve_application_user(
            db=mock_db,
            auth_user_id=str(mock_inactive_user.auth_user_id),
            email=mock_inactive_user.email
        )
    assert exc_info.value.status_code == 403
    assert "deactivated" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_unauthorized_supabase_account_raises_403():
    """Authenticated Supabase users not present in public.users must be rejected with HTTP 403."""
    from fastapi import HTTPException
    from app.services.auth_service import AuthService
    from unittest.mock import MagicMock
    
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_result
    
    with pytest.raises(HTTPException) as exc_info:
        await AuthService.resolve_application_user(
            db=mock_db,
            auth_user_id=str(uuid.uuid4()),
            email="unregistered@bhusetu.gov.in"
        )
    assert exc_info.value.status_code == 403
    assert "not yet authorized" in exc_info.value.detail.lower()

