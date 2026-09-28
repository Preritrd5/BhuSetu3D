"""
BhuSetu 3D 4D Temporal Property History & Change Event Models
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 12: 4D Property History + Infrastructure Intelligence
"""
import uuid
from decimal import Decimal
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from sqlalchemy import (
    String,
    Numeric,
    Integer,
    ForeignKey,
    DateTime,
    Date,
    Text,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import Base


class PropertyStateVersion(Base):
    """
    Discrete temporal state snapshot of a spatial entity (PARCEL, BUILDING, FLOOR, UNIT, INFRASTRUCTURE)
    at a specific observation point. Preserves historical geometry, attributes, evidence links, and confidence.
    """
    __tablename__ = "property_state_versions"
    __table_args__ = (
        UniqueConstraint("entity_type", "entity_id", "version_number", name="uq_entity_version"),
        CheckConstraint("valid_from IS NULL OR valid_to IS NULL OR valid_from <= valid_to", name="chk_valid_interval"),
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
    version_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )
    observed_at: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True
    )
    valid_from: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True
    )
    valid_to: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True
    )
    observed_interval: Mapped[str] = mapped_column(
        String(50),
        default="EXACT",
        nullable=False
    )
    source_dataset_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.datasets.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    source_name: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True
    )
    geom_spatial = mapped_column(
        Geometry(geometry_type="GEOMETRY", srid=4326),
        nullable=True
    )
    attributes_snapshot: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False
    )
    evidence_reference: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False
    )
    confidence_score: Mapped[Decimal] = mapped_column(
        Numeric(4, 3),
        default=Decimal("0.900"),
        nullable=False
    )
    verification_status: Mapped[str] = mapped_column(
        String(30),
        default="UNREVIEWED",
        nullable=False,
        index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    source_dataset: Mapped[Optional["Dataset"]] = relationship("Dataset", lazy="selectin")

    def __repr__(self) -> str:
        return f"<PropertyStateVersion(entity={self.entity_type}:{self.entity_id}, v={self.version_number}, observed={self.observed_at})>"


class ChangeEvent(Base):
    """
    Normalized record of a temporal transition between two property or infrastructure states.
    Preserves measured geometry changes (area diff, percentage, floor diff), evidence,
    and Phase 11 human verification status.
    """
    __tablename__ = "change_events"
    __table_args__ = (
        UniqueConstraint(
            "entity_type", "entity_id", "previous_version_id", "new_version_id", "change_type", "analysis_version",
            name="uq_change_event_dedup"
        ),
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
    change_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )
    previous_version_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.property_state_versions.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    new_version_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.property_state_versions.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    observed_at: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True
    )
    measured_change: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False
    )
    change_geom = mapped_column(
        Geometry(geometry_type="GEOMETRY", srid=4326),
        nullable=True
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    evidence_reference: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False
    )
    confidence_score: Mapped[Decimal] = mapped_column(
        Numeric(4, 3),
        default=Decimal("0.850"),
        nullable=False
    )
    verification_status: Mapped[str] = mapped_column(
        String(30),
        default="UNREVIEWED",
        nullable=False,
        index=True
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="DETECTED",
        nullable=False
    )
    analysis_version: Mapped[str] = mapped_column(
        String(50),
        default="temporal_analysis_v1",
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    previous_version: Mapped[Optional[PropertyStateVersion]] = relationship(
        "PropertyStateVersion",
        foreign_keys=[previous_version_id],
        lazy="selectin"
    )
    new_version: Mapped[Optional[PropertyStateVersion]] = relationship(
        "PropertyStateVersion",
        foreign_keys=[new_version_id],
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<ChangeEvent(type='{self.change_type}', entity={self.entity_type}:{self.entity_id}, observed={self.observed_at})>"
