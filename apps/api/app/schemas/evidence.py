"""
BhuSetu 3D Evidence, Provenance & Confidence System Schemas
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 8: Evidence, Provenance & Source Tracking
"""
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class SourceClassification(str, Enum):
    """
    Controlled classification of source evidence.
    """
    OBSERVED = "OBSERVED"
    DERIVED = "DERIVED"
    AI_ASSISTED = "AI_ASSISTED"
    INFERRED = "INFERRED"
    VERIFIED = "VERIFIED"
    UNKNOWN = "UNKNOWN"


class SourceType(str, Enum):
    """
    Controlled source type categorization.
    """
    CADASTRAL_DATA = "CADASTRAL_DATA"
    GOVERNMENT_DATA = "GOVERNMENT_DATA"
    SURVEY_DATA = "SURVEY_DATA"
    GNSS_SURVEY = "GNSS_SURVEY"
    DRONE_IMAGERY = "DRONE_IMAGERY"
    SATELLITE_IMAGERY = "SATELLITE_IMAGERY"
    AERIAL_IMAGERY = "AERIAL_IMAGERY"
    DEM = "DEM"
    GIS_DATASET = "GIS_DATASET"
    BUILDING_DATASET = "BUILDING_DATASET"
    INFRASTRUCTURE_DATA = "INFRASTRUCTURE_DATA"
    USER_UPLOAD = "USER_UPLOAD"
    MANUAL_ENTRY = "MANUAL_ENTRY"
    GIS_DERIVED = "GIS_DERIVED"
    ML_DERIVED = "ML_DERIVED"
    AI_ASSISTED = "AI_ASSISTED"
    INFERRED = "INFERRED"
    SYSTEM_GENERATED = "SYSTEM_GENERATED"
    UNKNOWN = "UNKNOWN"


class EvidenceStatus(str, Enum):
    """
    Controlled lifecycle status of evidence items.
    """
    AVAILABLE = "AVAILABLE"
    PARTIAL = "PARTIAL"
    UNAVAILABLE = "UNAVAILABLE"
    INVALID = "INVALID"
    SUPERSEDED = "SUPERSEDED"


class OperationType(str, Enum):
    """
    Controlled geometric and pipeline operation types.
    """
    INGESTION = "INGESTION"
    AI_EXTRACTION = "AI_EXTRACTION"
    GEOMETRIC_INTERSECTION = "GEOMETRIC_INTERSECTION"
    VERTICAL_SLICING = "VERTICAL_SLICING"
    ULPIN_GENERATION = "ULPIN_GENERATION"
    MANUAL_SURVEY = "MANUAL_SURVEY"
    HEIGHT_ESTIMATION = "HEIGHT_ESTIMATION"
    TRANSFORMATION = "TRANSFORMATION"
    VERIFICATION_REVIEW = "VERIFICATION_REVIEW"


class EvidenceItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    dataset_id: Optional[uuid.UUID] = None
    dataset_name: Optional[str] = None
    dataset_type: Optional[str] = None
    source_id: Optional[uuid.UUID] = None
    source_name: Optional[str] = None
    source_type: str = SourceType.SURVEY_DATA.value
    source_classification: str = SourceClassification.OBSERVED.value
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    status: str = EvidenceStatus.AVAILABLE.value
    processing_method: str
    model_version: Optional[str] = None
    notes: Optional[str] = None
    supporting_factors: List[str] = Field(default_factory=list)
    limiting_factors: List[str] = Field(default_factory=list)
    evidence_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class EvidenceListResponse(BaseModel):
    items: List[EvidenceItem]
    total: int
    page: int
    limit: int


class ProvenanceNode(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    target_entity_type: str
    target_entity_id: uuid.UUID
    source_entity_type: Optional[str] = None
    source_entity_id: Optional[uuid.UUID] = None
    operation_type: str
    operation_name: str
    operation_version: Optional[str] = None
    performed_by: Optional[str] = None
    execution_timestamp: datetime
    input_reference: Dict[str, Any] = Field(default_factory=dict)
    output_reference: Dict[str, Any] = Field(default_factory=dict)
    metadata_json: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class ProvenanceChainResponse(BaseModel):
    target_entity_type: str
    target_entity_id: uuid.UUID
    chain: List[ProvenanceNode]
    lineage_summary: str


class ConfidenceBreakdownResponse(BaseModel):
    property_id: uuid.UUID
    composite_confidence: float = Field(..., ge=0.0, le=1.0)
    verification_status: str  # Always explicitly decoupled: e.g. "UNVERIFIED"
    is_verified: bool = False
    component_scores: Dict[str, float]
    supporting_factors: List[str]
    limiting_factors: List[str]
    evidence_coverage_percentage: float = Field(..., ge=0.0, le=100.0)
    classification_counts: Dict[str, int]


class PropertyEvidenceResponse(BaseModel):
    property_id: uuid.UUID
    ulpin_2d: str
    evidence_count: int
    coverage_percentage: float
    composite_confidence: float
    verification_status: str
    evidence_items: List[EvidenceItem]
    missing_evidence: List[str]


class DatasetEvidenceResponse(BaseModel):
    dataset_id: uuid.UUID
    dataset_name: str
    dataset_type: str
    source_name: Optional[str] = None
    evidence_items: List[EvidenceItem]
    total: int
