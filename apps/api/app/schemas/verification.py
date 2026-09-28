"""
BhuSetu 3D Human Verification & Audit Trail Schemas
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 11: Human Verification Workflow + Audit Trail
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class VerificationStatus(str, Enum):
    UNREVIEWED = "UNREVIEWED"
    IN_REVIEW = "IN_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    NEEDS_MORE_EVIDENCE = "NEEDS_MORE_EVIDENCE"
    ESCALATED = "ESCALATED"


class VerificationDecision(str, Enum):
    CONFIRMED = "CONFIRMED"
    NOT_CONFIRMED = "NOT_CONFIRMED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    ESCALATE = "ESCALATE"


class VerificationAction(str, Enum):
    ASSIGN = "ASSIGN"
    START_REVIEW = "START_REVIEW"
    SUBMIT_DECISION = "SUBMIT_DECISION"
    REOPEN = "REOPEN"


class ReviewerInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: str
    role: str
    department: Optional[str] = None


class VerificationRecordItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conflict_id: Optional[UUID] = None
    entity_type: str
    entity_id: UUID
    officer_id: UUID
    officer_name: Optional[str] = None
    action: str
    decision: Optional[str] = None
    justification: str
    previous_status: str
    new_status: str
    evidence_references: List[Any] = Field(default_factory=list)
    confidence_at_review: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime


class VerificationQueueItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conflict_type: str
    severity: str
    verification_status: str
    rule_id: Optional[str] = None
    rule_name: Optional[str] = None
    entity_type: str
    entity_id: Optional[UUID] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[UUID] = None
    parcel_id: Optional[UUID] = None
    building_id: Optional[UUID] = None
    unit_id: Optional[UUID] = None
    measured_value: Optional[float] = None
    threshold_value: Optional[float] = None
    measured_unit: str = "m²"
    confidence_score: float = 0.900
    explanation: Optional[str] = None
    assigned_reviewer: Optional[ReviewerInfo] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    evidence_count: int = 0
    verification_history_count: int = 0


class VerificationQueueSummary(BaseModel):
    total: int = 0
    unreviewed: int = 0
    in_review: int = 0
    verified: int = 0
    rejected: int = 0
    needs_more_evidence: int = 0
    escalated: int = 0
    by_severity: Dict[str, int] = Field(default_factory=dict)


class VerificationQueueResponse(BaseModel):
    items: List[VerificationQueueItem]
    total: int
    page: int
    page_size: int
    summary: VerificationQueueSummary


class VerificationDetailResponse(BaseModel):
    item: VerificationQueueItem
    history: List[VerificationRecordItem] = Field(default_factory=list)
    associated_evidence: List[Dict[str, Any]] = Field(default_factory=list)
    ai_explanation: Optional[str] = None


class AssignReviewerRequest(BaseModel):
    reviewer_id: UUID
    notes: Optional[str] = None


class StartReviewRequest(BaseModel):
    notes: Optional[str] = None


class VerificationDecisionRequest(BaseModel):
    decision: VerificationDecision
    justification: str = Field(..., min_length=10, description="Mandatory detailed statutory justification for review decision")
    evidence_references: List[UUID] = Field(default_factory=list, description="IDs of inspected Phase 8 evidence items")
    notes: Optional[str] = None
    expected_previous_status: Optional[str] = Field(None, description="Concurrency check: ensures finding was not updated by another reviewer")


class ReopenReviewRequest(BaseModel):
    justification: str = Field(..., min_length=10, description="Mandatory reason for reopening a completed review")
    notes: Optional[str] = None


class AuditLogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[UUID] = None
    action: str
    entity_type: str
    entity_id: UUID
    previous_state: Optional[Dict[str, Any]] = None
    new_state: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    prev_hash: str
    current_hash: str
    created_at: datetime


class AuditChainVerificationResponse(BaseModel):
    is_valid: bool
    event_count: int
    broken_log_id: Optional[int] = None
    verified_at: datetime
    genesis_hash: str
    latest_hash: Optional[str] = None
    message: str
