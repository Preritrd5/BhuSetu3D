"""Phase 12 4D Property History & Infrastructure Intelligence

Revision ID: 0010_phase12_4d_property_history_infrastructure
Revises: 0009_phase11_verification_workflow
Create Date: 2026-09-25 15:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = '0010_phase12_4d_property_history_infrastructure'
down_revision: Union[str, None] = '0009_phase11_verification_workflow'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enhance public.infrastructure with temporal observation metadata
    op.execute("""
        ALTER TABLE public.infrastructure
        ADD COLUMN IF NOT EXISTS observation_date DATE DEFAULT '2026-01-01',
        ADD COLUMN IF NOT EXISTS valid_from DATE,
        ADD COLUMN IF NOT EXISTS valid_to DATE,
        ADD COLUMN IF NOT EXISTS network_connectivity JSONB DEFAULT '{"is_physically_connected": false}'::jsonb;

        CREATE INDEX IF NOT EXISTS idx_infra_obs_date ON public.infrastructure(observation_date);
        CREATE INDEX IF NOT EXISTS idx_infra_category ON public.infrastructure(utility_category);
    """)

    # 2. Create public.property_state_versions table for 4D temporal states
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.property_state_versions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entity_type VARCHAR(50) NOT NULL,
            entity_id UUID NOT NULL,
            version_number INTEGER NOT NULL,
            observed_at DATE NOT NULL,
            valid_from DATE,
            valid_to DATE,
            observed_interval VARCHAR(50) DEFAULT 'EXACT',
            source_dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
            source_name VARCHAR(150),
            geom_spatial GEOMETRY(GEOMETRY, 4326),
            attributes_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
            evidence_reference JSONB DEFAULT '{}'::jsonb,
            confidence_score NUMERIC(4, 3) DEFAULT 0.900,
            verification_status VARCHAR(30) DEFAULT 'UNREVIEWED',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT uq_entity_version UNIQUE (entity_type, entity_id, version_number),
            CONSTRAINT chk_valid_interval CHECK (valid_from IS NULL OR valid_to IS NULL OR valid_from <= valid_to)
        );

        CREATE INDEX IF NOT EXISTS idx_state_ver_entity ON public.property_state_versions(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_state_ver_observed ON public.property_state_versions(observed_at);
        CREATE INDEX IF NOT EXISTS idx_state_ver_geom ON public.property_state_versions USING GIST (geom_spatial);
        CREATE INDEX IF NOT EXISTS idx_state_ver_verif ON public.property_state_versions(verification_status);
    """)

    # 3. Create public.change_events table for normalized temporal transitions
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.change_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entity_type VARCHAR(50) NOT NULL,
            entity_id UUID NOT NULL,
            change_type VARCHAR(50) NOT NULL,
            previous_version_id UUID REFERENCES public.property_state_versions(id) ON DELETE SET NULL,
            new_version_id UUID REFERENCES public.property_state_versions(id) ON DELETE SET NULL,
            observed_at DATE NOT NULL,
            measured_change JSONB NOT NULL DEFAULT '{}'::jsonb,
            change_geom GEOMETRY(GEOMETRY, 4326),
            description TEXT NOT NULL,
            evidence_reference JSONB DEFAULT '{}'::jsonb,
            confidence_score NUMERIC(4, 3) DEFAULT 0.850,
            verification_status VARCHAR(30) NOT NULL DEFAULT 'UNREVIEWED',
            status VARCHAR(30) NOT NULL DEFAULT 'DETECTED',
            analysis_version VARCHAR(50) NOT NULL DEFAULT 'temporal_analysis_v1',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT uq_change_event_dedup UNIQUE (entity_type, entity_id, previous_version_id, new_version_id, change_type, analysis_version)
        );

        CREATE INDEX IF NOT EXISTS idx_change_events_entity ON public.change_events(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_change_events_type ON public.change_events(change_type);
        CREATE INDEX IF NOT EXISTS idx_change_events_observed ON public.change_events(observed_at);
        CREATE INDEX IF NOT EXISTS idx_change_events_geom ON public.change_events USING GIST (change_geom);
        CREATE INDEX IF NOT EXISTS idx_change_events_verif ON public.change_events(verification_status);
    """)


def downgrade() -> None:
    op.execute("""
        DROP TABLE IF EXISTS public.change_events CASCADE;
        DROP TABLE IF EXISTS public.property_state_versions CASCADE;

        ALTER TABLE public.infrastructure
        DROP COLUMN IF EXISTS observation_date,
        DROP COLUMN IF EXISTS valid_from,
        DROP COLUMN IF EXISTS valid_to,
        DROP COLUMN IF EXISTS network_connectivity;
    """)
