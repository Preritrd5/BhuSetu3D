"""User Authentication Identity Mapping for Supabase Auth

Revision ID: 0002_user_auth_mapping
Revises: 0001_initial_postgis_foundation
Create Date: 2026-09-23 10:15:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = '0002_user_auth_mapping'
down_revision: Union[str, None] = '0001_initial_postgis_foundation'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safely ensure auth_user_id exists on public.users to link Supabase Auth identities (sub claim)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'users'
            ) THEN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_user_id'
                ) THEN
                    ALTER TABLE public.users ADD COLUMN auth_user_id UUID UNIQUE;
                    CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_user_id);
                END IF;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_user_id'
            ) THEN
                DROP INDEX IF EXISTS idx_users_auth_id;
                ALTER TABLE public.users DROP COLUMN auth_user_id;
            END IF;
        END $$;
    """)
