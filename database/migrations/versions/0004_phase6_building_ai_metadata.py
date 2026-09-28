"""Phase 6 Building AI Metadata & Extraction Jobs

Revision ID: 0004_phase6_building_ai_metadata
Revises: 0003_ingestion_jobs
Create Date: 2026-09-23 13:40:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = '0004_phase6_building_ai_metadata'
down_revision: Union[str, None] = '0003_ingestion_jobs'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add Phase 6 metadata columns to public.buildings (safely if not exists)
    op.execute("""
        ALTER TABLE public.buildings 
        ADD COLUMN IF NOT EXISTS height_source VARCHAR(50),
        ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(50),
        ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(4, 3),
        ADD COLUMN IF NOT EXISTS processing_version VARCHAR(30),
        ADD COLUMN IF NOT EXISTS status_3d VARCHAR(30) DEFAULT 'FOOTPRINT_ONLY',
        ADD COLUMN IF NOT EXISTS metadata_json JSONB DEFAULT '{}'::jsonb;
    """)

    # 2. Create public.ai_extraction_jobs table
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.ai_extraction_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
            user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
            model_name VARCHAR(100) NOT NULL,
            model_version VARCHAR(30) NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
            stage VARCHAR(50) NOT NULL DEFAULT 'INITIALIZED',
            progress_percent INTEGER NOT NULL DEFAULT 0,
            buildings_detected INTEGER DEFAULT 0,
            buildings_extracted INTEGER DEFAULT 0,
            buildings_rejected INTEGER DEFAULT 0,
            buildings_3d_generated INTEGER DEFAULT 0,
            execution_logs JSONB DEFAULT '[]'::jsonb,
            error_message TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_ai_extraction_jobs_status ON public.ai_extraction_jobs(status);
        CREATE INDEX IF NOT EXISTS idx_ai_extraction_jobs_user_id ON public.ai_extraction_jobs(user_id);
        CREATE INDEX IF NOT EXISTS idx_ai_extraction_jobs_dataset_id ON public.ai_extraction_jobs(dataset_id);
        CREATE INDEX IF NOT EXISTS idx_ai_extraction_jobs_created_at ON public.ai_extraction_jobs(created_at DESC);
    """)


def downgrade() -> None:
    op.execute("""
        DROP TABLE IF EXISTS public.ai_extraction_jobs CASCADE;
        
        ALTER TABLE public.buildings
        DROP COLUMN IF EXISTS height_source,
        DROP COLUMN IF EXISTS extraction_method,
        DROP COLUMN IF EXISTS confidence_score,
        DROP COLUMN IF EXISTS processing_version,
        DROP COLUMN IF EXISTS status_3d,
        DROP COLUMN IF EXISTS metadata_json;
    """)
