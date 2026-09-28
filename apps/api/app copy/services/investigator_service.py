"""
BhuSetu 3D AI Spatial Investigator Coordinator Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 10: Natural-Language Spatial Query + AI Spatial Investigator
"""
import time
import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.investigation import SpatialInvestigation
from app.schemas.spatial_investigator import (
    InvestigationRequest,
    InvestigationResponse,
    InvestigationExplanation,
    InvestigationResultItem,
    SuggestedQuestion,
    SpatialIntent,
    SpatialIntentType,
)
from app.services.spatial_intent_validator import SpatialIntentValidator
from app.services.gemini_spatial_client import GeminiSpatialClient
from app.services.spatial_query_planner import SpatialQueryPlanner
from app.services.spatial_grounder import SpatialResultGrounder
from app.services.spatial_explainer import (
    SpatialExplainer,
    GOVERNANCE_NOTICE,
    LIMITATIONS_NOTICE,
)
from app.core.logging import logger


SUGGESTED_QUESTIONS = [
    SuggestedQuestion(
        id="q1",
        category="Boundary Discrepancies",
        question="Show buildings that extend outside their parcels.",
        description="Identifies structures with footprint encroachment beyond registered cadastral polygons.",
        requires_property_context=False,
    ),
    SuggestedQuestion(
        id="q2",
        category="Infrastructure Clearance",
        question="Which properties are within 10 meters of a road?",
        description="Scans transportation corridors for setback and buffer zone clearances.",
        requires_property_context=False,
    ),
    SuggestedQuestion(
        id="q3",
        category="Cadastral Overlaps",
        question="Show parcels overlapping each other.",
        description="Identifies boundary polygon collisions between adjoining land titles.",
        requires_property_context=False,
    ),
    SuggestedQuestion(
        id="q4",
        category="Conflict Investigation",
        question="Why was this property flagged?",
        description="Explains geometric findings, rules, and measured deviations for the selected property.",
        requires_property_context=True,
    ),
    SuggestedQuestion(
        id="q5",
        category="Evidence & Provenance",
        question="What evidence supports this building?",
        description="Retrieves drone imagery, LiDAR point clouds, and ML extraction lineage.",
        requires_property_context=True,
    ),
    SuggestedQuestion(
        id="q6",
        category="Infrastructure Clearance",
        question="Show properties near power lines.",
        description="Evaluates clearances against high-tension transmission corridors.",
        requires_property_context=False,
    ),
]


class SpatialInvestigatorService:
    """
    Coordinates the full Natural Language Spatial Investigation lifecycle:
    Intent -> Validation -> Planning -> PostGIS Execution -> Grounding -> Explanation -> Observability.
    """

    @classmethod
    async def investigate(
        cls,
        session: AsyncSession,
        request: InvestigationRequest,
        user_id: Optional[uuid.UUID] = None
    ) -> InvestigationResponse:
        """
        Executes an end-to-end safe spatial investigation.
        """
        start_time = time.time()
        request_id = f"inv_{uuid.uuid4().hex[:12]}"
        client = GeminiSpatialClient()

        # 1. Pre-flight query string validation (defense against injection / mutation keywords)
        preflight_error = SpatialIntentValidator.validate_user_query(request.question)
        if preflight_error:
            duration_ms = int((time.time() - start_time) * 1000)
            unsupported_intent = SpatialIntent(
                intent=SpatialIntentType.UNSUPPORTED,
                unsupported_reason=preflight_error
            )
            return InvestigationResponse(
                request_id=request_id,
                question=request.question,
                interpreted_intent=unsupported_intent,
                status="UNSUPPORTED",
                results_count=0,
                results=[],
                explanation=InvestigationExplanation(
                    summary=preflight_error,
                    why_flagged=None,
                    evidence_context=None,
                    provenance_context=None,
                    confidence_explanation="Security validation gate triggered.",
                    limitations_notice=LIMITATIONS_NOTICE,
                    governance_notice=GOVERNANCE_NOTICE,
                ),
                map_directive=None,
                execution_trace={
                    "stage": "preflight_validation_failed",
                    "duration_ms": duration_ms,
                    "model": client.model,
                }
            )

        # 2. Extract structured intent via Gemini LLM or deterministic fallback
        intent: Optional[SpatialIntent] = None
        used_llm = False

        if client.is_configured:
            intent = await client.parse_intent_llm(
                request.question,
                request.context_entity_type,
                request.context_entity_id
            )
            if intent:
                used_llm = True

        if not intent:
            intent = GeminiSpatialClient.parse_intent_deterministic(
                request.question,
                request.context_entity_type,
                request.context_entity_id
            )

        # 3. Strict schema and metric boundary validation
        is_valid, sanitized_intent, validation_msg = SpatialIntentValidator.validate_and_sanitize(intent)

        # Handle clarification needed
        if sanitized_intent.clarification_needed:
            duration_ms = int((time.time() - start_time) * 1000)
            return InvestigationResponse(
                request_id=request_id,
                question=request.question,
                interpreted_intent=sanitized_intent,
                status="CLARIFICATION_NEEDED",
                results_count=0,
                results=[],
                explanation=InvestigationExplanation(
                    summary=sanitized_intent.clarification_question or "Please clarify your spatial query.",
                    why_flagged=None,
                    evidence_context=None,
                    provenance_context=None,
                    confidence_explanation=None,
                    limitations_notice=LIMITATIONS_NOTICE,
                    governance_notice=GOVERNANCE_NOTICE,
                ),
                map_directive=None,
                execution_trace={
                    "stage": "clarification_requested",
                    "duration_ms": duration_ms,
                    "model": client.model if used_llm else "rule-based-parser",
                }
            )

        # Handle unsupported request
        if not is_valid:
            duration_ms = int((time.time() - start_time) * 1000)
            return InvestigationResponse(
                request_id=request_id,
                question=request.question,
                interpreted_intent=sanitized_intent,
                status="UNSUPPORTED",
                results_count=0,
                results=[],
                explanation=InvestigationExplanation(
                    summary=validation_msg or "The requested spatial operation is not supported.",
                    why_flagged=None,
                    evidence_context=None,
                    provenance_context=None,
                    confidence_explanation=None,
                    limitations_notice=LIMITATIONS_NOTICE,
                    governance_notice=GOVERNANCE_NOTICE,
                ),
                map_directive=None,
                execution_trace={
                    "stage": "validation_rejected",
                    "duration_ms": duration_ms,
                    "model": client.model if used_llm else "rule-based-parser",
                }
            )

        # 4. Plan and execute PostGIS tool deterministically
        tool_name, items = await SpatialQueryPlanner.plan_and_execute(session, sanitized_intent)

        # 5. Build Map Action Directive
        map_directive = SpatialResultGrounder.ground_and_build_map_directive(sanitized_intent, items)

        # 6. Generate explainable grounded response
        explanation = await SpatialExplainer.explain(request.question, sanitized_intent, items)

        duration_ms = int((time.time() - start_time) * 1000)
        status_str = "SUCCESS" if len(items) > 0 else "NO_RESULTS"

        trace = {
            "request_id": request_id,
            "tool_executed": tool_name,
            "intent": sanitized_intent.intent.value,
            "used_llm": used_llm,
            "model": client.model if used_llm else "rule-based-parser",
            "duration_ms": duration_ms,
            "results_count": len(items),
            "metric_crs": "EPSG:32643 UTM 43N",
            "database_platform": "Supabase PostgreSQL 16 + PostGIS 3.4",
        }

        # 7. Audit log persistence
        try:
            audit_entry = SpatialInvestigation(
                request_id=request_id,
                user_id=user_id,
                question=request.question,
                intent=sanitized_intent.intent.value,
                tool_executed=tool_name,
                model_used=client.model if used_llm else "rule-based-parser",
                status=status_str,
                duration_ms=duration_ms,
                result_count=len(items),
                execution_trace=trace,
            )
            session.add(audit_entry)
            await session.commit()
        except Exception as e:
            logger.error(f"Failed to record investigation audit log: {e}")
            await session.rollback()

        return InvestigationResponse(
            request_id=request_id,
            question=request.question,
            interpreted_intent=sanitized_intent,
            status=status_str,
            results_count=len(items),
            results=items,
            explanation=explanation,
            map_directive=map_directive,
            execution_trace=trace,
        )

    @classmethod
    def get_suggested_questions(cls) -> List[SuggestedQuestion]:
        """Returns standard curated suggested questions."""
        return SUGGESTED_QUESTIONS

    @classmethod
    async def get_history(cls, session: AsyncSession, limit: int = 15) -> List[Dict[str, Any]]:
        """Retrieves recent spatial investigations from the audit log."""
        q = select(SpatialInvestigation).order_by(desc(SpatialInvestigation.created_at)).limit(limit)
        res = await session.execute(q)
        records = res.scalars().all()
        return [
            {
                "id": str(r.id),
                "request_id": r.request_id,
                "question": r.question,
                "intent": r.intent,
                "tool_executed": r.tool_executed,
                "model_used": r.model_used,
                "status": r.status,
                "result_count": r.result_count,
                "duration_ms": r.duration_ms,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ]
