"""
BhuSetu 3D Vertical Property Hierarchy & ULPIN Schemas
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 7: Vertical Property Mapping + 3D ULPIN Model
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class UnitHierarchyItem(BaseModel):
    id: str
    floor_id: str
    building_id: str
    parcel_id: str
    ulpin_3d: str = Field(..., description="Prototype 3D ULPIN identifier")
    unit_number: str
    unit_label: Optional[str] = None
    unit_type: str
    carpet_area_sqm: float
    has_centroid_z: bool = True
    centroid_z_coords: Optional[List[float]] = None
    has_geom_3d: bool = False
    verification_status: str = "PENDING"
    status_3d: str = "AVAILABLE"
    extraction_method: Optional[str] = None
    confidence_score: Optional[float] = None
    provenance_source: Optional[str] = None


class FloorHierarchyItem(BaseModel):
    id: str
    building_id: str
    floor_number: int
    floor_code: str
    floor_label: Optional[str] = None
    base_elevation: float
    ceiling_elevation: float
    floor_height: float
    floor_area_sqm: float
    status_3d: str = "AVAILABLE"
    height_source: Optional[str] = None
    extraction_method: Optional[str] = None
    confidence_score: Optional[float] = None
    units_count: int = 0
    units: List[UnitHierarchyItem] = []


class BuildingHierarchyItem(BaseModel):
    id: str
    parcel_id: str
    building_code: str
    name: Optional[str] = None
    building_type: str
    ground_elevation: float
    building_height: float
    top_elevation: float
    detected_floors: int
    sanctioned_floors: int
    status_3d: str
    height_source: Optional[str] = None
    extraction_method: Optional[str] = None
    confidence_score: Optional[float] = None
    floors_count: int = 0
    units_count: int = 0
    floors: List[FloorHierarchyItem] = []


class ParcelHierarchyItem(BaseModel):
    id: str
    ulpin_2d: str
    survey_number: str
    recorded_area_sqm: float
    computed_area_sqm: float
    land_use: str
    elevation_base: float
    city_name: Optional[str] = None
    region_code: Optional[str] = None
    buildings_count: int = 0


class CompletenessStatus(BaseModel):
    parcel: str = "AVAILABLE"
    building: str = "AVAILABLE"
    three_d_model: str = "AVAILABLE"
    floors: str = "AVAILABLE"
    units: str = "AVAILABLE"


class PropertyHierarchyResponse(BaseModel):
    property_id: str
    ulpin_oriented_id: str = Field(..., description="Deterministic ULPIN-oriented prototype identifier")
    identity_version: int = 1
    identity_status: str = "PROTOTYPE"
    disclaimer: str = "ULPIN-oriented prototype identifier for 3D technical spatial modeling. Does NOT claim official government ULPIN issuance."
    completeness: CompletenessStatus
    spatial_consistency: str = "VALID"
    parcel: ParcelHierarchyItem
    buildings: List[BuildingHierarchyItem] = []


class VerticalValidationCheck(BaseModel):
    check_name: str
    status: str  # PASSED, FAILED, WARNING, UNAVAILABLE
    detail: str


class VerticalValidationResult(BaseModel):
    is_valid: bool
    entity_type: str
    entity_id: str
    checks: List[VerticalValidationCheck] = []
    discrepancies: List[str] = []


class FloorCreateRequest(BaseModel):
    building_id: str
    floor_number: int
    floor_code: str
    floor_label: Optional[str] = None
    base_elevation: float
    ceiling_elevation: float
    floor_height: Optional[float] = None
    floor_area_sqm: float
    height_source: Optional[str] = "SURVEY"
    extraction_method: Optional[str] = "DERIVED"
    confidence_score: Optional[float] = None


class UnitCreateRequest(BaseModel):
    floor_id: str
    building_id: str
    parcel_id: str
    unit_number: str
    unit_label: Optional[str] = None
    unit_type: str = "RESIDENTIAL"
    carpet_area_sqm: float
    lon: float
    lat: float
    elevation_z: float
    ulpin_3d: Optional[str] = None
    confidence_score: Optional[float] = None
