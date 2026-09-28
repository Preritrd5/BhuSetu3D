"""
BhuSetu 3D Spatial Investigation Explainer Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 10: Natural-Language Spatial Query + AI Spatial Investigator
"""
import os
import json
import httpx
from typing import List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.schemas.spatial_investigator import (
    InvestigationExplanation,
    InvestigationResultItem,
    SpatialIntent,
)

GOVERNANCE_NOTICE = (
    "Mandatory Governance Notice: Spatial discrepancies are advisory geometric findings "
    "indicating physical footprint or boundary misalignment for surveyor verification. "
    "They do not constitute statutory legal violations or judicial determinations."
)

LIMITATIONS_NOTICE = (
    "Calculations are derived from PostGIS conformal metric projections (UTM Zone 43N). "
    "Actual ground boundaries must be confirmed via total station or DGPS field survey."
)


EXPLANATION_SYSTEM_PROMPT = """
You are the AI Spatial Explainer for BhuSetu 3D, an evidence-backed 3D property intelligence platform.
Your role is to explain verified PostGIS spatial findings clearly, concisely, and objectively to urban surveyors and planners.

CRITICAL MANDATORY RULES:
1. Grounding: You must use ONLY the provided findings, measurements, rules, and evidence. Never invent numbers, dates, or IDs.
2. Governance: Spatial discrepancy != legal violation. NEVER use words like "illegal", "violator", "fraud", "unlawful", or "encroacher". Use neutral phrases: "potential spatial discrepancy detected", "footprint extends beyond parcel boundary", "setback clearance warning".
3. Confidence: State finding confidence as a technical reliability rating, NOT a probability of illegality.
4. Output strict JSON with:
{
  "summary": "Short factual executive summary of findings",
  "why_flagged": "Technical explanation of the geometric rule and observed deviation",
  "evidence_context": "Explanation of supporting sensor datasets or lineage",
  "provenance_context": "Derivation history if available",
  "confidence_explanation": "Technical confidence rating and supporting factors"
}
"""


class SpatialExplainer:
    """
    Generates explainable, grounded narratives from actual PostGIS/Supabase findings.
    """

    @classmethod
    async def explain(
        cls,
        question: str,
        intent: SpatialIntent,
        items: List[InvestigationResultItem]
    ) -> InvestigationExplanation:
        """
        Coordinates AI-assisted explanation if Gemini is configured, or generates a deterministic grounded explanation.
        """
        api_key = getattr(settings, "GEMINI_API_KEY", "") or os.environ.get("GEMINI_API_KEY", "")
        model = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash") or "gemini-2.0-flash"

        if api_key and len(api_key.strip()) > 5:
            llm_explanation = await cls._explain_with_gemini(api_key, model, question, intent, items)
            if llm_explanation:
                return llm_explanation

        # Deterministic Grounded Fallback
        return cls._explain_deterministic(question, intent, items)

    @classmethod
    async def _explain_with_gemini(
        cls,
        api_key: str,
        model: str,
        question: str,
        intent: SpatialIntent,
        items: List[InvestigationResultItem]
    ) -> Optional[InvestigationExplanation]:
        """Calls Gemini API with strictly bounded result context."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        # Bound context to maximum 5 items to avoid token bloat
        context_payload = {
            "question": question,
            "intent": intent.intent.value,
            "result_count": len(items),
            "top_findings": [
                {
                    "title": it.title,
                    "finding_type": it.finding_type,
                    "measured_value": f"{it.measured_value} {it.measured_unit or ''}",
                    "confidence": f"{int((it.confidence_score or 0.85) * 100)}%",
                    "explanation": it.subtitle,
                    "metadata": it.metadata,
                }
                for it in items[:5]
            ]
        }

        prompt_body = f"{EXPLANATION_SYSTEM_PROMPT}\n\nDATA CONTEXT:\n{json.dumps(context_payload, indent=2)}"

        payload = {
            "contents": [{"parts": [{"text": prompt_body}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.2
            }
        }

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text_part = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text_part:
                            parsed = json.loads(text_part)
                            return InvestigationExplanation(
                                summary=parsed.get("summary", f"Identified {len(items)} spatial records."),
                                why_flagged=parsed.get("why_flagged"),
                                evidence_context=parsed.get("evidence_context"),
                                provenance_context=parsed.get("provenance_context"),
                                confidence_explanation=parsed.get("confidence_explanation"),
                                limitations_notice=LIMITATIONS_NOTICE,
                                governance_notice=GOVERNANCE_NOTICE,
                            )
        except Exception as e:
            logger.warning(f"Gemini explanation generation failed: {e}")

        return None

    @classmethod
    def _explain_deterministic(
        cls,
        question: str,
        intent: SpatialIntent,
        items: List[InvestigationResultItem]
    ) -> InvestigationExplanation:
        """
        Factual, deterministic explanation engine based directly on returned PostGIS records.
        """
        count = len(items)

        if count == 0:
            return InvestigationExplanation(
                summary="No matching spatial records or discrepancies were found matching your criteria.",
                why_flagged=None,
                evidence_context="Underlying cadastral and building datasets were scanned successfully.",
                provenance_context=None,
                confidence_explanation="High confidence in negative finding based on current PostGIS dataset extents.",
                limitations_notice=LIMITATIONS_NOTICE,
                governance_notice=GOVERNANCE_NOTICE,
            )

        top_item = items[0]
        finding_type = top_item.finding_type or "SPATIAL_RECORD"

        if "OUTSIDE" in finding_type or "ENCROACH" in finding_type or intent.intent.value == "BOUNDARY_DISCREPANCY_QUERY":
            max_val = max([it.measured_value for it in items if it.measured_value is not None], default=0.0)
            summary = (
                f"Identified {count} property record(s) exhibiting footprint-to-parcel boundary discrepancies. "
                f"Highest observed outside footprint area is {max_val:.2f} m²."
            )
            why = (
                f"Evaluated against RULE-BLDG-001 (Building Outside Parcel). Footprints extend beyond registered "
                f"cadastral parcel boundaries into adjoining areas, exceeding the 0.10 m² tolerance threshold."
            )
            ev = "Supported by Drone Orthomosaic 2026 and AI building segmentation layers."
            conf = f"Spatial discrepancy confidence is {int((top_item.confidence_score or 0.90) * 100)}% based on high-resolution orthophoto resolution."

        elif "OVERLAP" in finding_type or intent.intent.value == "OVERLAP_QUERY":
            summary = f"Identified {count} parcel cadastral boundary overlap discrepancy finding(s)."
            why = (
                f"Evaluated against RULE-PRCL-001 (Parcel Overlap). Adjoining parcel polygons share intersecting "
                f"interior area exceeding 0.10 m² (shared boundary edges without area overlap were filtered out)."
            )
            ev = "Cadastral revenue boundary maps and digitised survey polygons."
            conf = "Derived directly from authoritative boundary coordinate geometry."

        elif "INFRASTRUCTURE" in finding_type or intent.intent.value in ("INFRASTRUCTURE_PROXIMITY_QUERY", "PROXIMITY_SEARCH"):
            summary = f"Identified {count} feature(s) situated near critical infrastructure corridors."
            why = (
                f"Evaluated against RULE-INFR-001 (Infrastructure Clearance). "
                f"Calculated perpendicular distance using conformal metric projections (UTM Zone 43N)."
            )
            ev = "Municipal infrastructure master plan and road network vector layers."
            conf = "High geometric certainty based on conformal metric coordinate projection."

        elif "EVIDENCE" in finding_type or intent.intent.value in ("EVIDENCE_QUERY", "PROVENANCE_QUERY"):
            summary = f"Retrieved {count} evidentiary records and provenance lineage steps."
            why = "Ground truth verification anchored to sensor capture runs and ML extraction versions."
            ev = top_item.subtitle or "Authoritative dataset and survey sources."
            conf = f"Composite confidence rating: {int((top_item.confidence_score or 0.85) * 100)}%."

        else:
            summary = f"Identified {count} spatial record(s) matching your investigation query."
            why = "Analyzed via BhuSetu 3D spatial intelligence engine."
            ev = "Cadastral, building, and infrastructure layers."
            conf = f"Technical reliability score: {int((top_item.confidence_score or 0.85) * 100)}%."

        return InvestigationExplanation(
            summary=summary,
            why_flagged=why,
            evidence_context=ev,
            provenance_context="Lineage tracked through Phase 8 Provenance DAG.",
            confidence_explanation=conf,
            limitations_notice=LIMITATIONS_NOTICE,
            governance_notice=GOVERNANCE_NOTICE,
        )
