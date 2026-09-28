"""
BhuSetu 3D 4D Temporal Property History & Infrastructure Schemas
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 12: 4D Property History + Infrastructure Intelligence
"""
from datetime import datetime, date
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class ChangeType(str, Enum):
    GEOMETRY_CHANGED = "GEOMETRY_CHANGED"
    BUILDING_ADDED = "BUILDING_ADDED"
    BUILDING_REMOVED = "BUILDING_REMOVED"
    BUILDING_EXPANDED = "BUILDING_EXPANDED"
    BUILDING_REDUCED = "BUILDING_REDUCED"
    FLOOR_COUNT_CHANGED = "FLOOR_COUNT_CHANGED"
    HEIGHT_CHANGED = "HEIGHT_CHANGED"
    PARCEL_GEOMETRY_CHANGED = "PARCEL_GEOMETRY_CHANGED"
    UNIT_CHANGED = "UNIT_CHANGED"
    INFRASTRUCTURE_ADDED = "INFRASTRUCTURE_ADDED"
    INFRASTRUCTURE_REMOVED = "INFRASTRUCTURE_REMOVED"
    INFRASTRUCTURE_MOVED = "INFRASTRUCTURE_MOVED"
    INFRASTRUCTURE_GEOMETRY_CHANGED = "INFRASTRUCTURE_GEOMETRY_CHANGED"
    RELATIONSHIP_CHANGED = "RELATIONSHIP_CHANGED"
    ATTRIBUTE_CHANGED = "ATTRIBUTE_CHANGED"


class InfrastructureRelationshipType(str, Enum):
    NEAR = "NEAR"
    SPATIALLY_INTERSECTS = "SPATIALLY_INTERSECTS"
    WITHIN = "WITHIN"
    CROSSES = "CROSSES"
    ADJACENT = "ADJACENT"
    CONNECTED = "CONNECTED"


class ChangeVerificationStatus(str, Enum):
    UNREVIEWED = "UNREVIEWED"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    NEEDS_MORE_EVIDENCE = "NEEDS_MORE_EVIDENCE"


class PropertyStateVersionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    entity_type: str
    entity_id: UUID
    version_number: int
    observed_at: date
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    observed_interval: str = "EXACT"
    source_dataset_id: Optional[UUID] = None
    source_name: Optional[str] = None
    geom_geojson: Optional[Dict[str, Any]] = None
    attributes_snapshot: Dict[str, Any] = Field(default_factory=dict)
    evidence_reference: Dict[str, Any] = Field(default_factory=dict)
    confidence_score: float = 0.900
    verification_status: str = "UNREVIEWED"
    created_at: datetime


class ChangeEventItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    entity_type: str
    entity_id: UUID
    change_type: ChangeType
    previous_version_id: Optional[UUID] = None
    new_version_id: Optional[UUID] = None
    observed_at: date
    measured_change: Dict[str, Any] = Field(default_factory=dict)
    change_geom_geojson: Optional[Dict[str, Any]] = None
    description: str
    evidence_reference: Dict[str, Any] = Field(default_factory=dict)
    confidence_score: float = 0.850
    verification_status: str = "UNREVIEWED"
    status: str = "DETECTED"
    analysis_version: str = "temporal_analysis_v1"
    created_at: datetime


class PropertyHistoryTimelineResponse(BaseModel):
    entity_type: str
    entity_id: UUID
    entity_identifier: Optional[str] = None
    current_state: Optional[Dict[str, Any]] = None
    versions: List[PropertyStateVersionItem] = Field(default_factory=list)
    change_events: List[ChangeEventItem] = Field(default_factory=list)
    observation_dates: List[date] = Field(default_factory=list)


class TemporalCompareRequest(BaseModel):
    entity_type: str = Field(..., description="PARCEL, BUILDING, INFRASTRUCTURE")
    entity_id: UUID
    from_version_id: Optional[UUID] = None
    to_version_id: Optional[UUID] = None
    from_date: Optional[date] = None
    to_date: Optional[date] = None


class TemporalCompareResponse(BaseModel):
    entity_type: str
    entity_id: UUID
    from_version: Optional[PropertyStateVersionItem] = None
    to_version: Optional[PropertyStateVersionItem] = None
    detected_changes: List[ChangeEventItem] = Field(default_factory=list)
    comparison_metrics: Dict[str, Any] = Field(default_factory=dict)
    is_identical: bool = False
    evidence_chain: List[Dict[str, Any]] = Field(default_factory=list)
    provenance_trace: Dict[str, Any] = Field(default_factory=dict)
    disclaimer_notice: str = "Observation difference establishes temporal variance, not authorized construction or legal legality."


class TemporalAnalyzeRequest(BaseModel):
    entity_type: str = "BUILDING"
    entity_id: UUID
    tolerance_percentage: float = 2.0
    minimum_area_diff_sqm: float = 1.0
    persist_events: bool = True


class NearbyInfrastructureItem(BaseModel):
    id: UUID
    name: str
    utility_category: str
    relationship_type: InfrastructureRelationshipType
    distance_meters: float
    is_subsurface: bool
    depth_meters: float
    is_connected: bool = False
    observation_date: Optional[date] = None
    geom_geojson: Optional[Dict[str, Any]] = None
    evidence_source_type: str


class PropertyInfrastructureResponse(BaseModel):
    property_id: UUID
    property_type: str
    observation_epoch: Optional[date] = None
    nearby_infrastructure: List[NearbyInfrastructureItem] = Field(default_factory=list)
    is_historical_aligned: bool = True
    temporal_notice: Optional[str] = None


class InfrastructureRelationshipHistoryItem(BaseModel):
    infrastructure_id: UUID
    infrastructure_name: str
    utility_category: str
    observation_date: date
    distance_meters: float
    relationship_type: InfrastructureRelationshipType
    relationship_changed: bool = False
    distance_delta_meters: Optional[float] = None
