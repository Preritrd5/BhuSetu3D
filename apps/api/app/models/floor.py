"""
BhuSetu 3D Vertical Floor Model
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Integration + Property Data Model
"""
import uuid
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Numeric, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import Base


class Floor(Base):
    """
    Vertical level within a building structure.
    Maintains base and ceiling elevations, floor height, and 3D volumetric envelope.
    """
    __tablename__ = "floors"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    building_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.buildings.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    floor_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )
    floor_code: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )
    base_elevation: Mapped[Decimal] = mapped_column(
        Numeric(8, 2),
        nullable=False
    )
    ceiling_elevation: Mapped[Decimal] = mapped_column(
        Numeric(8, 2),
        nullable=False
    )
    floor_height: Mapped[Decimal] = mapped_column(
        Numeric(6, 2),
        nullable=False
    )
    floor_area_sqm: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )
    geom_3d = mapped_column(
        Geometry(geometry_type="POLYHEDRALSURFACEZ", srid=4326, dimension=3),
        nullable=True
    )
    floor_label: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    status_3d: Mapped[Optional[str]] = mapped_column(
        String(50),
        default="AVAILABLE",
        nullable=True
    )
    height_source: Mapped[Optional[str]] = mapped_column(
        String(50),
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
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=True
    )

    # Relationships
    building: Mapped["Building"] = relationship(
        "Building",
        back_populates="floors"
    )
    units: Mapped[List["Unit"]] = relationship(
        "Unit",
        back_populates="floor",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Floor(code='{self.floor_code}', num={self.floor_number}, height={self.floor_height})>"
