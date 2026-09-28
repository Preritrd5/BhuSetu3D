"""
BhuSetu 3D Data Quality Intelligence Schemas
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 13: Analytics + Quality Scoring + UI/UX Polish
"""
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class QualityCategory(str, Enum):
    COMPLETENESS = "COMPLETENESS"
    SPATIAL = "SPATIAL"
    ATTRIBUTE = "ATTRIBUTE"
    PROVENANCE = "PROVENANCE"
    EVIDENCE = "EVIDENCE"
    VERIFICATION = "VERIFICATION"
    TEMPORAL = "TEMPORAL"


class QualitySeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"


class QualityIssueStatus(str, Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    WONT_FIX = "WONT_FIX"


class RuleEvaluationResult(BaseModel):
    rule_code: str
    rule_name: str
    category: QualityCategory
    status: str = Field(..., description="PASS, FAIL, NOT_APPLICABLE")
    score_contribution: float
    max_contribution: float
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)


class QualityComponentScores(BaseModel):
    completeness: float = Field(..., ge=0.0, le=100.0)
    spatial_validity: float = Field(..., ge=0.0, le=100.0)
    attribute_consistency: float = Field(..., ge=0.0, le=100.0)
    provenance_coverage: float = Field(..., ge=0.0, le=100.0)
    evidence_coverage: float = Field(..., ge=0.0, le=100.0)
    verification_coverage: float = Field(..., ge=0.0, le=100.0)
    temporal_coverage: float = Field(..., ge=0.0, le=100.0)


class QualityWeights(BaseModel):
    completeness: float = 0.20
    spatial_validity: float = 0.20
    attribute_consistency: float = 0.15
    provenance_coverage: float = 0.15
    evidence_coverage: float = 0.15
    verification_coverage: float = 0.10
    temporal_coverage: float = 0.05


class QualityIssueItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    entity_type: str
    entity_id: UUID
    category: QualityCategory
    severity: QualitySeverity
    rule_code: str
    message: str
    discrepancy_details: Dict[str, Any] = Field(default_factory=dict)
    evidence_reference: Dict[str, Any] = Field(default_factory=dict)
    status: QualityIssueStatus
    action_url: Optional[str] = None
    detected_at: datetime
    resolved_at: Optional[datetime] = None


class QualityScoreResponse(BaseModel):
    entity_type: str
    entity_id: UUID
    entity_identifier: Optional[str] = None
    overall_score: float = Field(..., ge=0.0, le=100.0)
    quality_label: str
    component_scores: QualityComponentScores
    weights_used: QualityWeights
    rules_evaluated: List[RuleEvaluationResult] = Field(default_factory=list)
    missing_fields: List[str] = Field(default_factory=list)
    active_issues: List[QualityIssueItem] = Field(default_factory=list)
    evidence_count: int = 0
    is_verified: bool = False
    scoring_version: str = "quality_v1"
    calculated_at: datetime
    disclaimer_notice: str = (
        "Data Quality Score reflects record completeness, spatial validity, and evidence coverage. "
        "It does NOT represent legal title, ownership validity, or government sanction."
    )


class QualityRecalculateRequest(BaseModel):
    entity_type: str = "PARCEL"
    entity_id: UUID
    persist_snapshot: bool = True


class QualitySnapshotItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    overall_score: float
    component_scores: Dict[str, Any]
    scoring_version: str
    calculated_at: datetime


class QualityHistoryResponse(BaseModel):
    entity_type: str
    entity_id: UUID
    current_score: float
    previous_score: Optional[float] = None
    score_delta: Optional[float] = None
    snapshots: List[QualitySnapshotItem] = Field(default_factory=list)


class QualityIssueUpdate(BaseModel):
    status: QualityIssueStatus
    resolution_notes: Optional[str] = None
