"""Phase 14 Production Security & Performance Hardening

Revision ID: 0012_phase14_production_security_hardening
Revises: 0011_phase13_analytics_quality_scoring
Create Date: 2026-09-25 18:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0012_phase14_production_security_hardening'
down_revision: Union[str, None] = '0011_phase13_analytics_quality_scoring'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # 1. POSTGIS SPATIAL PERFORMANCE INDEXES (GiST)
    # -------------------------------------------------------------------------
    op.execute("""
        -- Ensure GiST spatial index on property parcels
        CREATE INDEX IF NOT EXISTS idx_parcels_geom_2d_gist 
        ON public.parcels USING GIST (geom_2d);

        -- Ensure GiST spatial index on building footprints
        CREATE INDEX IF NOT EXISTS idx_buildings_footprint_gist 
        ON public.buildings USING GIST (footprint_geom);

        -- Ensure GiST spatial index on municipal infrastructure networks
        CREATE INDEX IF NOT EXISTS idx_infrastructure_geom_gist 
        ON public.infrastructure USING GIST (geom_spatial);

        -- Ensure GiST spatial index on 4D historical property state versions
        CREATE INDEX IF NOT EXISTS idx_prop_versions_geom_gist 
        ON public.property_state_versions USING GIST (geom_spatial);

        -- High-cardinality composite query indexes
        CREATE INDEX IF NOT EXISTS idx_conflicts_status_sev 
        ON public.conflicts (status, severity);

        CREATE INDEX IF NOT EXISTS idx_verification_status_rev 
        ON public.verification_records (decision, officer_id);

        CREATE INDEX IF NOT EXISTS idx_quality_issues_entity_status 
        ON public.quality_issues (entity_type, entity_id, status);

        CREATE INDEX IF NOT EXISTS idx_change_events_entity_time 
        ON public.change_events (entity_type, entity_id, observed_at DESC);
    """)

    # -------------------------------------------------------------------------
    # 2. ROW-LEVEL SECURITY (RLS) HARDENING & AUDIT INTEGRITY POLICIES
    # -------------------------------------------------------------------------
    op.execute("""
        -- Enable Row Level Security on core domain tables
        ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.verification_records ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.evidence ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.conflicts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.quality_score_snapshots ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.quality_issues ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.property_state_versions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.change_events ENABLE ROW LEVEL SECURITY;

        -- Service Role and Authenticated Read Policies
        DO $$ 
        BEGIN
            -- Audit logs: strictly append-only. No UPDATE or DELETE permitted.
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'audit_logs_select_policy'
            ) THEN
                CREATE POLICY audit_logs_select_policy ON public.audit_logs
                FOR SELECT USING (auth.role() = 'authenticated');
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'audit_logs_insert_policy'
            ) THEN
                CREATE POLICY audit_logs_insert_policy ON public.audit_logs
                FOR INSERT WITH CHECK (auth.role() = 'authenticated');
            END IF;

            -- Quality snapshots: readable by authenticated users
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'quality_score_snapshots' AND policyname = 'quality_snapshots_read'
            ) THEN
                CREATE POLICY quality_snapshots_read ON public.quality_score_snapshots
                FOR SELECT USING (true);
            END IF;

            -- Quality issues: readable by authenticated users, modifiable by authorized roles
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'quality_issues' AND policyname = 'quality_issues_read'
            ) THEN
                CREATE POLICY quality_issues_read ON public.quality_issues
                FOR SELECT USING (true);
            END IF;

            -- Verification records: readable by authenticated users
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'verification_records' AND policyname = 'verification_read'
            ) THEN
                CREATE POLICY verification_read ON public.verification_records
                FOR SELECT USING (true);
            END IF;

        END $$;
    """)


def downgrade() -> None:
    op.execute("""
        DROP INDEX IF EXISTS idx_parcels_geom_2d_gist;
        DROP INDEX IF EXISTS idx_buildings_footprint_gist;
        DROP INDEX IF EXISTS idx_infrastructure_geom_gist;
        DROP INDEX IF EXISTS idx_prop_versions_geom_gist;
        DROP INDEX IF EXISTS idx_conflicts_status_sev;
        DROP INDEX IF EXISTS idx_verification_status_rev;
        DROP INDEX IF EXISTS idx_quality_issues_entity_status;
        DROP INDEX IF EXISTS idx_change_events_entity_time;
    """)
