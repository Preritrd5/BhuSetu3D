"""
BhuSetu 3D Supporting Canonical Provenance & Governance Models
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Integration + Property Data Model
"""
import uuid
from decimal import Decimal
from datetime import datetime, date
from typing import Optional, Dict, Any
from sqlalchemy import (
    String,
    Numeric,
    BigInteger,
    ForeignKey,
    DateTime,
    Date,
    Text,
    Boolean,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import Base


class DataSource(Base):
    """
    Authoritative survey or remote sensing data provider organization.
    """
    __tablename__ = "data_sources"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )
    organization_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    trust_level: Mapped[str] = mapped_column(
        String(30),
        default="AUTHORITATIVE",
        nullable=False
    )
    contact_email: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    reliability_score: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(4, 3),
        default=Decimal("0.850"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )


class Dataset(Base):
    """
    Ingested spatial dataset collection (LiDAR, drone imagery, GIS shapefile).
    """
    __tablename__ = "datasets"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    source_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.data_sources.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    city_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.cities.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )
    dataset_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    acquisition_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )
    sensor_details: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True
    )
    storage_uri: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    spatial_coverage = mapped_column(
        Geometry(geometry_type="POLYGON", srid=4326),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    data_source: Mapped[Optional["DataSource"]] = relationship("DataSource", lazy="selectin")


class Evidence(Base):
    """
    Evidence item anchoring spatial property geometry to specific datasets and confidence ratings.
    Phase 8 Enhanced: status, source_type, supporting & limiting factors, and metadata.
    """
    __tablename__ = "evidence"
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
    dataset_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.datasets.id", ondelete="RESTRICT"),
        nullable=True,
        index=True
    )
    source_classification: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )
    source_type: Mapped[str] = mapped_column(
        String(50),
        default="SURVEY_DATA",
        nullable=False,
        index=True
    )
    confidence_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 4),
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="AVAILABLE",
        nullable=False,
        index=True
    )
    processing_method: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )
    model_version: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    supporting_factors: Mapped[list] = mapped_column(
        JSONB,
        default=list,
        nullable=False
    )
    limiting_factors: Mapped[list] = mapped_column(
        JSONB,
        default=list,
        nullable=False
    )
    evidence_metadata: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    dataset: Mapped[Optional["Dataset"]] = relationship("Dataset", lazy="selectin")


class ProvenanceRecord(Base):
    """
    Phase 8: Lineage tracking record linking source inputs, processes/operations, and target outputs.
    """
    __tablename__ = "provenance_records"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    target_entity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )
    target_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )
    source_entity_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True
    )
    source_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )
    operation_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )
    operation_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )
    operation_version: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    performed_by: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    execution_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
    input_reference: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False
    )
    output_reference: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False
    )
    metadata_json: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )


class Conflict(Base):
    """
    Phase 9 Enhanced: Spatial conflict & discrepancy record.
    Traceable to real geometries, applicable rules, measured values, and Phase 8 evidence.
    """
    __tablename__ = "conflicts"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    conflict_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    severity: Mapped[str] = mapped_column(
        String(20),
        default="HIGH",
        nullable=False,
        index=True
    )
    rule_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True
    )
    rule_name: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True
    )
    entity_type: Mapped[str] = mapped_column(
        String(50),
        default="PARCEL",
        nullable=False,
        index=True
    )
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )
    related_entity_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True
    )
    related_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )
    parcel_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.parcels.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    building_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.buildings.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    unit_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.units.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    measured_value: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 3),
        nullable=True
    )
    threshold_value: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 3),
        nullable=True
    )
    measured_unit: Mapped[str] = mapped_column(
        String(20),
        default="m²",
        nullable=False
    )
    deviation_value: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2),
        nullable=True
    )
    explanation: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
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
    confidence_score: Mapped[Decimal] = mapped_column(
        Numeric(4, 3),
        default=Decimal("0.900"),
        nullable=False
    )
    analysis_version: Mapped[str] = mapped_column(
        String(50),
        default="spatial_rules_v1",
        nullable=False
    )
    conflict_geom = mapped_column(
        Geometry(geometry_type="GEOMETRY", srid=4326),
        nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="OPEN",
        nullable=False,
        index=True
    )
    verification_status: Mapped[str] = mapped_column(
        String(30),
        default="UNREVIEWED",
        nullable=False,
        index=True
    )
    assigned_reviewer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.users.id", ondelete="SET NULL"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    parcel: Mapped[Optional["Parcel"]] = relationship("Parcel", lazy="selectin", foreign_keys=[parcel_id])
    building: Mapped[Optional["Building"]] = relationship("Building", lazy="selectin", foreign_keys=[building_id])
    assigned_reviewer: Mapped[Optional["User"]] = relationship("User", lazy="selectin", foreign_keys=[assigned_reviewer_id])


class SpatialRule(Base):
    """
    Phase 9: Configurable spatial rule definition for discrepancy & conflict evaluation.
    """
    __tablename__ = "spatial_rules"
    __table_args__ = {"schema": "public"}

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True
    )
    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    target_entity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )
    related_entity_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    spatial_operation: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    threshold_value: Mapped[Decimal] = mapped_column(
        Numeric(12, 3),
        nullable=False
    )
    threshold_unit: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )
    severity: Mapped[str] = mapped_column(
        String(20),
        default="HIGH",
        nullable=False
    )
    is_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True
    )
    metadata_json: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


class VerificationRecord(Base):
    """
    Statutory verification action executed by an authorized government reviewer.
    """
    __tablename__ = "verification_records"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    conflict_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.conflicts.id", ondelete="SET NULL"),
        nullable=True
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
    officer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    decision: Mapped[Optional[str]] = mapped_column(
        String(30),
        nullable=True
    )
    justification: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    previous_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )
    new_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )
    evidence_references: Mapped[list] = mapped_column(
        JSONB,
        default=list,
        nullable=False
    )
    confidence_at_review: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(4, 3),
        nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    officer: Mapped[Optional["User"]] = relationship("User", lazy="selectin", foreign_keys=[officer_id])
    conflict: Mapped[Optional["Conflict"]] = relationship("Conflict", lazy="selectin", foreign_keys=[conflict_id])


class AuditLog(Base):
    """
    Cryptographically chained, immutable audit record for spatial operations.
    """
    __tablename__ = "audit_logs"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.users.id", ondelete="SET NULL"),
        nullable=True
    )
    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False
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
    previous_state: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True
    )
    new_state: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    prev_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False
    )
    current_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
