"""
BhuSetu 3D Spatial Investigator Schemas
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 10: Natural-Language Spatial Query + AI Spatial Investigator
"""
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SpatialIntentType(str, Enum):
    """Controlled set of approved natural language spatial intents."""
    PROPERTY_LOOKUP = "PROPERTY_LOOKUP"
    BUILDING_LOOKUP = "BUILDING_LOOKUP"
    PARCEL_LOOKUP = "PARCEL_LOOKUP"
    PROPERTY_RELATIONSHIP = "PROPERTY_RELATIONSHIP"
    PROXIMITY_SEARCH = "PROXIMITY_SEARCH"
    CONTAINMENT_QUERY = "CONTAINMENT_QUERY"
    INTERSECTION_QUERY = "INTERSECTION_QUERY"
    OVERLAP_QUERY = "OVERLAP_QUERY"
    BOUNDARY_DISCREPANCY_QUERY = "BOUNDARY_DISCREPANCY_QUERY"
    SPATIAL_CONFLICT_QUERY = "SPATIAL_CONFLICT_QUERY"
    INFRASTRUCTURE_PROXIMITY_QUERY = "INFRASTRUCTURE_PROXIMITY_QUERY"
    EVIDENCE_QUERY = "EVIDENCE_QUERY"
    PROVENANCE_QUERY = "PROVENANCE_QUERY"
    CONFIDENCE_QUERY = "CONFIDENCE_QUERY"
    PROPERTY_EXPLANATION = "PROPERTY_EXPLANATION"
    CONFLICT_EXPLANATION = "CONFLICT_EXPLANATION"
    PROPERTY_SUMMARY = "PROPERTY_SUMMARY"
    SPATIAL_COMPARISON = "SPATIAL_COMPARISON"
    MAP_FOCUS_REQUEST = "MAP_FOCUS_REQUEST"
    PROPERTY_HISTORY = "PROPERTY_HISTORY"
    CHANGE_QUERY = "CHANGE_QUERY"
    TEMPORAL_COMPARISON = "TEMPORAL_COMPARISON"
    INFRASTRUCTURE_HISTORY = "INFRASTRUCTURE_HISTORY"
    FIRST_OBSERVED_QUERY = "FIRST_OBSERVED_QUERY"
    TEMPORAL_RELATIONSHIP_QUERY = "TEMPORAL_RELATIONSHIP_QUERY"
    QUALITY_QUERY = "QUALITY_QUERY"
    QUALITY_EXPLANATION = "QUALITY_EXPLANATION"
    DATA_COMPLETENESS_QUERY = "DATA_COMPLETENESS_QUERY"
    EVIDENCE_COVERAGE_QUERY = "EVIDENCE_COVERAGE_QUERY"
    VERIFICATION_COVERAGE_QUERY = "VERIFICATION_COVERAGE_QUERY"
    CLARIFICATION_NEEDED = "CLARIFICATION_NEEDED"
    UNSUPPORTED = "UNSUPPORTED"


class EntityType(str, Enum):
    """Controlled entity taxonomy."""
    PARCEL = "PARCEL"
    BUILDING = "BUILDING"
    FLOOR = "FLOOR"
    UNIT = "UNIT"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    PROPERTY = "PROPERTY"


class SpatialRelationshipEnum(str, Enum):
    """PostGIS DE-9IM Topological relationships."""
    CONTAINS = "CONTAINS"
    WITHIN = "WITHIN"
    INTERSECTS = "INTERSECTS"
    OVERLAPS = "OVERLAPS"
    TOUCHES = "TOUCHES"
    NEAR = "NEAR"
    DISJOINT = "DISJOINT"


class InfrastructureTypeEnum(str, Enum):
    """Controlled infrastructure network types."""
    ROAD = "ROAD"
    POWER_LINE = "POWER_LINE"
    WATER_BODY = "WATER_BODY"
    PIPELINE = "PIPELINE"
    RAILWAY = "RAILWAY"
    DRAINAGE = "DRAINAGE"
    GENERAL = "GENERAL"


class MapActionType(str, Enum):
    """Safe, deterministic map controller directives."""
    FOCUS_PROPERTY = "FOCUS_PROPERTY"
    FOCUS_BUILDING = "FOCUS_BUILDING"
    FOCUS_PARCEL = "FOCUS_PARCEL"
    SHOW_RESULTS = "SHOW_RESULTS"
    SHOW_CONFLICT = "SHOW_CONFLICT"
    SHOW_RELATIONSHIP = "SHOW_RELATIONSHIP"
    SHOW_HISTORICAL_STATE = "SHOW_HISTORICAL_STATE"
    COMPARE_STATES = "COMPARE_STATES"
    SHOW_CHANGE = "SHOW_CHANGE"
    SHOW_QUALITY_SCORE = "SHOW_QUALITY_SCORE"
    CLEAR_RESULTS = "CLEAR_RESULTS"


class SpatialIntent(BaseModel):
    """
    Strict, validated spatial intent extracted from natural-language query.
    Prevents arbitrary SQL generation by binding execution to pre-approved tools.
    """
    intent: SpatialIntentType
    entity_type: Optional[EntityType] = None
    target_entity_type: Optional[str] = None
    relationship: Optional[SpatialRelationshipEnum] = None
    property_id: Optional[str] = None
    parcel_id: Optional[str] = None
    building_id: Optional[str] = None
    infrastructure_type: Optional[InfrastructureTypeEnum] = None
    distance_meters: Optional[float] = None
    conflict_type: Optional[str] = None
    severity: Optional[str] = None
    min_confidence: Optional[float] = None
    limit: int = Field(default=20)
    clarification_needed: bool = False
    clarification_question: Optional[str] = None
    unsupported_reason: Optional[str] = None
    map_action: Optional[MapActionType] = None


class InvestigationRequest(BaseModel):
    """Inbound natural-language query from the client."""
    question: str = Field(..., min_length=2, max_length=500, description="Natural language question")
    context_entity_type: Optional[str] = Field(None, description="Active entity context (PARCEL, BUILDING)")
    context_entity_id: Optional[str] = Field(None, description="UUID of active selected entity")
    context_map_extent: Optional[List[float]] = Field(None, description="Current viewport bbox [minx, miny, maxx, maxy]")
    session_id: Optional[str] = None


class InvestigationResultItem(BaseModel):
    """Normalized factual result item returned from PostGIS/Supabase."""
    entity_id: str
    entity_type: str
    entity_code: Optional[str] = None
    title: str
    subtitle: Optional[str] = None
    finding_type: Optional[str] = None
    measured_value: Optional[float] = None
    measured_unit: Optional[str] = None
    deviation_value: Optional[float] = None
    confidence_score: Optional[float] = None
    evidence_count: int = 0
    evidence_summary: Optional[str] = None
    has_discrepancy: bool = False
    explanation: Optional[str] = None
    geom_geojson: Optional[Dict[str, Any]] = None
    bbox: Optional[List[float]] = None
    metadata: Dict[str, Any] = {}


class InvestigationExplanation(BaseModel):
    """Grounded AI or template explanation synthesizing factual findings."""
    summary: str
    why_flagged: Optional[str] = None
    evidence_context: Optional[str] = None
    provenance_context: Optional[str] = None
    confidence_explanation: Optional[str] = None
    limitations_notice: str
    governance_notice: str


class MapActionDirective(BaseModel):
    """Deterministic instructions for 2D Leaflet and 3D Cesium viewports."""
    action_type: str
    target_ids: List[str]
    primary_id: Optional[str] = None
    zoom_level: Optional[int] = None
    highlight_features: List[Dict[str, Any]] = []


class InvestigationResponse(BaseModel):
    """Complete, validated investigation output returned to client."""
    request_id: str
    question: str
    interpreted_intent: SpatialIntent
    status: str  # SUCCESS, CLARIFICATION_NEEDED, NO_RESULTS, UNSUPPORTED, ERROR
    results_count: int
    results: List[InvestigationResultItem]
    explanation: InvestigationExplanation
    map_directive: Optional[MapActionDirective] = None
    execution_trace: Dict[str, Any]


class SuggestedQuestion(BaseModel):
    """Pre-curated question for prompt guidance."""
    id: str
    category: str
    question: str
    description: str
    requires_property_context: bool = False
