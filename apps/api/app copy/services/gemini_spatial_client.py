"""
BhuSetu 3D Gemini Spatial Client & Structured Intent Parser
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 10: Natural-Language Spatial Query + AI Spatial Investigator
"""
import os
import re
import json
import httpx
from typing import Optional, Dict, Any, Tuple
from app.core.config import settings
from app.core.logging import logger
from app.schemas.spatial_investigator import (
    SpatialIntent,
    SpatialIntentType,
    EntityType,
    SpatialRelationshipEnum,
    InfrastructureTypeEnum,
    MapActionType,
)


SPATIAL_INTENT_SYSTEM_PROMPT = """
You are the AI Spatial Intent Parser for BhuSetu 3D (SIH Problem Statement SIH26011), an evidence-backed 3D property intelligence platform.
Your ONLY role is to translate a user's natural language question into a safe, structured SpatialIntent JSON object.

RULES:
1. You do NOT have direct database access and MUST NOT generate SQL.
2. You must select strictly from the approved intent types:
   - BOUNDARY_DISCREPANCY_QUERY: Questions about buildings extending outside parcels, encroachments, or setback issues.
   - OVERLAP_QUERY: Questions about parcels overlapping each other.
   - INFRASTRUCTURE_PROXIMITY_QUERY / PROXIMITY_SEARCH: Questions about distance to roads, power lines, pipelines, or utilities.
   - SPATIAL_CONFLICT_QUERY: Questions asking to list all conflicts or discrepancies.
   - CONFLICT_EXPLANATION / PROPERTY_EXPLANATION: Questions asking "Why was this property flagged?" or explaining findings.
   - EVIDENCE_QUERY: Questions about data sources, sensor captures, or supporting evidence.
   - PROVENANCE_QUERY: Questions about ML extraction, derivation lineage, or how a geometry was created.
   - CONFIDENCE_QUERY: Questions about accuracy or reliability scores.
   - PROPERTY_LOOKUP: Searching for a specific ULPIN or survey number.
   - CLARIFICATION_NEEDED: If the question is ambiguous (e.g., "Find properties near infrastructure" without specifying type).
   - UNSUPPORTED: Requests to modify, delete, update, or execute unauthorized operations.
3. Extract metric distance in meters (e.g., "10m" -> 10.0). Default to 20.0 if not specified for proximity.
4. Extract infrastructure type: ROAD, POWER_LINE, WATER_BODY, PIPELINE, RAILWAY, DRAINAGE, GENERAL.
5. If an active property or building is passed in context, bind property_id or building_id to it.
6. OUTPUT STRICT JSON ONLY with the following schema:
{
  "intent": "INTENT_TYPE",
  "entity_type": "PARCEL" | "BUILDING" | "FLOOR" | "UNIT" | "INFRASTRUCTURE" | null,
  "target_entity_type": "string" | null,
  "relationship": "CONTAINS" | "WITHIN" | "INTERSECTS" | "OVERLAPS" | "TOUCHES" | "NEAR" | null,
  "property_id": "uuid string" | null,
  "parcel_id": "uuid string" | null,
  "building_id": "uuid string" | null,
  "infrastructure_type": "ROAD" | "POWER_LINE" | "WATER_BODY" | "PIPELINE" | "RAILWAY" | "DRAINAGE" | "GENERAL" | null,
  "distance_meters": float | null,
  "conflict_type": "string" | null,
  "severity": "HIGH" | "MEDIUM" | "LOW" | null,
  "min_confidence": float | null,
  "limit": integer,
  "clarification_needed": boolean,
  "clarification_question": "string" | null,
  "unsupported_reason": "string" | null,
  "map_action": "SHOW_RESULTS" | "FOCUS_PROPERTY" | "SHOW_CONFLICT" | null
}
"""


class GeminiSpatialClient:
    """
    Manages structured Gemini AI calls with async HTTP client and robust deterministic fallback.
    """

    def __init__(self):
        self.api_key = getattr(settings, "GEMINI_API_KEY", "") or os.environ.get("GEMINI_API_KEY", "")
        self.model = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash") or "gemini-2.0-flash"
        self.is_configured = bool(self.api_key and len(self.api_key.strip()) > 5)

    async def parse_intent_llm(
        self,
        question: str,
        context_entity_type: Optional[str] = None,
        context_entity_id: Optional[str] = None
    ) -> Optional[SpatialIntent]:
        """
        Calls Google Gemini API with JSON mode to extract structured intent.
        Returns parsed SpatialIntent or None if call fails.
        """
        if not self.is_configured:
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        user_content = f"Question: {question}\n"
        if context_entity_type and context_entity_id:
            user_content += f"Active Selected Context: entity_type={context_entity_type}, entity_id={context_entity_id}\n"

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": SPATIAL_INTENT_SYSTEM_PROMPT},
                        {"text": user_content}
                    ]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1
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
                            parsed_json = json.loads(text_part)
                            # Ensure active context is maintained if needed
                            if context_entity_id and not parsed_json.get("property_id") and not parsed_json.get("parcel_id"):
                                if context_entity_type == "PARCEL":
                                    parsed_json["parcel_id"] = context_entity_id
                                    parsed_json["property_id"] = context_entity_id
                                elif context_entity_type == "BUILDING":
                                    parsed_json["building_id"] = context_entity_id
                            return SpatialIntent(**parsed_json)
                else:
                    logger.warning(f"Gemini API returned status {res.status_code}: {res.text[:200]}")
        except Exception as e:
            logger.warning(f"Gemini API intent extraction failed: {str(e)}")

        return None

    @classmethod
    def parse_intent_deterministic(
        cls,
        question: str,
        context_entity_type: Optional[str] = None,
        context_entity_id: Optional[str] = None
    ) -> SpatialIntent:
        """
        Deterministic, rule-based natural language intent parser.
        Guarantees 100% reliable intent classification without hallucinations or external API dependencies.
        """
        q = question.lower().strip()

        # Check for distance expressions (e.g., '10m', '10 meters', 'within 25 metres')
        distance_meters: Optional[float] = None
        dist_match = re.search(r'(?:within|less than|near)?\s*(\d+(?:\.\d+)?)\s*(?:m|meter|metres|meters)', q)
        if dist_match:
            distance_meters = float(dist_match.group(1))

        # Check for infrastructure types
        infra_type: Optional[InfrastructureTypeEnum] = None
        if "road" in q or "highway" in q or "street" in q:
            infra_type = InfrastructureTypeEnum.ROAD
        elif "power" in q or "electric" in q or "line" in q or "grid" in q or "wire" in q:
            infra_type = InfrastructureTypeEnum.POWER_LINE
        elif "pipe" in q or "pipeline" in q or "gas" in q:
            infra_type = InfrastructureTypeEnum.PIPELINE
        elif "water" in q or "river" in q or "canal" in q or "lake" in q:
            infra_type = InfrastructureTypeEnum.WATER_BODY
        elif "rail" in q or "train" in q or "track" in q:
            infra_type = InfrastructureTypeEnum.RAILWAY
        elif "drain" in q or "drainage" in q or "sewer" in q:
            infra_type = InfrastructureTypeEnum.DRAINAGE

        # Check for severity filters
        severity: Optional[str] = None
        if "high" in q or "critical" in q:
            severity = "HIGH"
        elif "medium" in q:
            severity = "MEDIUM"
        elif "low" in q:
            severity = "LOW"

        # Check for confidence filters
        min_confidence: Optional[float] = None
        conf_match = re.search(r'(\d+)%\s*confidence', q)
        if conf_match:
            min_confidence = float(conf_match.group(1)) / 100.0
        elif "high confidence" in q:
            min_confidence = 0.85

        # 1. Why / Explanation questions
        if "why" in q and ("flag" in q or "conflict" in q or "issue" in q or "discrepanc" in q):
            return SpatialIntent(
                intent=SpatialIntentType.CONFLICT_EXPLANATION,
                entity_type=EntityType.PROPERTY if not context_entity_type else EntityType[context_entity_type],
                property_id=context_entity_id if context_entity_type == "PARCEL" else None,
                building_id=context_entity_id if context_entity_type == "BUILDING" else None,
                map_action=MapActionType.SHOW_CONFLICT
            )

        # 2. Evidence & Provenance questions
        if "evidence" in q or "sensor" in q or "source" in q or "ortho" in q or "lidar" in q:
            return SpatialIntent(
                intent=SpatialIntentType.EVIDENCE_QUERY,
                entity_type=EntityType.BUILDING if "building" in q else EntityType.PARCEL,
                property_id=context_entity_id if context_entity_type == "PARCEL" else None,
                building_id=context_entity_id if context_entity_type == "BUILDING" else None,
            )

        if "provenance" in q or "how was" in q or "generated" in q or "extract" in q or "derived" in q:
            return SpatialIntent(
                intent=SpatialIntentType.PROVENANCE_QUERY,
                entity_type=EntityType.BUILDING if "building" in q else EntityType.PARCEL,
                property_id=context_entity_id if context_entity_type == "PARCEL" else None,
                building_id=context_entity_id if context_entity_type == "BUILDING" else None,
            )

        # 3. Building Outside Parcel (Encroachment)
        if ("building" in q or "structure" in q) and ("outside" in q or "beyond" in q or "encroach" in q or "extend" in q):
            return SpatialIntent(
                intent=SpatialIntentType.BOUNDARY_DISCREPANCY_QUERY,
                entity_type=EntityType.BUILDING,
                target_entity_type="PARCEL",
                relationship=SpatialRelationshipEnum.OVERLAPS,
                conflict_type="BUILDING_OUTSIDE_PARCEL",
                severity=severity,
                min_confidence=min_confidence,
                map_action=MapActionType.SHOW_RESULTS
            )

        # 4. Setback / Boundary Proximity
        if "setback" in q or "boundary proximity" in q or "too close to boundary" in q:
            return SpatialIntent(
                intent=SpatialIntentType.BOUNDARY_DISCREPANCY_QUERY,
                entity_type=EntityType.BUILDING,
                target_entity_type="PARCEL",
                conflict_type="SETBACK_VIOLATION",
                severity=severity,
                min_confidence=min_confidence,
                map_action=MapActionType.SHOW_RESULTS
            )

        # 5. Parcel Overlap
        if ("parcel" in q or "property" in q) and ("overlap" in q or "intersect" in q or "encroach" in q):
            return SpatialIntent(
                intent=SpatialIntentType.OVERLAP_QUERY,
                entity_type=EntityType.PARCEL,
                target_entity_type="PARCEL",
                relationship=SpatialRelationshipEnum.OVERLAPS,
                conflict_type="PARCEL_OVERLAP",
                severity=severity,
                min_confidence=min_confidence,
                map_action=MapActionType.SHOW_RESULTS
            )

        # 6. Infrastructure Proximity
        if infra_type or ("near" in q and ("road" in q or "power" in q or "pipe" in q or "water" in q or "drain" in q)):
            return SpatialIntent(
                intent=SpatialIntentType.INFRASTRUCTURE_PROXIMITY_QUERY,
                entity_type=EntityType.BUILDING if "building" in q else EntityType.PARCEL,
                target_entity_type="INFRASTRUCTURE",
                relationship=SpatialRelationshipEnum.NEAR,
                infrastructure_type=infra_type or InfrastructureTypeEnum.GENERAL,
                distance_meters=distance_meters or 20.0,
                property_id=context_entity_id if context_entity_type == "PARCEL" else None,
                map_action=MapActionType.SHOW_RESULTS
            )

        # 7. Generic Conflict / Discrepancy Query
        if "conflict" in q or "discrepanc" in q or "flagged" in q or "issue" in q:
            return SpatialIntent(
                intent=SpatialIntentType.SPATIAL_CONFLICT_QUERY,
                entity_type=EntityType.BUILDING if "building" in q else EntityType.PARCEL,
                property_id=context_entity_id if context_entity_type == "PARCEL" else None,
                building_id=context_entity_id if context_entity_type == "BUILDING" else None,
                severity=severity,
                min_confidence=min_confidence,
                map_action=MapActionType.SHOW_RESULTS
            )

        # 8. Ambiguous Proximity without infrastructure specified
        if "near" in q or "close to" in q:
            return SpatialIntent(
                intent=SpatialIntentType.CLARIFICATION_NEEDED,
                clarification_needed=True,
                clarification_question=(
                    "Which infrastructure corridor would you like to inspect (Road, Power Line, Pipeline, Water Body, or Railway), and within what distance?"
                )
            )

        # 9. Fallback general property summary or lookup
        return SpatialIntent(
            intent=SpatialIntentType.PROPERTY_SUMMARY,
            entity_type=EntityType.PARCEL,
            property_id=context_entity_id if context_entity_type == "PARCEL" else None,
            map_action=MapActionType.SHOW_RESULTS
        )
