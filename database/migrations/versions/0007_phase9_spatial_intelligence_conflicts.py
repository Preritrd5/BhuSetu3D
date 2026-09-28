"""Phase 9 Spatial Intelligence & Conflict Detection System

Revision ID: 0007_phase9_spatial_intelligence_conflicts
Revises: 0006_phase8_evidence_provenance
Create Date: 2026-09-25 08:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = '0007_phase9_spatial_intelligence_conflicts'
down_revision: Union[str, None] = '0006_phase8_evidence_provenance'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enhance public.conflicts table with Phase 9 spatial intelligence fields
    op.execute("""
        ALTER TABLE public.conflicts
        ADD COLUMN IF NOT EXISTS rule_id VARCHAR(50),
        ADD COLUMN IF NOT EXISTS rule_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50) DEFAULT 'PARCEL',
        ADD COLUMN IF NOT EXISTS entity_id UUID,
        ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS related_entity_id UUID,
        ADD COLUMN IF NOT EXISTS measured_value NUMERIC(12, 3),
        ADD COLUMN IF NOT EXISTS threshold_value NUMERIC(12, 3),
        ADD COLUMN IF NOT EXISTS measured_unit VARCHAR(20) DEFAULT 'm²',
        ADD COLUMN IF NOT EXISTS explanation TEXT,
        ADD COLUMN IF NOT EXISTS evidence_reference JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(4, 3) DEFAULT 0.900,
        ADD COLUMN IF NOT EXISTS analysis_version VARCHAR(50) DEFAULT 'spatial_rules_v1';

        CREATE INDEX IF NOT EXISTS idx_conflicts_rule ON public.conflicts(rule_id);
        CREATE INDEX IF NOT EXISTS idx_conflicts_entity ON public.conflicts(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_conflicts_related ON public.conflicts(related_entity_type, related_entity_id);
        CREATE INDEX IF NOT EXISTS idx_conflicts_severity ON public.conflicts(severity);
    """)

    # 2. Create public.spatial_rules table for configurable rule evaluation
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.spatial_rules (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            description TEXT NOT NULL,
            target_entity_type VARCHAR(50) NOT NULL,
            related_entity_type VARCHAR(50),
            spatial_operation VARCHAR(50) NOT NULL,
            threshold_value NUMERIC(12, 3) NOT NULL,
            threshold_unit VARCHAR(20) NOT NULL,
            severity VARCHAR(20) NOT NULL DEFAULT 'HIGH',
            is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            metadata_json JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_spatial_rules_target ON public.spatial_rules(target_entity_type);
        CREATE INDEX IF NOT EXISTS idx_spatial_rules_enabled ON public.spatial_rules(is_enabled);
    """)

    # 3. Seed canonical spatial intelligence rules
    op.execute("""
        INSERT INTO public.spatial_rules (id, name, description, target_entity_type, related_entity_type, spatial_operation, threshold_value, threshold_unit, severity, is_enabled)
        VALUES
        ('RULE-BLDG-001', 'Building Outside Parcel Boundary', 'Detects building footprints extending beyond their legal cadastral parcel boundaries.', 'BUILDING', 'PARCEL', 'OUTSIDE_AREA', 0.500, 'm²', 'HIGH', TRUE),
        ('RULE-BLDG-002', 'Building Boundary Proximity', 'Identifies buildings situated in close proximity to parcel boundaries within configured setback buffer.', 'BUILDING', 'PARCEL', 'MIN_DISTANCE', 1.000, 'm', 'MEDIUM', TRUE),
        ('RULE-PRCL-001', 'Parcel Geometry Overlap', 'Detects geometric overlaps between adjacent cadastral parcel polygons exceeding tolerance.', 'PARCEL', 'PARCEL', 'OVERLAP_AREA', 1.000, 'm²', 'HIGH', TRUE),
        ('RULE-INFR-001', 'Infrastructure Buffer Proximity', 'Identifies properties within critical safety proximity buffer of utilities or infrastructure corridors.', 'PARCEL', 'INFRASTRUCTURE', 'INFRA_PROXIMITY', 5.000, 'm', 'MEDIUM', TRUE),
        ('RULE-GEOM-001', 'Geometry Structural Validity', 'Identifies self-intersecting, non-closed, or degenerate spatial geometries.', 'PARCEL', NULL, 'GEOMETRY_VALIDITY', 0.000, 'validity', 'HIGH', TRUE)
        ON CONFLICT (id) DO NOTHING;
    """)


def downgrade() -> None:
    op.execute("""
        DROP TABLE IF EXISTS public.spatial_rules CASCADE;

        ALTER TABLE public.conflicts
        DROP COLUMN IF EXISTS rule_id,
        DROP COLUMN IF EXISTS rule_name,
        DROP COLUMN IF EXISTS entity_type,
        DROP COLUMN IF EXISTS entity_id,
        DROP COLUMN IF EXISTS related_entity_type,
        DROP COLUMN IF EXISTS related_entity_id,
        DROP COLUMN IF EXISTS measured_value,
        DROP COLUMN IF EXISTS threshold_value,
        DROP COLUMN IF EXISTS measured_unit,
        DROP COLUMN IF EXISTS explanation,
        DROP COLUMN IF EXISTS evidence_reference,
        DROP COLUMN IF EXISTS confidence_score,
        DROP COLUMN IF EXISTS analysis_version;
    """)
