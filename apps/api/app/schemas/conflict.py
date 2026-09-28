"""
BhuSetu 3D Spatial Intelligence & Conflict Detection Schemas
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 9: Spatial Intelligence & Conflict Detection
"""
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ConflictType(str, Enum):
    """Controlled spatial discrepancy and conflict types."""
    BUILDING_PARCEL_OVERLAP = "BUILDING_PARCEL_OVERLAP"
    BUILDING_OUTSIDE_PARCEL = "BUILDING_OUTSIDE_PARCEL"
    BUILDING_BOUNDARY_PROXIMITY = "BUILDING_BOUNDARY_PROXIMITY"
    PROPERTY_PROPERTY_OVERLAP = "PROPERTY_PROPERTY_OVERLAP"
    PROPERTY_BOUNDARY_DISCREPANCY = "PROPERTY_BOUNDARY_DISCREPANCY"
    INFRASTRUCTURE_PROXIMITY = "INFRASTRUCTURE_PROXIMITY"
    INFRASTRUCTURE_INTERSECTION = "INFRASTRUCTURE_INTERSECTION"
    GEOMETRY_INVALID = "GEOMETRY_INVALID"
    GEOMETRY_INCONSISTENCY = "GEOMETRY_INCONSISTENCY"
    SPATIAL_RULE_VIOLATION = "SPATIAL_RULE_VIOLATION"


class ConflictSeverity(str, Enum):
    """Controlled severity classifications (System significance, not legal judgment)."""
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ConflictStatus(str, Enum):
    """Controlled conflict lifecycle status."""
    OPEN = "OPEN"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class SpatialRelationshipType(str, Enum):
    """Controlled topological & metric spatial relationship types."""
    CONTAINS = "CONTAINS"
    WITHIN = "WITHIN"
    INTERSECTS = "INTERSECTS"
    OVERLAPS = "OVERLAPS"
    TOUCHES = "TOUCHES"
    NEAR = "NEAR"
    DISJOINT = "DISJOINT"


class ConflictSummary(BaseModel):
    open_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    info_count: int = 0


class ConflictItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conflict_type: str
    severity: str
    status: str
    rule_id: Optional[str] = None
    rule_name: Optional[str] = None
    entity_type: str = "PARCEL"
    entity_id: Optional[uuid.UUID] = None
    parcel_id: Optional[uuid.UUID] = None
    parcel_ulpin: Optional[str] = None
    building_id: Optional[uuid.UUID] = None
    building_code: Optional[str] = None
    unit_id: Optional[uuid.UUID] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[uuid.UUID] = None
    related_entity_label: Optional[str] = None
    measured_value: Optional[float] = None
    threshold_value: Optional[float] = None
    measured_unit: str = "m²"
    deviation_value: Optional[float] = None
    explanation: Optional[str] = None
    discrepancy_details: Dict[str, Any] = Field(default_factory=dict)
    evidence_reference: Dict[str, Any] = Field(default_factory=dict)
    confidence_score: float = Field(default=0.90, ge=0.0, le=1.0)
    analysis_version: str = "spatial_rules_v1"
    conflict_geom_geojson: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class ConflictListResponse(BaseModel):
    items: List[ConflictItem]
    total: int
    page: int
    limit: int
    summary: ConflictSummary


class SpatialRelationshipItem(BaseModel):
    relationship_type: str
    target_entity_type: str
    target_entity_id: uuid.UUID
    related_entity_type: str
    related_entity_id: uuid.UUID
    related_entity_label: str
    distance_meters: Optional[float] = None
    intersection_area_sqm: Optional[float] = None
    details: Dict[str, Any] = Field(default_factory=dict)


class NearbyInfrastructureItem(BaseModel):
    infrastructure_id: uuid.UUID
    name: str
    utility_category: str
    is_subsurface: bool
    depth_meters: Optional[float] = None
    distance_meters: float
    intersects_property: bool
    evidence_source_type: str


class NearbyInfrastructureResponse(BaseModel):
    property_id: uuid.UUID
    search_radius_meters: float
    total_found: int
    items: List[NearbyInfrastructureItem]


class PropertySpatialAnalysisResponse(BaseModel):
    property_id: uuid.UUID
    ulpin_2d: str
    analysis_timestamp: datetime
    analysis_status: str  # COMPLETED, UNAVAILABLE, FAILED
    relationships: List[SpatialRelationshipItem]
    findings: List[ConflictItem]
    nearby_infrastructure_count: int
    limitations_notice: str = (
        "Spatial findings are computational observations based on available geometries and rules. "
        "They do not by themselves establish legal ownership, legality, authorization, or regulatory violation."
    )


class SpatialRuleItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    target_entity_type: str
    related_entity_type: Optional[str] = None
    spatial_operation: str
    threshold_value: float
    threshold_unit: str
    severity: str
    is_enabled: bool
    metadata_json: Dict[str, Any] = Field(default_factory=dict)


class ConflictStatusUpdateRequest(BaseModel):
    status: str
    comment: Optional[str] = None
