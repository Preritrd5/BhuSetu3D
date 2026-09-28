"""
BhuSetu 3D AI Building Extraction & 3D Schemas
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 6: AI Building Extraction + 3D Generation
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class ExtractionJobCreate(BaseModel):
    dataset_id: Optional[UUID] = None
    file_path: Optional[str] = Field(None, description="Path to staged orthophoto / drone GeoTIFF")
    model_name: str = Field(default="building-segmentation-unet", description="Model architecture")
    model_version: str = Field(default="v1.0", description="Model version")
    confidence_threshold: float = Field(default=0.5, ge=0.1, le=1.0, description="Minimum segmentation probability")
    min_area_sqm: float = Field(default=15.0, ge=1.0, description="Minimum building area in square meters")
    dsm_file_path: Optional[str] = Field(None, description="Digital Surface Model raster path")
    dem_file_path: Optional[str] = Field(None, description="Digital Elevation Model raster path")
    default_height_m: Optional[float] = Field(None, ge=1.0, le=500.0, description="Optional demonstrative/illustrative height")


class ExtractionJobResponse(BaseModel):
    id: UUID
    dataset_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    model_name: str
    model_version: str
    status: str
    stage: str
    progress_percent: int
    buildings_detected: int = 0
    buildings_extracted: int = 0
    buildings_rejected: int = 0
    buildings_3d_generated: int = 0
    execution_logs: List[Dict[str, Any]] = Field(default_factory=list)
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Generate3DRequest(BaseModel):
    height_m: Optional[float] = Field(None, ge=1.0, le=500.0)
    ground_elevation_m: Optional[float] = Field(None, ge=-50.0, le=9000.0)
    height_source: Optional[str] = Field("SURVEY", description="SURVEY, DSM_DEM_DIFFERENCE, ATTRIBUTE, ILLUSTRATIVE_ASSUMED")


class Building3DResponse(BaseModel):
    id: UUID
    parcel_id: UUID
    building_code: str
    name: Optional[str] = None
    building_type: str
    footprint_geojson: Optional[Dict[str, Any]] = None
    geom_3d_wkt: Optional[str] = None
    ground_elevation: float
    building_height: float
    detected_floors: int
    sanctioned_floors: int
    height_source: Optional[str] = None
    extraction_method: Optional[str] = None
    confidence_score: Optional[float] = None
    processing_version: Optional[str] = None
    status_3d: str = "FOOTPRINT_ONLY"
    metadata_json: Optional[Dict[str, Any]] = None
    parent_parcel_ulpin: Optional[str] = None
    parent_parcel_survey: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BuildingCandidateResult(BaseModel):
    candidate_id: str
    footprint_geojson: Dict[str, Any]
    area_sqm: float
    confidence: float
    parcel_id: Optional[UUID] = None
    association_status: str = "UNMATCHED"
    overlap_ratio: float = 0.0
    estimated_height_m: Optional[float] = None
    height_source: str = "UNKNOWN"
