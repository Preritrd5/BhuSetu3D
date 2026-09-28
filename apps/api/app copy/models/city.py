"""
BhuSetu 3D City Model
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Integration + Property Data Model
"""
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import Base


class City(Base):
    """
    Municipal/administrative geographic container for BhuSetu 3D property registries.
    """
    __tablename__ = "cities"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(
        String(10),
        unique=True,
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    state: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    country: Mapped[str] = mapped_column(
        String(100),
        default="India",
        nullable=False
    )
    default_srid: Mapped[int] = mapped_column(
        Integer,
        default=4326,
        nullable=False
    )
    bounds_geom = mapped_column(
        Geometry(geometry_type="POLYGON", srid=4326),
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
    regions: Mapped[List["Region"]] = relationship(
        "Region",
        back_populates="city",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    parcels: Mapped[List["Parcel"]] = relationship(
        "Parcel",
        back_populates="city",
        lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<City(code='{self.code}', name='{self.name}', state='{self.state}')>"
