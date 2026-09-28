"""
BhuSetu 3D Vertical Property Unit Model
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Integration + Property Data Model
"""
import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import Base


class Unit(Base):
    """
    Vertical 3D Property Unit assigned a 3D ULPIN prototype identifier.
    The primary legal and spatial atomic unit of vertical real estate.
    """
    __tablename__ = "units"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    floor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.floors.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    building_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.buildings.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    parcel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.parcels.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    ulpin_3d: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )
    unit_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    unit_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    carpet_area_sqm: Mapped[Decimal] = mapped_column(
        Numeric(8, 2),
        nullable=False
    )
    spatial_centroid_z = mapped_column(
        Geometry(geometry_type="POINTZ", srid=4326, dimension=3),
        nullable=False
    )
    geom_3d = mapped_column(
        Geometry(geometry_type="POLYHEDRALSURFACEZ", srid=4326, dimension=3),
        nullable=True
    )
    verification_status: Mapped[str] = mapped_column(
        String(30),
        default="PENDING",
        nullable=False
    )
    unit_label: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    status_3d: Mapped[Optional[str]] = mapped_column(
        String(50),
        default="AVAILABLE",
        nullable=True
    )
    extraction_method: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    confidence_score: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(4, 3),
        nullable=True
    )
    processing_version: Mapped[Optional[str]] = mapped_column(
        String(30),
        nullable=True
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
    floor: Mapped["Floor"] = relationship(
        "Floor",
        back_populates="units"
    )
    building: Mapped["Building"] = relationship(
        "Building"
    )
    parcel: Mapped["Parcel"] = relationship(
        "Parcel"
    )

    def __repr__(self) -> str:
        return f"<Unit(ulpin_3d='{self.ulpin_3d}', unit_num='{self.unit_number}', status='{self.verification_status}')>"
