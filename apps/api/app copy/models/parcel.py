"""
BhuSetu 3D Cadastral Parcel Model
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Integration + Property Data Model
"""
import uuid
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import Base


class Parcel(Base):
    """
    2D Cadastral Land Parcel establishing the root land boundary for vertical property hierarchy.
    Stores the 14-digit standard 2D ULPIN prototype identifier and PostGIS Polygon geometry.
    """
    __tablename__ = "parcels"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    city_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.cities.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    region_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.regions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    ulpin_2d: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )
    survey_number: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    recorded_area_sqm: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )
    computed_area_sqm: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )
    land_use: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    geom_2d = mapped_column(
        Geometry(geometry_type="POLYGON", srid=4326),
        nullable=False
    )
    elevation_base: Mapped[Decimal] = mapped_column(
        Numeric(8, 2),
        default=Decimal("0.0"),
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

    # Relationships
    city: Mapped["City"] = relationship(
        "City",
        back_populates="parcels"
    )
    region: Mapped["Region"] = relationship(
        "Region",
        back_populates="parcels"
    )
    buildings: Mapped[List["Building"]] = relationship(
        "Building",
        back_populates="parcel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    infrastructure_associations: Mapped[List["ParcelInfrastructure"]] = relationship(
        "ParcelInfrastructure",
        back_populates="parcel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Parcel(ulpin_2d='{self.ulpin_2d}', survey='{self.survey_number}', area={self.computed_area_sqm})>"
