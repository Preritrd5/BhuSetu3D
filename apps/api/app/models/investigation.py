"""
BhuSetu 3D Spatial Investigation Audit Model
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 10: Natural-Language Spatial Query + AI Spatial Investigator
"""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import (
    String,
    Integer,
    Text,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SpatialInvestigation(Base):
    """
    Audit and observability log for AI-assisted spatial investigations.
    Maintains provenance of interpreted intents, executed tools, and execution traces.
    """
    __tablename__ = "spatial_investigations"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    request_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )
    question: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    intent: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True
    )
    tool_executed: Mapped[str] = mapped_column(
        String(64),
        nullable=False
    )
    model_used: Mapped[str] = mapped_column(
        String(64),
        default="gemini-2.0-flash",
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(32),
        default="SUCCESS",
        nullable=False
    )
    duration_ms: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    result_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    execution_trace: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        index=True
    )
