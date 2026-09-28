"""
BhuSetu 3D Dataset & Data Source Governance Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 4: Data Ingestion & GIS Processing Pipeline
"""
import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.provenance import DataSource, Dataset
from app.schemas.ingestion import DataSourceCreate, DatasetCreate
from app.core.spatial import geometry_to_geojson


class DatasetService:
    """Provides authoritative management for spatial datasets and provider organizations."""

    @staticmethod
    async def create_data_source(db: AsyncSession, data_in: DataSourceCreate) -> DataSource:
        """Registers a new authoritative survey or remote sensing provider organization."""
        source = DataSource(
            id=uuid.uuid4(),
            name=data_in.name,
            organization_type=data_in.organization_type,
            trust_level=data_in.trust_level,
            contact_email=data_in.contact_email,
        )
        db.add(source)
        await db.commit()
        await db.refresh(source)
        return source

    @staticmethod
    async def list_data_sources(db: AsyncSession, limit: int = 100) -> List[DataSource]:
        """Lists registered data sources."""
        result = await db.execute(select(DataSource).order_by(desc(DataSource.created_at)).limit(limit))
        return list(result.scalars().all())

    @staticmethod
    async def get_data_source(db: AsyncSession, source_id: uuid.UUID) -> Optional[DataSource]:
        """Gets data source by ID."""
        result = await db.execute(select(DataSource).where(DataSource.id == source_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create_dataset(db: AsyncSession, data_in: DatasetCreate) -> Dataset:
        """Registers an ingested spatial dataset collection."""
        dataset = Dataset(
            id=uuid.uuid4(),
            source_id=data_in.source_id,
            city_id=data_in.city_id,
            name=data_in.name,
            dataset_type=data_in.dataset_type.value,
            acquisition_date=data_in.acquisition_date,
            sensor_details=data_in.sensor_details,
            storage_uri=data_in.storage_uri,
        )
        db.add(dataset)
        await db.commit()
        await db.refresh(dataset)
        return dataset

    @staticmethod
    async def list_datasets(
        db: AsyncSession,
        city_id: Optional[uuid.UUID] = None,
        dataset_type: Optional[str] = None,
        limit: int = 100
    ) -> List[Dataset]:
        """Lists datasets with optional city and type filters."""
        query = select(Dataset)
        if city_id:
            query = query.where(Dataset.city_id == city_id)
        if dataset_type:
            query = query.where(Dataset.dataset_type == dataset_type.upper())
        query = query.order_by(desc(Dataset.created_at)).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_dataset(db: AsyncSession, dataset_id: uuid.UUID) -> Optional[Dataset]:
        """Gets dataset by ID."""
        result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
        return result.scalar_one_or_none()
