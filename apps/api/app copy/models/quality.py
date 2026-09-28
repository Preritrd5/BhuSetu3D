"""
BhuSetu 3D Data Quality Intelligence & Quality Score Snapshot Models
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 13: Analytics + Quality Scoring + UI/UX Polish
"""
import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy import (
    String,
    Numeric,
    ForeignKey,
    DateTime,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class QualityScoreSnapshot(Base):
    """
    Immutable historical snapshot of an explainable ULPIN-oriented data quality score.
    Records overall score, 7 component scores, weights, rule results, and missing fields.
    """
    __tablename__ = "quality_score_snapshots"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    entity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )
    overall_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        index=True
    )
    component_scores: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False
    )
    weights_used: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False
    )
    rule_results: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONB,
        default=list,
        nullable=False
    )
    missing_fields: Mapped[List[str]] = mapped_column(
        JSONB,
        default=list,
        nullable=False
    )
    scoring_version: Mapped[str] = mapped_column(
        String(50),
        default="quality_v1",
        nullable=False
    )
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        index=True
    )
    calculated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.users.id", ondelete="SET NULL"),
        nullable=True
    )

    def __init__(self, **kwargs):
        if "id" not in kwargs or kwargs.get("id") is None:
            kwargs["id"] = uuid.uuid4()
        if "calculated_at" not in kwargs or kwargs.get("calculated_at") is None:
            kwargs["calculated_at"] = datetime.utcnow()
        if "scoring_version" not in kwargs or kwargs.get("scoring_version") is None:
            kwargs["scoring_version"] = "quality_v1"
        if "component_scores" not in kwargs or kwargs.get("component_scores") is None:
            kwargs["component_scores"] = {}
        if "weights_used" not in kwargs or kwargs.get("weights_used") is None:
            kwargs["weights_used"] = {}
        if "rule_results" not in kwargs or kwargs.get("rule_results") is None:
            kwargs["rule_results"] = []
        if "missing_fields" not in kwargs or kwargs.get("missing_fields") is None:
            kwargs["missing_fields"] = []
        super().__init__(**kwargs)

    def __repr__(self) -> str:
        return f"<QualityScoreSnapshot(entity={self.entity_type}:{self.entity_id}, score={self.overall_score}, v={self.scoring_version})>"


class QualityIssue(Base):
    """
    Structured, actionable data quality finding linked to domain entities (parcels, buildings, infrastructure).
    Enables deep navigation to verification, evidence, or spatial analysis for correction.
    """
    __tablename__ = "quality_issues"
    __table_args__ = (
        UniqueConstraint("entity_type", "entity_id", "rule_code", "category", name="uq_quality_issue_dedup"),
        {"schema": "public"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    entity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )
    severity: Mapped[str] = mapped_column(
        String(20),
        default="WARNING",
        nullable=False,
        index=True
    )
    rule_code: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    discrepancy_details: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False
    )
    evidence_reference: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="OPEN",
        nullable=False,
        index=True
    )
    action_url: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    resolved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.users.id", ondelete="SET NULL"),
        nullable=True
    )

    def __init__(self, **kwargs):
        if "id" not in kwargs or kwargs.get("id") is None:
            kwargs["id"] = uuid.uuid4()
        if "status" not in kwargs or kwargs.get("status") is None:
            kwargs["status"] = "OPEN"
        if "severity" not in kwargs or kwargs.get("severity") is None:
            kwargs["severity"] = "WARNING"
        if "discrepancy_details" not in kwargs or kwargs.get("discrepancy_details") is None:
            kwargs["discrepancy_details"] = {}
        if "evidence_reference" not in kwargs or kwargs.get("evidence_reference") is None:
            kwargs["evidence_reference"] = {}
        if "detected_at" not in kwargs or kwargs.get("detected_at") is None:
            kwargs["detected_at"] = datetime.utcnow()
        super().__init__(**kwargs)

    def __repr__(self) -> str:
        return f"<QualityIssue(entity={self.entity_type}:{self.entity_id}, rule={self.rule_code}, status={self.status})>"
