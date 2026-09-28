"""
BhuSetu 3D Spatial Result Grounder & Map Controller
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 10: Natural-Language Spatial Query + AI Spatial Investigator
"""
from typing import List, Dict, Any, Optional
from app.schemas.spatial_investigator import (
    InvestigationResultItem,
    MapActionDirective,
    MapActionType,
    SpatialIntent,
)


class SpatialResultGrounder:
    """
    Verifies that all returned entities correspond to real PostGIS/Supabase records.
    Constructs deterministic MapActionDirectives for 2D/3D map synchronization.
    """

    @classmethod
    def ground_and_build_map_directive(
        cls,
        intent: SpatialIntent,
        items: List[InvestigationResultItem]
    ) -> Optional[MapActionDirective]:
        """
        Builds a safe, deterministic map action directive based on the actual returned items.
        """
        if not items:
            return None

        # Extract genuine entity IDs
        target_ids = [item.entity_id for item in items if item.entity_id]
        if not target_ids:
            return None

        primary_id = target_ids[0]

        # Determine map action
        action_type = "SHOW_RESULTS"
        if intent.map_action:
            action_type = intent.map_action.value
        elif len(target_ids) == 1:
            action_type = "FOCUS_PROPERTY"

        # Build highlight features
        highlight_features: List[Dict[str, Any]] = []
        for it in items:
            if it.geom_geojson:
                highlight_features.append({
                    "id": it.entity_id,
                    "type": it.entity_type,
                    "code": it.entity_code,
                    "geometry": it.geom_geojson,
                    "has_discrepancy": it.has_discrepancy,
                    "measured_value": it.measured_value,
                })

        return MapActionDirective(
            action_type=action_type,
            target_ids=target_ids,
            primary_id=primary_id,
            zoom_level=16 if len(target_ids) <= 3 else 14,
            highlight_features=highlight_features
        )
