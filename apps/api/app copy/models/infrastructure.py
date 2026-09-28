"""
BhuSetu 3D Infrastructure & Utility Models
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Integration + Property Data Model
"""
import uuid
from decimal import Decimal
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from sqlalchemy import String, Boolean, Numeric, ForeignKey, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import Base


class Infrastructure(Base):
    """
    Municipal utility or civil infrastructure asset (pipelines, power lines, metro tunnels).
    Can be surface, above-ground, or subsurface with explicit 3D geometry and temporal observation epoch.
    """
    __tablename__ = "infrastructure"
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
    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )
    utility_category: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    is_subsurface: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    depth_meters: Mapped[Decimal] = mapped_column(
        Numeric(6, 2),
        default=Decimal("0.0"),
        nullable=False
    )
    evidence_source_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )
    geom_spatial = mapped_column(
        Geometry(geometry_type="GEOMETRYZ", srid=4326, dimension=3),
        nullable=False
    )
    observation_date: Mapped[Optional[date]] = mapped_column(
        Date,
        default=date(2026, 1, 1),
        nullable=True,
        index=True
    )
    valid_from: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True
    )
    valid_to: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True
    )
    network_connectivity: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        default=lambda: {"is_physically_connected": False},
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    parcel_associations: Mapped[List["ParcelInfrastructure"]] = relationship(
        "ParcelInfrastructure",
        back_populates="infrastructure",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Infrastructure(name='{self.name}', type='{self.utility_category}', subsurface={self.is_subsurface})>"


class ParcelInfrastructure(Base):
    """
    Junction entity representing spatial intersections between land parcels and infrastructure corridors.
    """
    __tablename__ = "parcel_infrastructure"
    __table_args__ = {"schema": "public"}

    parcel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.parcels.id", ondelete="CASCADE"),
        primary_key=True
    )
    infrastructure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("public.infrastructure.id", ondelete="CASCADE"),
        primary_key=True
    )
    intersection_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    # Relationships
    parcel: Mapped["Parcel"] = relationship(
        "Parcel",
        back_populates="infrastructure_associations"
    )
    infrastructure: Mapped["Infrastructure"] = relationship(
        "Infrastructure",
        back_populates="parcel_associations"
    )

    def __repr__(self) -> str:
        return f"<ParcelInfrastructure(parcel={self.parcel_id}, infra={self.infrastructure_id}, type='{self.intersection_type}')>"
