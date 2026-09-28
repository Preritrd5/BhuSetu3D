"""
BhuSetu 3D Region / Ward Model
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Integration + Property Data Model
"""
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import Base


class Region(Base):
    """
    Administrative ward, sector, or zonal boundary within a city.
    """
    __tablename__ = "regions"
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
    code: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )
    boundary_geom = mapped_column(
        Geometry(geometry_type="MULTIPOLYGON", srid=4326),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    city: Mapped["City"] = relationship(
        "City",
        back_populates="regions"
    )
    parcels: Mapped[List["Parcel"]] = relationship(
        "Parcel",
        back_populates="region",
        lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<Region(code='{self.code}', name='{self.name}', city_id='{self.city_id}')>"
