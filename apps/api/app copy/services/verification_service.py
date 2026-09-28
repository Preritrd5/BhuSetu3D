"""
BhuSetu 3D Human Verification Workflow Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 11: Human Verification Workflow + Audit Trail

Orchestrates review queues, statutory officer assignments, explainable verification
decisions, confidence snapshots, and cryptographically chained audit logging.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func, and_, or_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.provenance import Conflict, VerificationRecord, Evidence, AuditLog
from app.models.user import User
from app.schemas.verification import (
    VerificationStatus,
    VerificationDecision,
    VerificationAction,
    VerificationDecisionRequest,
    AssignReviewerRequest,
    ReopenReviewRequest,
    VerificationQueueItem,
    VerificationQueueResponse,
    VerificationQueueSummary,
    VerificationDetailResponse,
    VerificationRecordItem,
    ReviewerInfo,
    AuditLogItem,
)
from app.services.audit_service import AuditService

# Definitive statutory state transition rules
VALID_TRANSITIONS: Dict[str, List[str]] = {
    VerificationStatus.UNREVIEWED.value: [
        VerificationStatus.IN_REVIEW.value,
    ],
    VerificationStatus.IN_REVIEW.value: [
        VerificationStatus.VERIFIED.value,
        VerificationStatus.REJECTED.value,
        VerificationStatus.NEEDS_MORE_EVIDENCE.value,
        VerificationStatus.ESCALATED.value,
    ],
    VerificationStatus.NEEDS_MORE_EVIDENCE.value: [
        VerificationStatus.IN_REVIEW.value,
        VerificationStatus.ESCALATED.value,
    ],
    VerificationStatus.ESCALATED.value: [
        VerificationStatus.IN_REVIEW.value,
        VerificationStatus.VERIFIED.value,
        VerificationStatus.REJECTED.value,
    ],
    VerificationStatus.VERIFIED.value: [
        VerificationStatus.IN_REVIEW.value,  # Reopened with mandatory justification
    ],
    VerificationStatus.REJECTED.value: [
        VerificationStatus.IN_REVIEW.value,  # Reopened with mandatory justification
    ],
}

DECISION_TO_STATUS: Dict[VerificationDecision, VerificationStatus] = {
    VerificationDecision.CONFIRMED: VerificationStatus.VERIFIED,
    VerificationDecision.NOT_CONFIRMED: VerificationStatus.REJECTED,
    VerificationDecision.INSUFFICIENT_EVIDENCE: VerificationStatus.NEEDS_MORE_EVIDENCE,
    VerificationDecision.ESCALATE: VerificationStatus.ESCALATED,
}


class VerificationService:
    @staticmethod
    def validate_transition(current_status: str, target_status: str) -> None:
        """
        Enforces statutory state machine rules.
        Raises HTTP 400 Bad Request if transition is prohibited.
        """
        allowed = VALID_TRANSITIONS.get(current_status, [])
        if target_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Illegal verification state transition: Cannot transition from '{current_status}' to '{target_status}'. Allowed transitions: {allowed}",
            )

    @staticmethod
    async def get_queue_summary(db: AsyncSession) -> VerificationQueueSummary:
        """
        Aggregates verification queue counts across statuses and severities.
        """
        # Count by verification_status
        status_stmt = select(
            Conflict.verification_status,
            func.count(Conflict.id)
        ).group_by(Conflict.verification_status)
        status_res = await db.execute(status_stmt)
        status_counts = dict(status_res.all())

        # Count by severity
        sev_stmt = select(
            Conflict.severity,
            func.count(Conflict.id)
        ).group_by(Conflict.severity)
        sev_res = await db.execute(sev_stmt)
        severity_counts = {str(sev): count for sev, count in sev_res.all()}

        total = sum(status_counts.values())

        return VerificationQueueSummary(
            total=total,
            unreviewed=status_counts.get(VerificationStatus.UNREVIEWED.value, 0),
            in_review=status_counts.get(VerificationStatus.IN_REVIEW.value, 0),
            verified=status_counts.get(VerificationStatus.VERIFIED.value, 0),
            rejected=status_counts.get(VerificationStatus.REJECTED.value, 0),
            needs_more_evidence=status_counts.get(VerificationStatus.NEEDS_MORE_EVIDENCE.value, 0),
            escalated=status_counts.get(VerificationStatus.ESCALATED.value, 0),
            by_severity=severity_counts,
        )

    @staticmethod
    async def get_review_queue(
        db: AsyncSession,
        status_filter: Optional[List[str]] = None,
        severity_filter: Optional[str] = None,
        conflict_type: Optional[str] = None,
        assigned_reviewer_id: Optional[UUID] = None,
        unassigned_only: bool = False,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> VerificationQueueResponse:
        """
        Retrieves paginated verification queue with filtering, reviewer information,
        and evidence metadata.
        """
        conditions = []

        if status_filter:
            conditions.append(Conflict.verification_status.in_(status_filter))

        if severity_filter:
            conditions.append(Conflict.severity == severity_filter)

        if conflict_type:
            conditions.append(Conflict.conflict_type.ilike(f"%{conflict_type}%"))

        if unassigned_only:
            conditions.append(Conflict.assigned_reviewer_id.is_(None))
        elif assigned_reviewer_id:
            conditions.append(Conflict.assigned_reviewer_id == assigned_reviewer_id)

        if search:
            search_pattern = f"%{search}%"
            conditions.append(
                or_(
                    Conflict.rule_name.ilike(search_pattern),
                    Conflict.explanation.ilike(search_pattern),
                    Conflict.conflict_type.ilike(search_pattern),
                )
            )

        # Total query
        count_stmt = select(func.count(Conflict.id))
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
        total_res = await db.execute(count_stmt)
        total = total_res.scalar_one()

        # Data query with assigned reviewer relationship loaded
        data_stmt = (
            select(Conflict)
            .options(selectinload(Conflict.assigned_reviewer))
            .order_by(
                # Order by status priority: IN_REVIEW, UNREVIEWED, ESCALATED, NEEDS_MORE_EVIDENCE, VERIFIED, REJECTED
                desc(Conflict.created_at)
            )
        )
        if conditions:
            data_stmt = data_stmt.where(and_(*conditions))

        skip = (page - 1) * page_size
        data_stmt = data_stmt.offset(skip).limit(page_size)

        res = await db.execute(data_stmt)
        conflicts = list(res.scalars().all())

        items = []
        for c in conflicts:
            reviewer_info = None
            if c.assigned_reviewer:
                reviewer_info = ReviewerInfo(
                    id=c.assigned_reviewer.id,
                    full_name=c.assigned_reviewer.full_name,
                    email=c.assigned_reviewer.email,
                    role=c.assigned_reviewer.role,
                    department=c.assigned_reviewer.department,
                )

            items.append(
                VerificationQueueItem(
                    id=c.id,
                    conflict_type=c.conflict_type,
                    severity=c.severity,
                    verification_status=c.verification_status,
                    rule_id=c.rule_id,
                    rule_name=c.rule_name,
                    entity_type=c.entity_type,
                    entity_id=c.entity_id,
                    related_entity_type=c.related_entity_type,
                    related_entity_id=c.related_entity_id,
                    parcel_id=c.parcel_id,
                    building_id=c.building_id,
                    unit_id=c.unit_id,
                    measured_value=float(c.measured_value) if c.measured_value is not None else None,
                    threshold_value=float(c.threshold_value) if c.threshold_value is not None else None,
                    measured_unit=c.measured_unit or "m²",
                    confidence_score=float(c.confidence_score) if c.confidence_score is not None else 0.900,
                    explanation=c.explanation,
                    assigned_reviewer=reviewer_info,
                    reviewed_at=c.reviewed_at,
                    reviewed_by=c.reviewed_by,
                    created_at=c.created_at,
                    updated_at=c.updated_at,
                    evidence_count=1 if c.evidence_reference else 0,
                    verification_history_count=0,
                )
            )

        summary = await VerificationService.get_queue_summary(db)

        return VerificationQueueResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            summary=summary,
        )

    @staticmethod
    async def get_verification_detail(
        db: AsyncSession,
        conflict_id: UUID,
    ) -> VerificationDetailResponse:
        """
        Loads full verification details for a finding, including its statutory decision history,
        associated Phase 8 evidence items, and explainable spatial breakdown.
        """
        stmt = (
            select(Conflict)
            .options(selectinload(Conflict.assigned_reviewer))
            .where(Conflict.id == conflict_id)
        )
        res = await db.execute(stmt)
        c = res.scalar_one_or_none()
        if not c:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conflict finding with ID '{conflict_id}' not found.",
            )

        # Load verification record history
        v_stmt = (
            select(VerificationRecord)
            .options(selectinload(VerificationRecord.officer))
            .where(VerificationRecord.conflict_id == conflict_id)
            .order_by(asc(VerificationRecord.created_at))
        )
        v_res = await db.execute(v_stmt)
        records = list(v_res.scalars().all())

        history = [
            VerificationRecordItem(
                id=rec.id,
                conflict_id=rec.conflict_id,
                entity_type=rec.entity_type,
                entity_id=rec.entity_id,
                officer_id=rec.officer_id,
                officer_name=rec.officer.full_name if rec.officer else "Authorized Officer",
                action=rec.action,
                decision=rec.decision,
                justification=rec.justification,
                previous_status=rec.previous_status,
                new_status=rec.new_status,
                evidence_references=rec.evidence_references or [],
                confidence_at_review=float(rec.confidence_at_review) if rec.confidence_at_review is not None else None,
                notes=rec.notes,
                created_at=rec.created_at,
            )
            for rec in records
        ]

        # Load associated evidence items from public.evidence
        evidence_items = []
        entity_ids = [c.entity_id] if c.entity_id else []
        if c.parcel_id and c.parcel_id not in entity_ids:
            entity_ids.append(c.parcel_id)
        if c.building_id and c.building_id not in entity_ids:
            entity_ids.append(c.building_id)

        if entity_ids:
            e_stmt = select(Evidence).where(Evidence.entity_id.in_(entity_ids))
            e_res = await db.execute(e_stmt)
            for ev in e_res.scalars().all():
                evidence_items.append({
                    "id": str(ev.id),
                    "entity_type": ev.entity_type,
                    "entity_id": str(ev.entity_id),
                    "source_type": ev.source_type,
                    "source_classification": ev.source_classification,
                    "confidence_score": float(ev.confidence_score) if ev.confidence_score else 0.85,
                    "status": ev.status,
                    "supporting_factors": ev.supporting_factors or [],
                    "limiting_factors": ev.limiting_factors or [],
                    "created_at": ev.created_at.isoformat() if ev.created_at else None,
                })

        reviewer_info = None
        if c.assigned_reviewer:
            reviewer_info = ReviewerInfo(
                id=c.assigned_reviewer.id,
                full_name=c.assigned_reviewer.full_name,
                email=c.assigned_reviewer.email,
                role=c.assigned_reviewer.role,
                department=c.assigned_reviewer.department,
            )

        item = VerificationQueueItem(
            id=c.id,
            conflict_type=c.conflict_type,
            severity=c.severity,
            verification_status=c.verification_status,
            rule_id=c.rule_id,
            rule_name=c.rule_name,
            entity_type=c.entity_type,
            entity_id=c.entity_id,
            related_entity_type=c.related_entity_type,
            related_entity_id=c.related_entity_id,
            parcel_id=c.parcel_id,
            building_id=c.building_id,
            unit_id=c.unit_id,
            measured_value=float(c.measured_value) if c.measured_value is not None else None,
            threshold_value=float(c.threshold_value) if c.threshold_value is not None else None,
            measured_unit=c.measured_unit or "m²",
            confidence_score=float(c.confidence_score) if c.confidence_score is not None else 0.900,
            explanation=c.explanation,
            assigned_reviewer=reviewer_info,
            reviewed_at=c.reviewed_at,
            reviewed_by=c.reviewed_by,
            created_at=c.created_at,
            updated_at=c.updated_at,
            evidence_count=len(evidence_items),
            verification_history_count=len(history),
        )

        return VerificationDetailResponse(
            item=item,
            history=history,
            associated_evidence=evidence_items,
            ai_explanation=c.explanation,
        )

    @staticmethod
    async def assign_reviewer(
        db: AsyncSession,
        conflict_id: UUID,
        req: AssignReviewerRequest,
        officer_id: UUID,
        ip_address: Optional[str] = None,
    ) -> VerificationDetailResponse:
        """
        Assigns an authorized reviewer to a finding. Transitions UNREVIEWED -> IN_REVIEW.
        Emits immutable VerificationRecord and AuditLog entries.
        """
        # Verify reviewer exists
        u_stmt = select(User).where(User.id == req.reviewer_id)
        u_res = await db.execute(u_stmt)
        reviewer = u_res.scalar_one_or_none()
        if not reviewer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Reviewer user with ID '{req.reviewer_id}' not found.",
            )

        # Fetch conflict
        c_stmt = select(Conflict).where(Conflict.id == conflict_id)
        c_res = await db.execute(c_stmt)
        conflict = c_res.scalar_one_or_none()
        if not conflict:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conflict finding with ID '{conflict_id}' not found.",
            )

        prev_status = conflict.verification_status
        prev_reviewer_id = str(conflict.assigned_reviewer_id) if conflict.assigned_reviewer_id else None

        # Transition status if UNREVIEWED
        new_status = prev_status
        if prev_status == VerificationStatus.UNREVIEWED.value:
            new_status = VerificationStatus.IN_REVIEW.value
            conflict.verification_status = new_status

        conflict.assigned_reviewer_id = req.reviewer_id
        conflict.updated_at = datetime.now(timezone.utc)

        # Create VerificationRecord
        justification_text = f"Assigned to reviewer {reviewer.full_name} ({reviewer.email}). {req.notes or ''}".strip()
        v_rec = VerificationRecord(
            conflict_id=conflict.id,
            entity_type=conflict.entity_type,
            entity_id=conflict.entity_id or conflict.id,
            officer_id=officer_id,
            action=VerificationAction.ASSIGN.value,
            decision=None,
            justification=justification_text,
            previous_status=prev_status,
            new_status=new_status,
            evidence_references=[],
            confidence_at_review=conflict.confidence_score,
            notes=req.notes,
        )
        db.add(v_rec)

        # Record audit log
        await AuditService.record_event(
            db=db,
            action="VERIFICATION_ASSIGN_REVIEWER",
            entity_type="CONFLICT",
            entity_id=conflict.id,
            previous_state={
                "verification_status": prev_status,
                "assigned_reviewer_id": prev_reviewer_id,
            },
            new_state={
                "verification_status": new_status,
                "assigned_reviewer_id": str(req.reviewer_id),
                "assigned_reviewer_name": reviewer.full_name,
                "notes": req.notes,
            },
            user_id=officer_id,
            ip_address=ip_address,
        )

        await db.commit()
        return await VerificationService.get_verification_detail(db, conflict_id)

    @staticmethod
    async def start_review(
        db: AsyncSession,
        conflict_id: UUID,
        officer_id: UUID,
        notes: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> VerificationDetailResponse:
        """
        Marks a finding as actively under human review (IN_REVIEW).
        """
        c_stmt = select(Conflict).where(Conflict.id == conflict_id)
        c_res = await db.execute(c_stmt)
        conflict = c_res.scalar_one_or_none()
        if not conflict:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conflict finding with ID '{conflict_id}' not found.",
            )

        prev_status = conflict.verification_status
        if prev_status not in [VerificationStatus.UNREVIEWED.value, VerificationStatus.NEEDS_MORE_EVIDENCE.value]:
            # Already in review or completed
            return await VerificationService.get_verification_detail(db, conflict_id)

        target_status = VerificationStatus.IN_REVIEW.value
        VerificationService.validate_transition(prev_status, target_status)

        conflict.verification_status = target_status
        if not conflict.assigned_reviewer_id:
            conflict.assigned_reviewer_id = officer_id
        conflict.updated_at = datetime.now(timezone.utc)

        v_rec = VerificationRecord(
            conflict_id=conflict.id,
            entity_type=conflict.entity_type,
            entity_id=conflict.entity_id or conflict.id,
            officer_id=officer_id,
            action=VerificationAction.START_REVIEW.value,
            decision=None,
            justification=notes or "Officer initiated formal spatial review.",
            previous_status=prev_status,
            new_status=target_status,
            evidence_references=[],
            confidence_at_review=conflict.confidence_score,
            notes=notes,
        )
        db.add(v_rec)

        await AuditService.record_event(
            db=db,
            action="VERIFICATION_START_REVIEW",
            entity_type="CONFLICT",
            entity_id=conflict.id,
            previous_state={"verification_status": prev_status},
            new_state={
                "verification_status": target_status,
                "reviewer_id": str(officer_id),
                "notes": notes,
            },
            user_id=officer_id,
            ip_address=ip_address,
        )

        await db.commit()
        return await VerificationService.get_verification_detail(db, conflict_id)

    @staticmethod
    async def submit_decision(
        db: AsyncSession,
        conflict_id: UUID,
        req: VerificationDecisionRequest,
        officer_id: UUID,
        ip_address: Optional[str] = None,
    ) -> VerificationDetailResponse:
        """
        Executes an atomic human verification decision (CONFIRMED, NOT_CONFIRMED,
        INSUFFICIENT_EVIDENCE, ESCALATE).
        Snapshots confidence, references inspected evidence, updates finding status,
        and creates cryptographically chained audit log.
        """
        c_stmt = select(Conflict).where(Conflict.id == conflict_id)
        c_res = await db.execute(c_stmt)
        conflict = c_res.scalar_one_or_none()
        if not conflict:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conflict finding with ID '{conflict_id}' not found.",
            )

        # Optimistic concurrency check
        if req.expected_previous_status and conflict.verification_status != req.expected_previous_status:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Conflict state has changed since last viewed. Expected status '{req.expected_previous_status}', but current status is '{conflict.verification_status}'. Please refresh.",
            )

        prev_status = conflict.verification_status
        target_status_enum = DECISION_TO_STATUS[req.decision]
        target_status = target_status_enum.value

        # Validate state machine transition
        VerificationService.validate_transition(prev_status, target_status)

        now = datetime.now(timezone.utc)
        evidence_ref_strs = [str(e_id) for e_id in req.evidence_references]

        # Update conflict finding
        conflict.verification_status = target_status
        conflict.reviewed_at = now
        conflict.reviewed_by = officer_id
        conflict.updated_at = now

        # If rejected/not confirmed, the conflict status is marked RESOLVED, but never deleted
        if target_status == VerificationStatus.REJECTED.value:
            conflict.status = "RESOLVED"
        elif target_status == VerificationStatus.VERIFIED.value:
            conflict.status = "CONFIRMED"

        # Create VerificationRecord
        v_rec = VerificationRecord(
            conflict_id=conflict.id,
            entity_type=conflict.entity_type,
            entity_id=conflict.entity_id or conflict.id,
            officer_id=officer_id,
            action=VerificationAction.SUBMIT_DECISION.value,
            decision=req.decision.value,
            justification=req.justification,
            previous_status=prev_status,
            new_status=target_status,
            evidence_references=evidence_ref_strs,
            confidence_at_review=conflict.confidence_score,
            notes=req.notes,
            created_at=now,
        )
        db.add(v_rec)

        # Record audit log
        await AuditService.record_event(
            db=db,
            action=f"VERIFICATION_DECISION_{req.decision.value}",
            entity_type="CONFLICT",
            entity_id=conflict.id,
            previous_state={
                "verification_status": prev_status,
                "conflict_status": conflict.status,
            },
            new_state={
                "verification_status": target_status,
                "decision": req.decision.value,
                "justification": req.justification,
                "evidence_references": evidence_ref_strs,
                "confidence_at_review": float(conflict.confidence_score) if conflict.confidence_score else 0.9,
                "notes": req.notes,
            },
            user_id=officer_id,
            ip_address=ip_address,
        )

        await db.commit()
        return await VerificationService.get_verification_detail(db, conflict_id)

    @staticmethod
    async def reopen_review(
        db: AsyncSession,
        conflict_id: UUID,
        req: ReopenReviewRequest,
        officer_id: UUID,
        ip_address: Optional[str] = None,
    ) -> VerificationDetailResponse:
        """
        Reopens a completed verification review (from VERIFIED or REJECTED back to IN_REVIEW)
        with mandatory statutory justification.
        """
        c_stmt = select(Conflict).where(Conflict.id == conflict_id)
        c_res = await db.execute(c_stmt)
        conflict = c_res.scalar_one_or_none()
        if not conflict:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conflict finding with ID '{conflict_id}' not found.",
            )

        prev_status = conflict.verification_status
        if prev_status not in [VerificationStatus.VERIFIED.value, VerificationStatus.REJECTED.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only completed reviews (VERIFIED or REJECTED) can be reopened. Current status: '{prev_status}'.",
            )

        target_status = VerificationStatus.IN_REVIEW.value
        VerificationService.validate_transition(prev_status, target_status)

        now = datetime.now(timezone.utc)
        conflict.verification_status = target_status
        conflict.assigned_reviewer_id = officer_id
        conflict.reviewed_at = None
        conflict.reviewed_by = None
        conflict.updated_at = now
        conflict.status = "OPEN"

        v_rec = VerificationRecord(
            conflict_id=conflict.id,
            entity_type=conflict.entity_type,
            entity_id=conflict.entity_id or conflict.id,
            officer_id=officer_id,
            action=VerificationAction.REOPEN.value,
            decision=None,
            justification=req.justification,
            previous_status=prev_status,
            new_status=target_status,
            evidence_references=[],
            confidence_at_review=conflict.confidence_score,
            notes=req.notes,
            created_at=now,
        )
        db.add(v_rec)

        await AuditService.record_event(
            db=db,
            action="VERIFICATION_REOPEN",
            entity_type="CONFLICT",
            entity_id=conflict.id,
            previous_state={"verification_status": prev_status},
            new_state={
                "verification_status": target_status,
                "reopened_by": str(officer_id),
                "justification": req.justification,
                "notes": req.notes,
            },
            user_id=officer_id,
            ip_address=ip_address,
        )

        await db.commit()
        return await VerificationService.get_verification_detail(db, conflict_id)

    @staticmethod
    async def get_entity_audit_trail(
        db: AsyncSession,
        entity_id: UUID,
        entity_type: str = "CONFLICT",
    ) -> List[AuditLogItem]:
        """
        Retrieves ordered immutable audit events for a given entity.
        """
        stmt = (
            select(AuditLog)
            .where(
                and_(
                    AuditLog.entity_id == entity_id,
                    AuditLog.entity_type == entity_type,
                )
            )
            .order_by(asc(AuditLog.id))
        )
        res = await db.execute(stmt)
        records = list(res.scalars().all())

        return [
            AuditLogItem(
                id=rec.id,
                user_id=rec.user_id,
                action=rec.action,
                entity_type=rec.entity_type,
                entity_id=rec.entity_id,
                previous_state=rec.previous_state,
                new_state=rec.new_state,
                ip_address=rec.ip_address,
                prev_hash=rec.prev_hash,
                current_hash=rec.current_hash,
                created_at=rec.created_at,
            )
            for rec in records
        ]
