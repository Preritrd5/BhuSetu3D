"""
BhuSetu 3D Ingestion Job Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 4: Data Ingestion & GIS Processing Pipeline
"""
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.ingestion import IngestionJob
from app.core.logging import logger


class JobService:
    """Manages database-backed ingestion job state, progress stages, and execution logs."""

    @staticmethod
    async def create_job(
        db: AsyncSession,
        file_name: str,
        file_size_bytes: int,
        file_hash: str,
        dataset_type: str,
        user_id: Optional[uuid.UUID] = None,
        dataset_id: Optional[uuid.UUID] = None,
        storage_path: Optional[str] = None,
        source_crs: Optional[str] = None,
    ) -> IngestionJob:
        """Initializes a new durable ingestion job record in Supabase PostGIS."""
        job = IngestionJob(
            id=uuid.uuid4(),
            file_name=file_name,
            file_size_bytes=file_size_bytes,
            file_hash=file_hash,
            dataset_type=dataset_type,
            user_id=user_id,
            dataset_id=dataset_id,
            storage_path=storage_path,
            source_crs=source_crs,
            status="CREATED",
            stage="INITIALIZED",
            progress_percent=0,
            processing_logs=[{
                "timestamp": datetime.utcnow().isoformat(),
                "level": "INFO",
                "stage": "INITIALIZED",
                "message": f"Ingestion job created for file '{file_name}' ({file_size_bytes} bytes).",
            }],
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job

    @staticmethod
    async def get_job(db: AsyncSession, job_id: uuid.UUID) -> Optional[IngestionJob]:
        """Fetches a specific ingestion job by ID."""
        result = await db.execute(select(IngestionJob).where(IngestionJob.id == job_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_jobs(
        db: AsyncSession,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[IngestionJob], int]:
        """Lists jobs with optional status filter and pagination."""
        query = select(IngestionJob)
        if status:
            query = query.where(IngestionJob.status == status.upper())
        query = query.order_by(desc(IngestionJob.created_at)).offset(offset).limit(limit)

        result = await db.execute(query)
        jobs = list(result.scalars().all())

        # Total count
        count_query = select(IngestionJob)
        if status:
            count_query = count_query.where(IngestionJob.status == status.upper())
        count_res = await db.execute(count_query)
        total = len(count_res.scalars().all())

        return jobs, total

    @staticmethod
    async def check_duplicate_file(db: AsyncSession, file_hash: str) -> Optional[IngestionJob]:
        """Checks for existing completed job with identical cryptographic SHA-256 hash."""
        result = await db.execute(
            select(IngestionJob)
            .where(IngestionJob.file_hash == file_hash)
            .where(IngestionJob.status == "COMPLETED")
            .order_by(desc(IngestionJob.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_job_stage(
        db: AsyncSession,
        job_id: uuid.UUID,
        status: str,
        stage: str,
        progress_percent: int,
        log_message: Optional[str] = None,
        records_total: Optional[int] = None,
        records_accepted: Optional[int] = None,
        records_rejected: Optional[int] = None,
        records_warnings: Optional[int] = None,
        quality_report: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
    ) -> IngestionJob:
        """Safely updates job lifecycle status, stage, progress %, and quality report."""
        job = await JobService.get_job(db, job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found.")

        job.status = status
        job.stage = stage
        job.progress_percent = progress_percent
        job.updated_at = datetime.utcnow()

        if records_total is not None:
            job.records_total = records_total
        if records_accepted is not None:
            job.records_accepted = records_accepted
        if records_rejected is not None:
            job.records_rejected = records_rejected
        if records_warnings is not None:
            job.records_warnings = records_warnings
        if quality_report is not None:
            job.quality_report = quality_report
        if error_message is not None:
            job.error_message = error_message

        if log_message:
            logs = list(job.processing_logs)
            logs.append({
                "timestamp": datetime.utcnow().isoformat(),
                "level": "ERROR" if status == "FAILED" else "INFO",
                "stage": stage,
                "message": log_message,
            })
            job.processing_logs = logs

        await db.commit()
        await db.refresh(job)
        return job
