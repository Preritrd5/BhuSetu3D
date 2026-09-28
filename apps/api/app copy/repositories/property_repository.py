"""
BhuSetu 3D Property Repository Layer
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Integration + Property Data Model
"""
import uuid
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from geoalchemy2 import functions as geofunc

from app.models.city import City
from app.models.region import Region
from app.models.parcel import Parcel
from app.models.building import Building
from app.models.floor import Floor
from app.models.unit import Unit
from app.models.infrastructure import Infrastructure, ParcelInfrastructure


class CityRepository:
    """Data access repository for City spatial entities."""

    @staticmethod
    async def get_by_id(db: AsyncSession, city_id: uuid.UUID) -> Optional[City]:
        stmt = select(City).where(City.id == city_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def get_by_code(db: AsyncSession, code: str) -> Optional[City]:
        stmt = select(City).where(City.code == code.upper().strip())
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def list_cities(
        db: AsyncSession, skip: int = 0, limit: int = 50
    ) -> Tuple[List[City], int]:
        count_stmt = select(func.count(City.id))
        total = (await db.execute(count_stmt)).scalar() or 0

        stmt = select(City).order_by(City.name).offset(skip).limit(limit)
        items = (await db.execute(stmt)).scalars().all()
        return list(items), total


class RegionRepository:
    """Data access repository for Region/Ward spatial entities."""

    @staticmethod
    async def get_by_id(db: AsyncSession, region_id: uuid.UUID) -> Optional[Region]:
        stmt = select(Region).where(Region.id == region_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def list_by_city(
        db: AsyncSession, city_id: uuid.UUID, skip: int = 0, limit: int = 50
    ) -> Tuple[List[Region], int]:
        count_stmt = select(func.count(Region.id)).where(Region.city_id == city_id)
        total = (await db.execute(count_stmt)).scalar() or 0

        stmt = (
            select(Region)
            .where(Region.city_id == city_id)
            .order_by(Region.code)
            .offset(skip)
            .limit(limit)
        )
        items = (await db.execute(stmt)).scalars().all()
        return list(items), total


class ParcelRepository:
    """Data access repository for 2D Cadastral Parcels."""

    @staticmethod
    async def get_by_id(
        db: AsyncSession, parcel_id: uuid.UUID, load_relations: bool = True
    ) -> Optional[Parcel]:
        stmt = select(Parcel).where(Parcel.id == parcel_id)
        if load_relations:
            stmt = stmt.options(
                selectinload(Parcel.buildings),
                selectinload(Parcel.infrastructure_associations),
            )
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def get_by_ulpin(db: AsyncSession, ulpin_2d: str) -> Optional[Parcel]:
        stmt = select(Parcel).where(Parcel.ulpin_2d == ulpin_2d.strip())
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def list_parcels(
        db: AsyncSession,
        city_id: Optional[uuid.UUID] = None,
        region_id: Optional[uuid.UUID] = None,
        bbox: Optional[Tuple[float, float, float, float]] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[Parcel], int]:
        filters = []
        if city_id:
            filters.append(Parcel.city_id == city_id)
        if region_id:
            filters.append(Parcel.region_id == region_id)
        if bbox:
            min_lon, min_lat, max_lon, max_lat = bbox
            envelope = geofunc.ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
            filters.append(geofunc.ST_Intersects(Parcel.geom_2d, envelope))

        where_clause = and_(*filters) if filters else True

        count_stmt = select(func.count(Parcel.id)).where(where_clause)
        total = (await db.execute(count_stmt)).scalar() or 0

        stmt = (
            select(Parcel)
            .where(where_clause)
            .order_by(Parcel.created_at.desc())
            .offset(skip)
            .limit(limit)
            .options(selectinload(Parcel.buildings))
        )
        items = (await db.execute(stmt)).scalars().all()
        return list(items), total

    @staticmethod
    async def search_parcels(
        db: AsyncSession,
        query: str,
        limit: int = 10
    ) -> List[Parcel]:
        clean_q = f"%{query.strip()}%"
        from sqlalchemy import or_, cast, String
        stmt = (
            select(Parcel)
            .outerjoin(Parcel.buildings)
            .where(
                or_(
                    Parcel.ulpin_2d.ilike(clean_q),
                    Parcel.survey_number.ilike(clean_q),
                    cast(Parcel.id, String).ilike(clean_q),
                    Building.building_code.ilike(clean_q),
                    cast(Building.id, String).ilike(clean_q),
                )
            )
            .distinct()
            .order_by(Parcel.created_at.desc())
            .limit(limit)
            .options(
                selectinload(Parcel.buildings),
                selectinload(Parcel.city),
                selectinload(Parcel.region),
            )
        )
        items = (await db.execute(stmt)).scalars().all()
        return list(items)

    @staticmethod
    async def list_distinct_land_uses(db: AsyncSession) -> List[str]:
        stmt = select(Parcel.land_use).distinct().order_by(Parcel.land_use)
        result = await db.execute(stmt)
        return [r for r in result.scalars().all() if r]

    @staticmethod
    async def create_parcel(db: AsyncSession, parcel: Parcel) -> Parcel:
        db.add(parcel)
        await db.flush()
        return parcel


class BuildingRepository:
    """Data access repository for 3D Physical Buildings."""

    @staticmethod
    async def get_by_id(db: AsyncSession, building_id: uuid.UUID) -> Optional[Building]:
        stmt = (
            select(Building)
            .where(Building.id == building_id)
            .options(
                selectinload(Building.floors).selectinload(Floor.units),
            )
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def list_by_parcel(
        db: AsyncSession, parcel_id: uuid.UUID
    ) -> List[Building]:
        stmt = (
            select(Building)
            .where(Building.parcel_id == parcel_id)
            .order_by(Building.building_code)
            .options(selectinload(Building.floors))
        )
        items = (await db.execute(stmt)).scalars().all()
        return list(items)

    @staticmethod
    async def list_by_bbox(
        db: AsyncSession, bbox: Tuple[float, float, float, float], limit: int = 50
    ) -> List[Building]:
        min_lon, min_lat, max_lon, max_lat = bbox
        envelope = geofunc.ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
        stmt = (
            select(Building)
            .where(geofunc.ST_Intersects(Building.footprint_geom, envelope))
            .limit(limit)
        )
        items = (await db.execute(stmt)).scalars().all()
        return list(items)


class FloorRepository:
    """Data access repository for Vertical Floors."""

    @staticmethod
    async def get_by_id(db: AsyncSession, floor_id: uuid.UUID) -> Optional[Floor]:
        stmt = (
            select(Floor)
            .where(Floor.id == floor_id)
            .options(selectinload(Floor.units))
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def list_by_building(
        db: AsyncSession, building_id: uuid.UUID
    ) -> List[Floor]:
        stmt = (
            select(Floor)
            .where(Floor.building_id == building_id)
            .order_by(Floor.floor_number)
            .options(selectinload(Floor.units))
        )
        items = (await db.execute(stmt)).scalars().all()
        return list(items)


class UnitRepository:
    """Data access repository for 3D Property Units."""

    @staticmethod
    async def get_by_id(db: AsyncSession, unit_id: uuid.UUID) -> Optional[Unit]:
        stmt = select(Unit).where(Unit.id == unit_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def get_by_ulpin(db: AsyncSession, ulpin_3d: str) -> Optional[Unit]:
        stmt = select(Unit).where(Unit.ulpin_3d == ulpin_3d.strip())
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def list_by_floor(
        db: AsyncSession, floor_id: uuid.UUID
    ) -> List[Unit]:
        stmt = (
            select(Unit)
            .where(Unit.floor_id == floor_id)
            .order_by(Unit.unit_number)
        )
        items = (await db.execute(stmt)).scalars().all()
        return list(items)


class InfrastructureRepository:
    """Data access repository for Infrastructure Assets."""

    @staticmethod
    async def get_by_id(
        db: AsyncSession, infra_id: uuid.UUID
    ) -> Optional[Infrastructure]:
        stmt = (
            select(Infrastructure)
            .where(Infrastructure.id == infra_id)
            .options(selectinload(Infrastructure.parcel_associations))
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def list_by_city(
        db: AsyncSession, city_id: uuid.UUID, skip: int = 0, limit: int = 50
    ) -> Tuple[List[Infrastructure], int]:
        count_stmt = select(func.count(Infrastructure.id)).where(
            Infrastructure.city_id == city_id
        )
        total = (await db.execute(count_stmt)).scalar() or 0

        stmt = (
            select(Infrastructure)
            .where(Infrastructure.city_id == city_id)
            .order_by(Infrastructure.name)
            .offset(skip)
            .limit(limit)
        )
        items = (await db.execute(stmt)).scalars().all()
        return list(items), total

    @staticmethod
    async def list_by_bbox(
        db: AsyncSession,
        bbox: Tuple[float, float, float, float],
        infra_type: Optional[str] = None,
        limit: int = 100
    ) -> List[Infrastructure]:
        min_lon, min_lat, max_lon, max_lat = bbox
        envelope = geofunc.ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
        stmt = select(Infrastructure).where(geofunc.ST_Intersects(Infrastructure.geom_2d, envelope))
        if infra_type:
            stmt = stmt.where(Infrastructure.infrastructure_type == infra_type.upper())
        stmt = stmt.limit(limit)
        items = (await db.execute(stmt)).scalars().all()
        return list(items)
