"""Phase 11 Human Verification Workflow + Audit Trail

Revision ID: 0009_phase11_verification_workflow
Revises: 0008_phase10_spatial_investigator
Create Date: 2026-09-25 12:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = '0009_phase11_verification_workflow'
down_revision: Union[str, None] = '0008_phase10_spatial_investigator'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enhance public.conflicts table with human verification lifecycle tracking
    op.execute("""
        ALTER TABLE public.conflicts
        ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) NOT NULL DEFAULT 'UNREVIEWED',
        ADD COLUMN IF NOT EXISTS assigned_reviewer_id UUID,
        ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS reviewed_by UUID;

        CREATE INDEX IF NOT EXISTS idx_conflicts_verif_status ON public.conflicts(verification_status);
        CREATE INDEX IF NOT EXISTS idx_conflicts_assigned ON public.conflicts(assigned_reviewer_id);
        CREATE INDEX IF NOT EXISTS idx_conflicts_verif_queue ON public.conflicts(verification_status, severity, created_at DESC);
    """)

    # 2. Ensure public.verification_records exists with complete governance fields
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.verification_records (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            conflict_id UUID REFERENCES public.conflicts(id) ON DELETE SET NULL,
            entity_type VARCHAR(50) NOT NULL,
            entity_id UUID NOT NULL,
            officer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
            action VARCHAR(50) NOT NULL,
            decision VARCHAR(30),
            justification TEXT NOT NULL,
            previous_status VARCHAR(30) NOT NULL,
            new_status VARCHAR(30) NOT NULL,
            evidence_references JSONB DEFAULT '[]'::jsonb,
            confidence_at_review NUMERIC(4, 3),
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- If table already existed, ensure new columns are present
        ALTER TABLE public.verification_records
        ADD COLUMN IF NOT EXISTS decision VARCHAR(30),
        ADD COLUMN IF NOT EXISTS evidence_references JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS confidence_at_review NUMERIC(4, 3),
        ADD COLUMN IF NOT EXISTS notes TEXT;

        CREATE INDEX IF NOT EXISTS idx_verification_conflict ON public.verification_records(conflict_id);
        CREATE INDEX IF NOT EXISTS idx_verification_entity ON public.verification_records(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_verification_officer ON public.verification_records(officer_id);
        CREATE INDEX IF NOT EXISTS idx_verification_created ON public.verification_records(created_at DESC);
    """)

    # 3. Ensure public.audit_logs table exists with cryptographic SHA-256 chaining
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.audit_logs (
            id BIGSERIAL PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            entity_id UUID NOT NULL,
            previous_state JSONB,
            new_state JSONB,
            ip_address VARCHAR(50),
            prev_hash VARCHAR(64) NOT NULL,
            current_hash VARCHAR(64) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_audit_hashes ON public.audit_logs(prev_hash, current_hash);
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE public.conflicts
        DROP COLUMN IF EXISTS verification_status,
        DROP COLUMN IF EXISTS assigned_reviewer_id,
        DROP COLUMN IF EXISTS reviewed_at,
        DROP COLUMN IF EXISTS reviewed_by;

        DROP TABLE IF EXISTS public.verification_records CASCADE;
        DROP TABLE IF EXISTS public.audit_logs CASCADE;
    """)
