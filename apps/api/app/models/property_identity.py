"""
BhuSetu 3D Property Identity (ULPIN-Oriented Prototype) Model
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 7: Vertical Property Mapping + 3D ULPIN Model
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class PropertyIdentity(Base):
    """
    ULPIN-Oriented 3D Property Identity.
    Connects parcel, building, and vertical components into a deterministic,
    traceable 3D property prototype record.

    NOTE: This is a prototype/oriented property model for technical spatial workflows.
    It does NOT claim official government ULPIN issuance.
    """
    __tablename__ = "property_identities"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    parcel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.parcels.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    building_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.buildings.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    ulpin_oriented_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )
    identity_version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="PROTOTYPE",
        nullable=False
    )
    metadata_json = mapped_column(
        JSONB,
        default=dict,
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

    # Relationships
    parcel: Mapped["Parcel"] = relationship("Parcel")
    building: Mapped[Optional["Building"]] = relationship("Building")

    def __repr__(self) -> str:
        return f"<PropertyIdentity(ulpin_oriented_id='{self.ulpin_oriented_id}', version={self.identity_version}, status='{self.status}')>"
