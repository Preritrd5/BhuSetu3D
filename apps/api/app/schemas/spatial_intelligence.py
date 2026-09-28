"""
BhuSetu 3D Spatial Intelligence Schemas
PostGIS Spatial Truth & Digital Twin Provenance
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CentroidPoint(BaseModel):
    longitude: float = Field(..., description="WGS 84 longitude in decimal degrees")
    latitude: float = Field(..., description="WGS 84 latitude in decimal degrees")


class SpatialSourceProvenance(BaseModel):
    provenance_status: str = Field(default="ILLUSTRATIVE", description="Data status: AUTHORITATIVE or ILLUSTRATIVE")
    source_type: str = Field(default="DEMO_SYNTHETIC", description="Source classification: DEMO_SYNTHETIC or SURVEY_GROUND_TRUTH")
    confidence_score: float = Field(default=0.95, description="Confidence metric from 0.0 to 1.0")
    crs: str = Field(default="EPSG:4326 (WGS 84)", description="Coordinate Reference System")
    authority: str = Field(default="BBMP / Survey of India (Illustrative Digital Twin)", description="Jurisdictional authority")
    disclaimer: str = Field(
        default="PostGIS spatial operations (ST_Within, ST_Area, ST_Distance, ST_DWithin) computed deterministically on digital-twin geometry.",
        description="Authentic provenance and data disclaimer"
    )


class NearbyBuildingItem(BaseModel):
    id: str
    building_code: str
    name: str
    building_type: str
    distance_meters: float


class NearbyParcelItem(BaseModel):
    id: str
    ulpin: str
    survey_number: str
    land_use: str
    distance_meters: float


class ParentParcelIntelligence(BaseModel):
    parcel_id: str
    ulpin: str
    survey_number: str
    parcel_area_sqm: float
    is_contained: bool
    setback_distance_meters: float
    encroachment_status: str = "COMPLIANT"


class BuildingSpatialIntelligence(BaseModel):
    building_id: str
    building_code: str
    name: str
    typology: str
    centroid: CentroidPoint
    footprint_area_sqm: float
    building_height: float
    sanctioned_floors: int
    detected_floors: int
    has_conflict: bool
    parent_parcel: Optional[ParentParcelIntelligence] = None
    nearby_buildings: List[NearbyBuildingItem] = []
    spatial_source: SpatialSourceProvenance = Field(default_factory=SpatialSourceProvenance)


class ParcelSpatialIntelligence(BaseModel):
    parcel_id: str
    ulpin: str
    survey_number: str
    land_use: str
    centroid: CentroidPoint
    computed_area_sqm: float
    recorded_area_sqm: float
    area_discrepancy_sqm: float
    buildings_count: int
    building_codes: List[str] = []
    nearby_parcels: List[NearbyParcelItem] = []
    spatial_source: SpatialSourceProvenance = Field(default_factory=SpatialSourceProvenance)


class ViewportSpatialSummary(BaseModel):
    bbox: List[float]
    parcels_count: int
    buildings_count: int
    parcels: List[Dict[str, Any]] = []
    buildings: List[Dict[str, Any]] = []
    spatial_source: SpatialSourceProvenance = Field(default_factory=SpatialSourceProvenance)
