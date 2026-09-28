"""Initial PostGIS and UUID Extensions Foundation

Revision ID: 0001_initial_postgis_foundation
Revises: 
Create Date: 2026-09-23 09:30:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial_postgis_foundation'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable PostGIS spatial extension and UUID generation in PostgreSQL
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    op.execute('CREATE EXTENSION IF NOT EXISTS postgis;')


def downgrade() -> None:
    # Safe downgrade logic
    pass
