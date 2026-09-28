"""Phase 8 Evidence, Provenance & Confidence System

Revision ID: 0006_phase8_evidence_provenance
Revises: 0005_phase7_vertical_property_ulpin
Create Date: 2026-09-24 18:30:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = '0006_phase8_evidence_provenance'
down_revision: Union[str, None] = '0005_phase7_vertical_property_ulpin'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enhance public.evidence table with Phase 8 provenance, status & confidence fields
    op.execute("""
        ALTER TABLE public.evidence
        ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
        ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) NOT NULL DEFAULT 'SURVEY_DATA',
        ADD COLUMN IF NOT EXISTS supporting_factors JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS limiting_factors JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS evidence_metadata JSONB DEFAULT '{}'::jsonb;

        ALTER TABLE public.evidence ALTER COLUMN dataset_id DROP NOT NULL;

        CREATE INDEX IF NOT EXISTS idx_evidence_source_type ON public.evidence(source_type);
        CREATE INDEX IF NOT EXISTS idx_evidence_status ON public.evidence(status);
        CREATE INDEX IF NOT EXISTS idx_evidence_confidence ON public.evidence(confidence_score);
    """)

    # 2. Add reliability_score to public.data_sources if not exists
    op.execute("""
        ALTER TABLE public.data_sources
        ADD COLUMN IF NOT EXISTS reliability_score NUMERIC(4, 3) DEFAULT 0.850;
    """)

    # 3. Create public.provenance_records table for geometry & operation lineage tracking
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.provenance_records (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            target_entity_type VARCHAR(50) NOT NULL,
            target_entity_id UUID NOT NULL,
            source_entity_type VARCHAR(50),
            source_entity_id UUID,
            operation_type VARCHAR(50) NOT NULL,
            operation_name VARCHAR(150) NOT NULL,
            operation_version VARCHAR(50),
            performed_by VARCHAR(100),
            execution_timestamp TIMESTAMPTZ DEFAULT NOW(),
            input_reference JSONB DEFAULT '{}'::jsonb,
            output_reference JSONB DEFAULT '{}'::jsonb,
            metadata_json JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_provenance_target ON public.provenance_records(target_entity_type, target_entity_id);
        CREATE INDEX IF NOT EXISTS idx_provenance_source ON public.provenance_records(source_entity_type, source_entity_id);
        CREATE INDEX IF NOT EXISTS idx_provenance_op_type ON public.provenance_records(operation_type);
        CREATE INDEX IF NOT EXISTS idx_provenance_created_at ON public.provenance_records(created_at);
    """)


def downgrade() -> None:
    op.execute("""
        DROP TABLE IF EXISTS public.provenance_records CASCADE;

        ALTER TABLE public.data_sources
        DROP COLUMN IF EXISTS reliability_score;

        ALTER TABLE public.evidence
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS source_type,
        DROP COLUMN IF EXISTS supporting_factors,
        DROP COLUMN IF EXISTS limiting_factors,
        DROP COLUMN IF EXISTS evidence_metadata;
    """)
