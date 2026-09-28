"""
BhuSetu 3D Property Domain & Spatial Schemas
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Integration + Property Data Model
"""
from typing import List, Optional, Dict, Any
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, Field


# ============================================================================
# 1. City Schemas
# ============================================================================

class CitySummary(BaseModel):
    id: str
    code: str
    name: str
    state: str
    country: str
    default_srid: int


class CityDetail(CitySummary):
    bounds_geojson: Optional[Dict[str, Any]] = None
    regions_count: int = 0
    created_at: datetime
    updated_at: datetime


class CityCreate(BaseModel):
    code: str = Field(..., max_length=10)
    name: str = Field(..., max_length=100)
    state: str = Field(..., max_length=100)
    country: str = Field(default="India", max_length=100)
    default_srid: int = Field(default=4326)
    bounds_geojson: Optional[Dict[str, Any]] = None


# ============================================================================
# 2. Region Schemas
# ============================================================================

class RegionSummary(BaseModel):
    id: str
    city_id: str
    code: str
    name: str


class RegionDetail(RegionSummary):
    boundary_geojson: Optional[Dict[str, Any]] = None
    created_at: datetime


# ============================================================================
# 3. Unit Schemas
# ============================================================================

class UnitSummary(BaseModel):
    id: str
    floor_id: str
    building_id: str
    parcel_id: str
    ulpin_3d: str
    unit_number: str
    unit_type: str
    carpet_area_sqm: float
    verification_status: str


class UnitDetail(UnitSummary):
    spatial_centroid_geojson: Optional[Dict[str, Any]] = None
    geom_3d_geojson: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class UnitCreate(BaseModel):
    floor_id: str
    building_id: str
    parcel_id: str
    ulpin_3d: str = Field(..., max_length=50)
    unit_number: str = Field(..., max_length=50)
    unit_type: str = Field(..., max_length=50)
    carpet_area_sqm: float = Field(..., gt=0)
    spatial_centroid_geojson: Dict[str, Any]
    geom_3d_geojson: Optional[Dict[str, Any]] = None


# ============================================================================
# 4. Floor Schemas
# ============================================================================

class FloorDetail(BaseModel):
    id: str
    building_id: str
    floor_number: int
    floor_code: str
    base_elevation: float
    ceiling_elevation: float
    floor_height: float
    floor_area_sqm: float
    geom_3d_geojson: Optional[Dict[str, Any]] = None
    units: List[UnitSummary] = []
    created_at: datetime


class FloorCreate(BaseModel):
    building_id: str
    floor_number: int
    floor_code: str = Field(..., max_length=20)
    base_elevation: float
    ceiling_elevation: float
    floor_height: float = Field(..., gt=0)
    floor_area_sqm: float = Field(..., gt=0)
    geom_3d_geojson: Optional[Dict[str, Any]] = None


# ============================================================================
# 5. Building Schemas
# ============================================================================

class BuildingSummary(BaseModel):
    id: str
    parcel_id: str
    building_code: str
    name: Optional[str] = None
    building_type: str
    ground_elevation: float
    building_height: float
    detected_floors: int
    sanctioned_floors: int


class BuildingDetail(BuildingSummary):
    footprint_geojson: Optional[Dict[str, Any]] = None
    geom_3d_geojson: Optional[Dict[str, Any]] = None
    floors: List[FloorDetail] = []
    created_at: datetime
    updated_at: datetime


class BuildingCreate(BaseModel):
    parcel_id: str
    building_code: str = Field(..., max_length=50)
    name: Optional[str] = None
    building_type: str = Field(..., max_length=50)
    footprint_geojson: Dict[str, Any]
    ground_elevation: float
    building_height: float = Field(..., gt=0)
    detected_floors: int = Field(..., ge=0)
    sanctioned_floors: int = Field(..., ge=0)
    geom_3d_geojson: Optional[Dict[str, Any]] = None


# ============================================================================
# 6. Parcel Schemas
# ============================================================================

class ParcelSummary(BaseModel):
    id: str
    city_id: str
    region_id: str
    ulpin_2d: str
    survey_number: str
    recorded_area_sqm: float
    computed_area_sqm: float
    land_use: str
    elevation_base: float
    buildings_count: int = 0


class ParcelDetail(ParcelSummary):
    geom_2d_geojson: Optional[Dict[str, Any]] = None
    buildings: List[BuildingSummary] = []
    infrastructure_ids: List[str] = []
    created_at: datetime
    updated_at: datetime


class ParcelCreate(BaseModel):
    city_id: str
    region_id: str
    ulpin_2d: str = Field(..., max_length=20)
    survey_number: str = Field(..., max_length=100)
    recorded_area_sqm: float = Field(..., gt=0)
    computed_area_sqm: Optional[float] = None
    land_use: str = Field(..., max_length=50)
    geom_2d_geojson: Dict[str, Any]
    elevation_base: float = Field(default=0.0)


# ============================================================================
# 7. Infrastructure Schemas
# ============================================================================

class InfrastructureSummary(BaseModel):
    id: str
    city_id: str
    name: str
    utility_category: str
    is_subsurface: bool
    depth_meters: float
    evidence_source_type: str


class InfrastructureDetail(InfrastructureSummary):
    geom_spatial_geojson: Optional[Dict[str, Any]] = None
    intersecting_parcel_ids: List[str] = []
    created_at: datetime


# ============================================================================
# 8. RPC Responses
# ============================================================================

class EncroachmentCheckResponse(BaseModel):
    has_encroachment: bool
    encroachment_area_sqm: float
    encroachment_geojson: Optional[Dict[str, Any]] = None
    severity: str


# ============================================================================
# 9. Phase 5 2D Map & Property Explorer Schemas
# ============================================================================

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: str
    geometry: Dict[str, Any]
    properties: Dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature] = []
    bbox: Optional[List[float]] = None
    total_count: int = 0


class PropertySearchResult(BaseModel):
    id: str
    ulpin_2d: str
    survey_number: str
    land_use: str
    recorded_area_sqm: float
    city_name: str
    region_name: str
    buildings_count: int = 0
    center: List[float] = Field(..., description="[longitude, latitude]")
    bbox: Optional[List[float]] = Field(None, description="[min_lon, min_lat, max_lon, max_lat]")


class FilterOptionsResponse(BaseModel):
    cities: List[Dict[str, str]] = []
    regions: List[Dict[str, str]] = []
    land_uses: List[str] = []


# ============================================================================
# 10. Spatial Hierarchy Outliner Tree Schemas
# ============================================================================

class SpatialElementNode(BaseModel):
    id: str
    name: str
    type: str  # "ROOM", "HALL", "CORRIDOR", "DOOR", "WINDOW"
    area_sqm: Optional[float] = None
    dimensions: Optional[str] = None
    material: Optional[str] = None
    fire_rating: Optional[str] = None
    glazing: Optional[str] = None
    elements: Optional[List["SpatialElementNode"]] = None


class UnitHierarchyNode(BaseModel):
    id: str
    floor_id: str
    building_id: str
    parcel_id: str
    ulpin_3d: str
    unit_number: str
    unit_label: Optional[str] = None
    unit_type: str
    carpet_area_sqm: float
    built_up_area_sqm: Optional[float] = None
    verification_status: str
    status_3d: Optional[str] = "AVAILABLE"
    spatial_elements: List[SpatialElementNode] = []


class FloorHierarchyNode(BaseModel):
    id: str
    building_id: str
    floor_number: int
    floor_code: str
    floor_label: Optional[str] = None
    base_elevation: float
    ceiling_elevation: float
    floor_height: float
    floor_area_sqm: float
    status_3d: Optional[str] = "AVAILABLE"
    is_unsanctioned: bool = False
    units: List[UnitHierarchyNode] = []


class BuildingHierarchyNode(BaseModel):
    id: str
    parcel_id: str
    building_code: str
    name: str
    building_type: str
    ground_elevation: float
    building_height: float
    detected_floors: int
    sanctioned_floors: int
    has_discrepancy: bool = False
    status_3d: Optional[str] = "EXTRUDED_3D"
    floors: List[FloorHierarchyNode] = []


class ParcelHierarchyNode(BaseModel):
    id: str
    city_id: str
    region_id: str
    ulpin_2d: str
    survey_number: str
    land_use: str
    recorded_area_sqm: float
    computed_area_sqm: float
    elevation_base: float
    buildings: List[BuildingHierarchyNode] = []


class RegionHierarchyNode(BaseModel):
    id: str
    city_id: str
    code: str
    name: str
    parcels: List[ParcelHierarchyNode] = []


class CityHierarchyNode(BaseModel):
    id: str
    code: str
    name: str
    state: str
    country: str
    regions: List[RegionHierarchyNode] = []


class SpatialHierarchyTreeResponse(BaseModel):
    city: CityHierarchyNode
    total_parcels: int
    total_buildings: int
    total_floors: int
    total_units: int


SpatialElementNode.model_rebuild()

