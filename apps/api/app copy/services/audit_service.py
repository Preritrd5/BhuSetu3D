"""
BhuSetu 3D Cryptographic Audit Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 11: Human Verification Workflow + Audit Trail

Implements append-only, SHA-256 cryptographically chained audit logging for all
spatial data modifications, reviewer assignments, and statutory verification decisions.
"""
import hashlib
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from uuid import UUID

from sqlalchemy import select, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.provenance import AuditLog

GENESIS_HASH = "0" * 64


def canonical_json(data: Optional[Dict[str, Any]]) -> str:
    """
    Produces deterministic, sort-keyed, compact JSON representation
    to ensure cryptographically repeatable hash generation across platforms.
    """
    if data is None:
        return ""
    # Convert UUIDs and datetimes to standard ISO strings
    def default_serializer(o):
        if isinstance(o, (datetime,)):
            return o.isoformat()
        if isinstance(o, UUID):
            return str(o)
        return str(o)

    return json.dumps(data, sort_keys=True, separators=(",", ":"), default=default_serializer)


def compute_audit_hash(
    prev_hash: str,
    user_id: Optional[UUID],
    action: str,
    entity_type: str,
    entity_id: UUID,
    previous_state: Optional[Dict[str, Any]],
    new_state: Optional[Dict[str, Any]],
    created_at: datetime,
) -> str:
    """
    Computes deterministic SHA-256 hash chaining:
    SHA-256(prev_hash | user_id | action | entity_type | entity_id | canonical(prev) | canonical(new) | iso_timestamp)
    """
    actor_str = str(user_id) if user_id else "SYSTEM"
    entity_id_str = str(entity_id)
    prev_json_str = canonical_json(previous_state)
    new_json_str = canonical_json(new_state)
    ts_str = created_at.isoformat()

    payload = f"{prev_hash}|{actor_str}|{action}|{entity_type}|{entity_id_str}|{prev_json_str}|{new_json_str}|{ts_str}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


class AuditService:
    @staticmethod
    async def get_latest_hash(db: AsyncSession) -> str:
        """
        Retrieves current head hash of the audit chain.
        Returns GENESIS_HASH if no audit logs exist.
        """
        stmt = select(AuditLog.current_hash).order_by(desc(AuditLog.id)).limit(1)
        res = await db.execute(stmt)
        latest_hash = res.scalar_one_or_none()
        return latest_hash if latest_hash else GENESIS_HASH

    @staticmethod
    async def record_event(
        db: AsyncSession,
        action: str,
        entity_type: str,
        entity_id: UUID,
        previous_state: Optional[Dict[str, Any]] = None,
        new_state: Optional[Dict[str, Any]] = None,
        user_id: Optional[UUID] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """
        Appends an immutable, cryptographically chained audit record.
        Must be executed within an active database transaction.
        """
        prev_hash = await AuditService.get_latest_hash(db)
        now = datetime.now(timezone.utc)
        current_hash = compute_audit_hash(
            prev_hash=prev_hash,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            previous_state=previous_state,
            new_state=new_state,
            created_at=now,
        )

        log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            previous_state=previous_state,
            new_state=new_state,
            ip_address=ip_address,
            prev_hash=prev_hash,
            current_hash=current_hash,
            created_at=now,
        )
        db.add(log)
        await db.flush()
        return log

    @staticmethod
    async def verify_chain(
        db: AsyncSession,
        entity_type: Optional[str] = None,
        entity_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """
        Verifies the cryptographic integrity of the entire audit chain.
        Validates hash continuity (prev_hash == previous log's current_hash)
        and independently recomputes every record's SHA-256 payload.
        """
        stmt = select(AuditLog).order_by(asc(AuditLog.id))
        if entity_type and entity_id:
            # Note: global chain verification checks global sequence,
            # but if filtering by entity, chain continuity applies if all records are evaluated
            pass

        res = await db.execute(stmt)
        records = list(res.scalars().all())

        if not records:
            return {
                "is_valid": True,
                "event_count": 0,
                "broken_log_id": None,
                "verified_at": datetime.now(timezone.utc),
                "genesis_hash": GENESIS_HASH,
                "latest_hash": None,
                "message": "Audit chain is empty. Genesis state intact.",
            }

        expected_prev_hash = GENESIS_HASH

        for idx, rec in enumerate(records):
            # Check link to previous
            if rec.prev_hash != expected_prev_hash:
                return {
                    "is_valid": False,
                    "event_count": len(records),
                    "broken_log_id": rec.id,
                    "verified_at": datetime.now(timezone.utc),
                    "genesis_hash": GENESIS_HASH,
                    "latest_hash": rec.current_hash,
                    "message": f"Hash continuity broken at log #{rec.id}. Expected prev_hash {expected_prev_hash}, got {rec.prev_hash}",
                }

            # Recompute hash
            recomputed = compute_audit_hash(
                prev_hash=rec.prev_hash,
                user_id=rec.user_id,
                action=rec.action,
                entity_type=rec.entity_type,
                entity_id=rec.entity_id,
                previous_state=rec.previous_state,
                new_state=rec.new_state,
                created_at=rec.created_at,
            )

            if recomputed != rec.current_hash:
                return {
                    "is_valid": False,
                    "event_count": len(records),
                    "broken_log_id": rec.id,
                    "verified_at": datetime.now(timezone.utc),
                    "genesis_hash": GENESIS_HASH,
                    "latest_hash": rec.current_hash,
                    "message": f"Cryptographic tamper detected at log #{rec.id}! Stored hash does not match canonical recomputed hash.",
                }

            expected_prev_hash = rec.current_hash

        return {
            "is_valid": True,
            "event_count": len(records),
            "broken_log_id": None,
            "verified_at": datetime.now(timezone.utc),
            "genesis_hash": GENESIS_HASH,
            "latest_hash": records[-1].current_hash,
            "message": f"Audit chain verified successfully! All {len(records)} events cryptographically intact.",
        }
