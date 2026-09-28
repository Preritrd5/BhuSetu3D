"""Phase 10 Natural-Language Spatial Query & AI Spatial Investigator

Revision ID: 0008_phase10_spatial_investigator
Revises: 0007_phase9_spatial_intelligence_conflicts
Create Date: 2026-09-25 10:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = '0008_phase10_spatial_investigator'
down_revision: Union[str, None] = '0007_phase9_spatial_intelligence_conflicts'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create public.spatial_investigations table for audit, reproducibility & observability
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.spatial_investigations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            request_id VARCHAR(64) UNIQUE NOT NULL,
            user_id UUID,
            question TEXT NOT NULL,
            intent VARCHAR(64) NOT NULL,
            tool_executed VARCHAR(64) NOT NULL,
            model_used VARCHAR(64) NOT NULL DEFAULT 'gemini-2.0-flash',
            status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
            duration_ms INTEGER NOT NULL DEFAULT 0,
            result_count INTEGER NOT NULL DEFAULT 0,
            execution_trace JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_investigations_request ON public.spatial_investigations(request_id);
        CREATE INDEX IF NOT EXISTS idx_investigations_intent ON public.spatial_investigations(intent);
        CREATE INDEX IF NOT EXISTS idx_investigations_user ON public.spatial_investigations(user_id);
        CREATE INDEX IF NOT EXISTS idx_investigations_created ON public.spatial_investigations(created_at DESC);
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS public.spatial_investigations CASCADE;")
