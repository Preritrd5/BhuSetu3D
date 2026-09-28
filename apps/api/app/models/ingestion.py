"""
BhuSetu 3D Ingestion Job Model
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 4: Data Ingestion & GIS Processing Pipeline
"""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy import (
    String,
    BigInteger,
    Integer,
    ForeignKey,
    DateTime,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class IngestionJob(Base):
    """
    Durable database-backed ingestion job tracking the complete lifecycle:
    CREATED -> VALIDATING -> PROCESSING -> VALIDATED -> NORMALIZING -> LOADING -> COMPLETED / FAILED
    """
    __tablename__ = "ingestion_jobs"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    dataset_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.datasets.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    file_size_bytes: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False
    )
    file_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True
    )
    dataset_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="CREATED",
        nullable=False,
        index=True
    )
    stage: Mapped[str] = mapped_column(
        String(50),
        default="INITIALIZED",
        nullable=False
    )
    progress_percent: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    source_crs: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    target_crs: Mapped[str] = mapped_column(
        String(30),
        default="EPSG:4326",
        nullable=False
    )
    records_total: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    records_accepted: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    records_rejected: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    records_warnings: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    quality_report: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True
    )
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    processing_logs: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONB,
        default=list,
        nullable=False
    )
    processing_version: Mapped[str] = mapped_column(
        String(20),
        default="1.0.0",
        nullable=False
    )
    storage_path: Mapped[Optional[str]] = mapped_column(
        Text,
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
