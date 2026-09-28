"""
ASTATINE Health Schemas
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 1: Project Foundation
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(description="Service status: ok, degraded, or error")
    service: str = Field(description="Name of the service", default="astatine-api")
    version: str = Field(description="Application version", default="1.0.0")
    environment: str = Field(description="Runtime environment (development, staging, production)")


class DatabaseHealthResponse(BaseModel):
    status: str = Field(description="Database health: connected, unavailable, or error")
    connected: bool = Field(description="True if TCP and authentication probe succeeded")
    database_type: str = Field(description="Underlying database platform (PostgreSQL)")
    database_version: Optional[str] = Field(default=None, description="PostgreSQL version string")
    postgis_enabled: bool = Field(description="True if PostGIS extension is installed and loaded")
    postgis_version: Optional[str] = Field(default=None, description="Installed PostGIS version")
    error: Optional[str] = Field(default=None, description="Error detail if connection failed")


class SystemHealthResponse(BaseModel):
    service: str = "astatine-api"
    version: str = "1.0.0"
    environment: str
    api_status: str
    database: DatabaseHealthResponse
    timestamp: str
