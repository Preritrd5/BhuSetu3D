"""Phase 13 Analytics & Quality Scoring

Revision ID: 0011_phase13_analytics_quality_scoring
Revises: 0010_phase12_4d_property_history_infrastructure
Create Date: 2026-09-25 16:30:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = '0011_phase13_analytics_quality_scoring'
down_revision: Union[str, None] = '0010_phase12_4d_property_history_infrastructure'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create public.quality_score_snapshots table for deterministic quality score history
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.quality_score_snapshots (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entity_type VARCHAR(50) NOT NULL,
            entity_id UUID NOT NULL,
            overall_score NUMERIC(5, 2) NOT NULL,
            component_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
            weights_used JSONB NOT NULL DEFAULT '{}'::jsonb,
            rule_results JSONB NOT NULL DEFAULT '[]'::jsonb,
            missing_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
            scoring_version VARCHAR(50) NOT NULL DEFAULT 'quality_v1',
            calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            calculated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_qual_snapshot_entity ON public.quality_score_snapshots(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_qual_snapshot_calc ON public.quality_score_snapshots(calculated_at);
        CREATE INDEX IF NOT EXISTS idx_qual_snapshot_score ON public.quality_score_snapshots(overall_score);
    """)

    # 2. Create public.quality_issues table for actionable quality findings
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.quality_issues (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entity_type VARCHAR(50) NOT NULL,
            entity_id UUID NOT NULL,
            category VARCHAR(50) NOT NULL,
            severity VARCHAR(20) NOT NULL,
            rule_code VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            discrepancy_details JSONB NOT NULL DEFAULT '{}'::jsonb,
            evidence_reference JSONB NOT NULL DEFAULT '{}'::jsonb,
            status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
            action_url VARCHAR(255),
            detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            resolved_at TIMESTAMPTZ,
            resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
            CONSTRAINT uq_quality_issue_dedup UNIQUE (entity_type, entity_id, rule_code, category)
        );

        CREATE INDEX IF NOT EXISTS idx_qual_issue_entity ON public.quality_issues(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_qual_issue_cat ON public.quality_issues(category);
        CREATE INDEX IF NOT EXISTS idx_qual_issue_sev ON public.quality_issues(severity);
        CREATE INDEX IF NOT EXISTS idx_qual_issue_status ON public.quality_issues(status);
    """)

    # 3. Create performance optimization indexes for analytics aggregations
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_parcels_city ON public.parcels(city_id);
        CREATE INDEX IF NOT EXISTS idx_buildings_parcel ON public.buildings(parcel_id);
        CREATE INDEX IF NOT EXISTS idx_floors_building ON public.floors(building_id);
        CREATE INDEX IF NOT EXISTS idx_units_floor ON public.units(floor_id);
        CREATE INDEX IF NOT EXISTS idx_conflicts_status ON public.conflicts(status);
        CREATE INDEX IF NOT EXISTS idx_conflicts_severity ON public.conflicts(severity);
        CREATE INDEX IF NOT EXISTS idx_verif_records_status ON public.verification_records(new_status);
    """)


def downgrade() -> None:
    op.execute("""
        DROP TABLE IF EXISTS public.quality_issues;
        DROP TABLE IF EXISTS public.quality_score_snapshots;
    """)
