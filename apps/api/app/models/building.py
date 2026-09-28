"""
BhuSetu 3D Building Model
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


class Building(Base):
    """
    3D Physical Structure situated on a Cadastral Parcel.
    Encapsulates 2D footprint geometry, 3D extruded envelope geometry,
    and Phase 6 AI extraction & evidence traceability metadata.
    """
    __tablename__ = "buildings"
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
    building_code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )
    name: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True
    )
    building_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    footprint_geom = mapped_column(
        Geometry(geometry_type="POLYGON", srid=4326),
        nullable=False
    )
    ground_elevation: Mapped[Decimal] = mapped_column(
        Numeric(8, 2),
        nullable=False
    )
    building_height: Mapped[Decimal] = mapped_column(
        Numeric(8, 2),
        nullable=False
    )
    detected_floors: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )
    sanctioned_floors: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )
    geom_3d = mapped_column(
        Geometry(geometry_type="POLYHEDRALSURFACEZ", srid=4326, dimension=3),
        nullable=True
    )

    # Phase 6: AI Extraction & Traceability Metadata
    height_source: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    extraction_method: Mapped[Optional[str]] = mapped_column(
        String(50),
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
    status_3d: Mapped[str] = mapped_column(
        String(30),
        default="FOOTPRINT_ONLY",
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
    parcel: Mapped["Parcel"] = relationship(
        "Parcel",
        back_populates="buildings"
    )
    floors: Mapped[List["Floor"]] = relationship(
        "Floor",
        back_populates="building",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Building(code='{self.building_code}', floors={self.detected_floors}/{self.sanctioned_floors})>"
