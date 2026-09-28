"""Durable Ingestion Jobs and GIS Pipeline Execution State

Revision ID: 0003_ingestion_jobs
Revises: 0002_user_auth_mapping
Create Date: 2026-09-23 12:45:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = '0003_ingestion_jobs'
down_revision: Union[str, None] = '0002_user_auth_mapping'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safely create public.ingestion_jobs table if it does not already exist
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
            user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
            file_name VARCHAR(255) NOT NULL,
            file_size_bytes BIGINT NOT NULL,
            file_hash VARCHAR(64) NOT NULL,
            dataset_type VARCHAR(50) NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
            stage VARCHAR(50) NOT NULL DEFAULT 'INITIALIZED',
            progress_percent INTEGER NOT NULL DEFAULT 0,
            source_crs VARCHAR(100),
            target_crs VARCHAR(30) DEFAULT 'EPSG:4326',
            records_total INTEGER DEFAULT 0,
            records_accepted INTEGER DEFAULT 0,
            records_rejected INTEGER DEFAULT 0,
            records_warnings INTEGER DEFAULT 0,
            quality_report JSONB,
            error_message TEXT,
            processing_logs JSONB DEFAULT '[]'::jsonb,
            processing_version VARCHAR(20) DEFAULT '1.0.0',
            storage_path TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON public.ingestion_jobs(status);
        CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_file_hash ON public.ingestion_jobs(file_hash);
        CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_user_id ON public.ingestion_jobs(user_id);
        CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_dataset_id ON public.ingestion_jobs(dataset_id);
        CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_created_at ON public.ingestion_jobs(created_at DESC);
    """)


def downgrade() -> None:
    op.execute("""
        DROP TABLE IF EXISTS public.ingestion_jobs CASCADE;
    """)
