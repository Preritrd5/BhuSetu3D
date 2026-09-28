"""
BhuSetu 3D Enterprise Analytics Schemas
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 13: Analytics + Quality Scoring + UI/UX Polish
"""
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class AnalyticsScope(str, Enum):
    GLOBAL = "GLOBAL"
    CITY = "CITY"
    REGION = "REGION"


class AnalyticsOverviewResponse(BaseModel):
    scope: str
    city_id: Optional[UUID] = None
    city_name: Optional[str] = None
    region_id: Optional[UUID] = None
    region_name: Optional[str] = None
    total_parcels: int
    total_buildings: int
    total_floors: int
    total_units: int
    total_infrastructure_assets: int
    average_quality_score: float
    evidence_coverage_percentage: float
    provenance_coverage_percentage: float
    verification_coverage_percentage: float
    open_conflicts_count: int
    detected_changes_count: int
    quality_distribution: Dict[str, int] = Field(default_factory=dict)
    generated_at: datetime


class AnalyticsPropertiesResponse(BaseModel):
    scope: str
    total_properties: int
    property_types: Dict[str, int] = Field(default_factory=dict)
    building_density_avg: float = 0.0
    vertical_hierarchy_counts: Dict[str, int] = Field(default_factory=dict)
    items: List[Dict[str, Any]] = Field(default_factory=list)


class AnalyticsQualityResponse(BaseModel):
    scope: str
    average_overall_score: float
    component_averages: Dict[str, float] = Field(default_factory=dict)
    quality_distribution: Dict[str, int] = Field(default_factory=dict)
    top_missing_fields: List[Dict[str, Any]] = Field(default_factory=list)
    issues_by_category: Dict[str, int] = Field(default_factory=dict)
    issues_by_severity: Dict[str, int] = Field(default_factory=dict)
    total_active_issues: int = 0


class AnalyticsConflictsResponse(BaseModel):
    scope: str
    total_conflicts: int
    open_conflicts: int
    resolved_conflicts: int
    by_type: Dict[str, int] = Field(default_factory=dict)
    by_severity: Dict[str, int] = Field(default_factory=dict)
    by_status: Dict[str, int] = Field(default_factory=dict)


class AnalyticsVerificationResponse(BaseModel):
    scope: str
    total_reviews: int
    verified_count: int
    rejected_count: int
    needs_evidence_count: int
    in_review_count: int
    unreviewed_count: int
    verification_rate_pct: float


class AnalyticsChangesResponse(BaseModel):
    scope: str
    total_change_events: int
    by_change_type: Dict[str, int] = Field(default_factory=dict)
    by_verification_status: Dict[str, int] = Field(default_factory=dict)
    temporal_epochs: List[str] = Field(default_factory=list)


class AnalyticsInfrastructureResponse(BaseModel):
    scope: str
    total_infrastructure: int
    by_utility_category: Dict[str, int] = Field(default_factory=dict)
    subsurface_count: int
    surface_count: int
    connected_properties_count: int
    within_buffer_count: int
