"""
BhuSetu 3D Spatial Intent Validator
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 10: Natural-Language Spatial Query + AI Spatial Investigator
"""
import re
import uuid
from typing import Tuple, Optional
from app.schemas.spatial_investigator import (
    SpatialIntent,
    SpatialIntentType,
    EntityType,
    InfrastructureTypeEnum,
)

FORBIDDEN_MUTATION_KEYWORDS = [
    "delete", "drop", "truncate", "update", "insert", "alter",
    "modify", "remove", "grant", "revoke", "create table", "replace",
    "shutdown", "restart", "exec", "eval", "system prompt", "reveal password"
]

MAX_DISTANCE_METERS = 2000.0
DEFAULT_RESULT_LIMIT = 20
MAX_RESULT_LIMIT = 50


class SpatialIntentValidator:
    """
    Strict validation gatekeeper for natural language spatial intents.
    Guarantees read-only execution, enforces metric boundaries, and shields against prompt injection.
    """

    @classmethod
    def validate_user_query(cls, query: str) -> Optional[str]:
        """
        Pre-flight check on raw user query string for injection or forbidden operations.
        Returns error reason if invalid, or None if acceptable.
        """
        lowered = query.lower()

        # Check for mutation / destructive requests
        for kw in FORBIDDEN_MUTATION_KEYWORDS:
            if re.search(r'\b' + re.escape(kw) + r'\b', lowered):
                return (
                    f"BhuSetu 3D Spatial Investigator is strictly read-only. "
                    f"Operation '{kw}' is not permitted."
                )

        return None

    @classmethod
    def validate_and_sanitize(cls, intent: SpatialIntent) -> Tuple[bool, SpatialIntent, Optional[str]]:
        """
        Validates and sanitizes a parsed SpatialIntent.
        Returns: (is_valid, sanitized_intent, error_message)
        """
        # 1. Check if intent is marked as unsupported
        if intent.intent == SpatialIntentType.UNSUPPORTED:
            return False, intent, intent.unsupported_reason or "The requested query intent is not supported."

        # 2. Check if clarification is required
        if intent.clarification_needed:
            return True, intent, intent.clarification_question

        # 3. Enforce distance boundaries
        if intent.distance_meters is not None:
            if intent.distance_meters < 0:
                intent.distance_meters = 10.0
            elif intent.distance_meters > MAX_DISTANCE_METERS:
                intent.intent = SpatialIntentType.UNSUPPORTED
                intent.unsupported_reason = (
                    f"The requested distance of {intent.distance_meters}m exceeds the maximum allowed "
                    f"radius of {int(MAX_DISTANCE_METERS)}m. Please specify a more localized query."
                )
                return False, intent, intent.unsupported_reason

        # 4. Enforce result limits
        if intent.limit <= 0:
            intent.limit = DEFAULT_RESULT_LIMIT
        elif intent.limit > MAX_RESULT_LIMIT:
            intent.limit = MAX_RESULT_LIMIT

        # 5. Validate UUID strings
        for field in ["property_id", "parcel_id", "building_id"]:
            val = getattr(intent, field)
            if val:
                try:
                    uuid.UUID(str(val))
                except (ValueError, TypeError):
                    setattr(intent, field, None)

        # 6. Check ambiguous proximity requests
        if intent.intent in (SpatialIntentType.PROXIMITY_SEARCH, SpatialIntentType.INFRASTRUCTURE_PROXIMITY_QUERY):
            if not intent.infrastructure_type and not intent.target_entity_type:
                intent.clarification_needed = True
                intent.clarification_question = (
                    "Please specify which infrastructure type you wish to inspect (Road, Power Line, Pipeline, Drainage, or Railway)."
                )
                return True, intent, intent.clarification_question

        # 7. Check confidence threshold boundary
        if intent.min_confidence is not None:
            if intent.min_confidence < 0.0 or intent.min_confidence > 1.0:
                intent.min_confidence = 0.50

        return True, intent, None
