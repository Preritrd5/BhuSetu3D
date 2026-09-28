"""
BhuSetu 3D User Model
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 2: Authentication, Authorization & Application Shell
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class User(Base):
    """
    Authoritative public.users model stored in Supabase PostgreSQL.
    Maps 1-to-1 with Supabase Auth identities via auth_user_id / email.
    """
    __tablename__ = "users"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    auth_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        unique=True,
        nullable=True,
        index=True
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )
    role: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    department: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}', active={self.is_active})>"
