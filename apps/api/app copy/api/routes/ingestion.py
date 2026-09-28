"""
BhuSetu 3D Ingestion API Endpoints
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 4: Data Ingestion & GIS Processing Pipeline
"""
import uuid
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.dependencies.auth import get_current_user, require_any_role
from app.models.user import User
from app.schemas.ingestion import (
    FileUploadResponse,
    JobCreateRequest,
    IngestionJobResponse,
    JobLogsResponse,
    DatasetCreate,
    DatasetResponse,
    DataSourceCreate,
    DataSourceResponse,
)
from app.ingestion.services.ingestion_service import IngestionService, UPLOAD_DIR
from app.ingestion.services.job_service import JobService
from app.ingestion.services.dataset_service import DatasetService

router = APIRouter(prefix="/ingestion", tags=["Data Ingestion & GIS Pipeline"])

INGESTION_ROLES = ["ADMIN", "SURVEYOR", "GOVERNMENT_OFFICER"]


@router.post(
    "/upload",
    response_model=FileUploadResponse,
    summary="Upload and inspect spatial dataset",
    description="Uploads a spatial dataset (GeoJSON, Shapefile, GeoPackage, CSV, GeoTIFF) and performs immediate format & CRS inspection."
)
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role(INGESTION_ROLES)),
) -> FileUploadResponse:
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )
    return await IngestionService.stage_upload(db=db, file_bytes=content, filename=file.filename or "uploaded_dataset")


@router.post(
    "/jobs",
    response_model=IngestionJobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create and execute an ingestion job",
    description="Creates a durable ingestion job and runs validation, normalization, and PostGIS persistence."
)
async def create_and_execute_job(
    job_in: JobCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role(INGESTION_ROLES)),
) -> IngestionJobResponse:
    # Locate staged file matching file_id
    matching = list(UPLOAD_DIR.glob(f"{job_in.file_id}_*"))
    if not matching:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staged file with ID '{job_in.file_id}' not found. Please upload the file first via POST /upload."
        )
    staged_path = matching[0]

    # Initialize job in DB
    file_size = staged_path.stat().st_size
    from app.ingestion.validators.file_validator import FileValidator
    file_hash = FileValidator.calculate_sha256(staged_path)

    job = await JobService.create_job(
        db=db,
        file_name=staged_path.name.replace(f"{job_in.file_id}_", ""),
        file_size_bytes=file_size,
        file_hash=file_hash,
        dataset_type=job_in.dataset_type.value,
        user_id=current_user.id,
        dataset_id=job_in.dataset_id,
        storage_path=str(staged_path),
    )

    # Execute pipeline
    completed_job = await IngestionService.execute_job(
        db=db,
        job_id=job.id,
        staging_path=staged_path,
        job_in=job_in,
        user_id=current_user.id
    )
    return IngestionJobResponse.model_validate(completed_job)


@router.get(
    "/jobs",
    response_model=List[IngestionJobResponse],
    summary="List ingestion jobs",
    description="Retrieves a list of ingestion jobs with status filtering."
)
async def list_jobs(
    status: Optional[str] = Query(None, description="Filter by status (CREATED, VALIDATING, PROCESSING, COMPLETED, FAILED)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[IngestionJobResponse]:
    jobs, _ = await JobService.list_jobs(db, status=status, limit=limit, offset=offset)
    return [IngestionJobResponse.model_validate(j) for j in jobs]


@router.get(
    "/jobs/{job_id}",
    response_model=IngestionJobResponse,
    summary="Get ingestion job details and quality report",
    description="Retrieves status, progress, records summary, and compiled quality report for an ingestion job."
)
async def get_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IngestionJobResponse:
    try:
        j_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: '{job_id}'")

    job = await JobService.get_job(db, j_uuid)
    if not job:
        raise HTTPException(status_code=404, detail=f"Ingestion job '{job_id}' not found.")
    return IngestionJobResponse.model_validate(job)


@router.get(
    "/jobs/{job_id}/logs",
    response_model=JobLogsResponse,
    summary="Get ingestion job execution logs",
    description="Retrieves detailed timestamped execution logs for an ingestion job."
)
async def get_job_logs(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JobLogsResponse:
    try:
        j_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: '{job_id}'")

    job = await JobService.get_job(db, j_uuid)
    if not job:
        raise HTTPException(status_code=404, detail=f"Ingestion job '{job_id}' not found.")
    return JobLogsResponse(
        job_id=job.id,
        status=job.status,
        stage=job.stage,
        logs=job.processing_logs,
    )


# --- Data Source Endpoints ---
@router.post(
    "/data-sources",
    response_model=DataSourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a data source provider",
    description="Registers an authoritative survey or remote sensing provider organization."
)
async def create_data_source(
    data_in: DataSourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role(INGESTION_ROLES)),
) -> DataSourceResponse:
    source = await DatasetService.create_data_source(db, data_in)
    return DataSourceResponse.model_validate(source)


@router.get(
    "/data-sources",
    response_model=List[DataSourceResponse],
    summary="List data source providers",
    description="Retrieves registered data source organizations."
)
async def list_data_sources(
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[DataSourceResponse]:
    sources = await DatasetService.list_data_sources(db, limit=limit)
    return [DataSourceResponse.model_validate(s) for s in sources]


# --- Dataset Endpoints ---
@router.post(
    "/datasets",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a dataset collection",
    description="Registers a spatial dataset collection under an authoritative data source."
)
async def create_dataset(
    data_in: DatasetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role(INGESTION_ROLES)),
) -> DatasetResponse:
    dataset = await DatasetService.create_dataset(db, data_in)
    return DatasetResponse.model_validate(dataset)


@router.get(
    "/datasets",
    response_model=List[DatasetResponse],
    summary="List registered datasets",
    description="Retrieves a list of registered datasets."
)
async def list_datasets(
    city_id: Optional[str] = Query(None),
    dataset_type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[DatasetResponse]:
    c_uuid = uuid.UUID(city_id) if city_id else None
    datasets = await DatasetService.list_datasets(db, city_id=c_uuid, dataset_type=dataset_type, limit=limit)
    return [DatasetResponse.model_validate(d) for d in datasets]
