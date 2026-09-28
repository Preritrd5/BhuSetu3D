"""
BhuSetu 3D Ingestion Schemas
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 4: Data Ingestion & GIS Processing Pipeline
"""
from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class DatasetType(str, Enum):
    PARCEL = "PARCEL"
    BUILDING = "BUILDING"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    REGION = "REGION"
    RASTER = "RASTER"


class IngestionJobStatus(str, Enum):
    CREATED = "CREATED"
    VALIDATING = "VALIDATING"
    PROCESSING = "PROCESSING"
    VALIDATED = "VALIDATED"
    NORMALIZING = "NORMALIZING"
    LOADING = "LOADING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# --- Data Source Schemas ---
class DataSourceCreate(BaseModel):
    name: str = Field(..., max_length=150)
    organization_type: str = Field(..., max_length=50, description="GOVERNMENT, MUNICIPAL, PRIVATE_SURVEY, ACADEMIC")
    trust_level: str = Field(default="AUTHORITATIVE", max_length=30)
    contact_email: Optional[str] = Field(None, max_length=255)


class DataSourceResponse(BaseModel):
    id: UUID
    name: str
    organization_type: str
    trust_level: str
    contact_email: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Dataset Schemas ---
class DatasetCreate(BaseModel):
    source_id: UUID
    city_id: UUID
    name: str = Field(..., max_length=200)
    dataset_type: DatasetType
    acquisition_date: date
    sensor_details: Optional[str] = Field(None, max_length=200)
    storage_uri: str = Field(..., description="URI or path where source file is archived")


class DatasetResponse(BaseModel):
    id: UUID
    source_id: UUID
    city_id: UUID
    name: str
    dataset_type: str
    acquisition_date: date
    sensor_details: Optional[str] = None
    storage_uri: str
    spatial_coverage_geojson: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- File Upload & Inspection Schemas ---
class FileInspectionResult(BaseModel):
    detected_format: str
    file_name: str
    file_size_bytes: int
    file_hash: str
    feature_count: Optional[int] = None
    geometry_types: List[str] = Field(default_factory=list)
    detected_crs: Optional[str] = None
    bounds: Optional[List[float]] = None  # [minx, miny, maxx, maxy]
    columns: List[str] = Field(default_factory=list)
    raster_metadata: Optional[Dict[str, Any]] = None
    valid: bool = True
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)


class FileUploadResponse(BaseModel):
    file_id: str
    file_name: str
    file_size_bytes: int
    file_hash: str
    inspection: FileInspectionResult
    is_duplicate: bool = False
    existing_job_id: Optional[UUID] = None


# --- Quality Report Schemas ---
class GeometryQualityReport(BaseModel):
    valid_count: int = 0
    invalid_count: int = 0
    repaired_count: int = 0
    empty_count: int = 0


class AttributeQualityReport(BaseModel):
    mapped_columns: List[str] = Field(default_factory=list)
    missing_required_columns: List[str] = Field(default_factory=list)
    unmapped_columns: List[str] = Field(default_factory=list)


class CrsQualityReport(BaseModel):
    source_crs: Optional[str] = None
    target_crs: str = "EPSG:4326"
    reprojected: bool = False


class DatabaseQualityReport(BaseModel):
    inserted_count: int = 0
    updated_count: int = 0
    skipped_count: int = 0


class IngestionQualityReport(BaseModel):
    total_records: int = 0
    accepted_records: int = 0
    rejected_records: int = 0
    warning_records: int = 0
    geometry: GeometryQualityReport = Field(default_factory=GeometryQualityReport)
    attributes: AttributeQualityReport = Field(default_factory=AttributeQualityReport)
    crs: CrsQualityReport = Field(default_factory=CrsQualityReport)
    database: DatabaseQualityReport = Field(default_factory=DatabaseQualityReport)
    rejection_details: List[Dict[str, Any]] = Field(default_factory=list)


# --- Ingestion Job Schemas ---
class JobCreateRequest(BaseModel):
    file_id: str = Field(..., description="ID returned from POST /upload")
    dataset_type: DatasetType
    dataset_id: Optional[UUID] = None
    source_id: Optional[UUID] = None
    city_id: Optional[UUID] = None
    region_id: Optional[UUID] = None
    manual_crs: Optional[str] = Field(None, description="Explicit CRS (e.g. EPSG:32643) if source CRS missing")
    validate_only: bool = Field(False, description="If true, only validate without writing to canonical tables")


class JobLogEntry(BaseModel):
    timestamp: str
    level: str
    stage: str
    message: str


class IngestionJobResponse(BaseModel):
    id: UUID
    dataset_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    file_name: str
    file_size_bytes: int
    file_hash: str
    dataset_type: str
    status: str
    stage: str
    progress_percent: int
    source_crs: Optional[str] = None
    target_crs: str
    records_total: int
    records_accepted: int
    records_rejected: int
    records_warnings: int
    quality_report: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    processing_version: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class JobLogsResponse(BaseModel):
    job_id: UUID
    status: str
    stage: str
    logs: List[Dict[str, Any]] = Field(default_factory=list)
