"""
BhuSetu 3D Common API Schemas
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Integration + Property Data Model
"""
from typing import Generic, TypeVar, List, Optional, Any, Dict
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number starting at 1")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page (max 100)")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class GeoJSONGeometry(BaseModel):
    type: str = Field(..., description="GeoJSON geometry type (e.g. Polygon, MultiPolygon, Point)")
    coordinates: Any = Field(..., description="Coordinate array")
