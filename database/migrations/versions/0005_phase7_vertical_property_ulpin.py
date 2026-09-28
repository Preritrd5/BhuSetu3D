"""Phase 7 Vertical Property Mapping & ULPIN Model

Revision ID: 0005_phase7_vertical_property_ulpin
Revises: 0004_phase6_building_ai_metadata
Create Date: 2026-09-23 18:55:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = '0005_phase7_vertical_property_ulpin'
down_revision: Union[str, None] = '0004_phase6_building_ai_metadata'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add Phase 7 vertical metadata & provenance columns to public.floors
    op.execute("""
        ALTER TABLE public.floors 
        ADD COLUMN IF NOT EXISTS floor_label VARCHAR(100),
        ADD COLUMN IF NOT EXISTS status_3d VARCHAR(50) DEFAULT 'AVAILABLE',
        ADD COLUMN IF NOT EXISTS height_source VARCHAR(50),
        ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(100),
        ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(4, 3),
        ADD COLUMN IF NOT EXISTS processing_version VARCHAR(30),
        ADD COLUMN IF NOT EXISTS metadata_json JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    """)

    # 2. Add Phase 7 vertical metadata & provenance columns to public.units
    op.execute("""
        ALTER TABLE public.units 
        ADD COLUMN IF NOT EXISTS unit_label VARCHAR(100),
        ADD COLUMN IF NOT EXISTS status_3d VARCHAR(50) DEFAULT 'AVAILABLE',
        ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(100),
        ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(4, 3),
        ADD COLUMN IF NOT EXISTS processing_version VARCHAR(30),
        ADD COLUMN IF NOT EXISTS metadata_json JSONB DEFAULT '{}'::jsonb;
    """)

    # 3. Create public.property_identities table for ULPIN-oriented property records
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.property_identities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            parcel_id UUID NOT NULL REFERENCES public.parcels(id) ON DELETE CASCADE,
            building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
            ulpin_oriented_id VARCHAR(100) UNIQUE NOT NULL,
            identity_version INTEGER NOT NULL DEFAULT 1,
            status VARCHAR(30) NOT NULL DEFAULT 'PROTOTYPE',
            metadata_json JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_property_identities_ulpin ON public.property_identities(ulpin_oriented_id);
        CREATE INDEX IF NOT EXISTS idx_property_identities_parcel ON public.property_identities(parcel_id);
        CREATE INDEX IF NOT EXISTS idx_property_identities_building ON public.property_identities(building_id);
    """)


def downgrade() -> None:
    op.execute("""
        DROP TABLE IF EXISTS public.property_identities CASCADE;

        ALTER TABLE public.units
        DROP COLUMN IF EXISTS unit_label,
        DROP COLUMN IF EXISTS status_3d,
        DROP COLUMN IF EXISTS extraction_method,
        DROP COLUMN IF EXISTS confidence_score,
        DROP COLUMN IF EXISTS processing_version,
        DROP COLUMN IF EXISTS metadata_json;

        ALTER TABLE public.floors
        DROP COLUMN IF EXISTS floor_label,
        DROP COLUMN IF EXISTS status_3d,
        DROP COLUMN IF EXISTS height_source,
        DROP COLUMN IF EXISTS extraction_method,
        DROP COLUMN IF EXISTS confidence_score,
        DROP COLUMN IF EXISTS processing_version,
        DROP COLUMN IF EXISTS metadata_json,
        DROP COLUMN IF EXISTS updated_at;
    """)
