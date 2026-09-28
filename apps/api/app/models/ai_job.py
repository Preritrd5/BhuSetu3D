"""
BhuSetu 3D AI Building Extraction Job Model
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 6: AI Building Extraction + 3D Generation
"""
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AIExtractionJob(Base):
    """
    Durable database-backed tracking of AI building extraction & 3D generation jobs.
    Lifecycle: CREATED -> VALIDATING -> PREPROCESSING -> INFERENCE -> POSTPROCESSING
               -> VECTORIZING -> HEIGHT -> 3D_GENERATION -> PERSISTING -> COMPLETED / FAILED
    """
    __tablename__ = "ai_extraction_jobs"
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
    model_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="building-segmentation-unet"
    )
    model_version: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="v1.0"
    )
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="CREATED",
        index=True
    )
    stage: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="INITIALIZED"
    )
    progress_percent: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    buildings_detected: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    buildings_extracted: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    buildings_rejected: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    buildings_3d_generated: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    execution_logs = mapped_column(
        JSONB,
        default=list,
        nullable=True
    )
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<AIExtractionJob(id={self.id}, model='{self.model_name}:{self.model_version}', status='{self.status}', progress={self.progress_percent}%)>"
