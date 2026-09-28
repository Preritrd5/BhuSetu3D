"""
BhuSetu 3D Spatial Intelligence Rule Engine
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 9: Spatial Intelligence & Conflict Detection

Implements deterministic metric calculations (UTM Zone 43N / EPSG:32643 & EPSG:3857),
tolerance handling, geometric predicates, and explainable discrepancy detection.
"""
from dataclasses import dataclass
from decimal import Decimal
from typing import Optional, Tuple, Dict, Any, List
import shapely.geometry
from shapely.geometry.base import BaseGeometry
from shapely.ops import transform
import pyproj

from app.schemas.conflict import ConflictSeverity, ConflictType


# Conformal projected CRS for metric measurements across Bengaluru/Karnataka (UTM Zone 43N)
# Fallback to EPSG:3857 if coordinates are outside UTM 43N envelope
_TO_METRIC_TRANSFORMER = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True).transform
_TO_WGS84_TRANSFORMER = pyproj.Transformer.from_crs("EPSG:32643", "EPSG:4326", always_xy=True).transform


@dataclass
class RuleDefinition:
    id: str
    name: str
    description: str
    target_entity_type: str
    related_entity_type: Optional[str]
    spatial_operation: str
    threshold_value: float
    threshold_unit: str
    severity: str
    analysis_version: str = "spatial_rules_v1"


# Canonical Rule Registry
CANONICAL_RULES: Dict[str, RuleDefinition] = {
    "RULE-BLDG-001": RuleDefinition(
        id="RULE-BLDG-001",
        name="Building Outside Parcel Boundary",
        description="Detects building footprints extending beyond legal cadastral parcel boundaries.",
        target_entity_type="BUILDING",
        related_entity_type="PARCEL",
        spatial_operation="OUTSIDE_AREA",
        threshold_value=0.500,  # 0.500 m² threshold
        threshold_unit="m²",
        severity=ConflictSeverity.HIGH.value,
    ),
    "RULE-BLDG-002": RuleDefinition(
        id="RULE-BLDG-002",
        name="Building Boundary Proximity",
        description="Identifies buildings situated within close proximity to parcel boundaries.",
        target_entity_type="BUILDING",
        related_entity_type="PARCEL",
        spatial_operation="MIN_DISTANCE",
        threshold_value=1.000,  # 1.000 m setback threshold
        threshold_unit="m",
        severity=ConflictSeverity.MEDIUM.value,
    ),
    "RULE-PRCL-001": RuleDefinition(
        id="RULE-PRCL-001",
        name="Parcel Geometry Overlap",
        description="Detects geometric polygon overlap between adjacent cadastral parcels.",
        target_entity_type="PARCEL",
        related_entity_type="PARCEL",
        spatial_operation="OVERLAP_AREA",
        threshold_value=1.000,  # 1.000 m² tolerance
        threshold_unit="m²",
        severity=ConflictSeverity.HIGH.value,
    ),
    "RULE-INFR-001": RuleDefinition(
        id="RULE-INFR-001",
        name="Infrastructure Buffer Proximity",
        description="Identifies property boundaries situated within safety proximity buffer of utilities.",
        target_entity_type="PARCEL",
        related_entity_type="INFRASTRUCTURE",
        spatial_operation="INFRA_PROXIMITY",
        threshold_value=5.000,  # 5.000 m buffer
        threshold_unit="m",
        severity=ConflictSeverity.MEDIUM.value,
    ),
    "RULE-GEOM-001": RuleDefinition(
        id="RULE-GEOM-001",
        name="Geometry Structural Validity",
        description="Identifies invalid, self-intersecting, or non-closed geometries.",
        target_entity_type="PARCEL",
        related_entity_type=None,
        spatial_operation="GEOMETRY_VALIDITY",
        threshold_value=0.000,
        threshold_unit="validity",
        severity=ConflictSeverity.HIGH.value,
    ),
}


class SpatialRuleEngine:
    """
    Core deterministic spatial intelligence rule evaluation engine.
    Ensures calculations use appropriate metric projections and explicit tolerance controls.
    """

    @staticmethod
    def to_metric(geom: BaseGeometry) -> BaseGeometry:
        """Transforms WGS84 (EPSG:4326) geometry to metric CRS (UTM 43N)."""
        try:
            return transform(_TO_METRIC_TRANSFORMER, geom)
        except Exception:
            # Fallback to EPSG:3857 if UTM 43N transformation encounters edge cases
            t_3857 = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True).transform
            return transform(t_3857, geom)

    @staticmethod
    def to_wgs84(geom: BaseGeometry) -> BaseGeometry:
        """Transforms metric geometry back to WGS84 (EPSG:4326)."""
        return transform(_TO_WGS84_TRANSFORMER, geom)

    @classmethod
    def calculate_metric_area(cls, geom: BaseGeometry) -> float:
        """Calculates true geodesic metric area in square meters."""
        if geom is None or geom.is_empty:
            return 0.0
        metric_geom = cls.to_metric(geom)
        return float(metric_geom.area)

    @classmethod
    def calculate_metric_distance(cls, geom1: BaseGeometry, geom2: BaseGeometry) -> float:
        """Calculates shortest metric distance in meters between two geometries."""
        if geom1 is None or geom2 is None or geom1.is_empty or geom2.is_empty:
            return float("inf")
        m1 = cls.to_metric(geom1)
        m2 = cls.to_metric(geom2)
        return float(m1.distance(m2))

    @classmethod
    def validate_geometry(cls, geom: Optional[BaseGeometry]) -> Tuple[bool, Optional[str], Optional[BaseGeometry]]:
        """
        Validates structural integrity of a geometry.
        Returns (is_valid, reason, repaired_geometry_if_applicable).
        Authoritative original geometry is preserved untouched.
        """
        if geom is None:
            return False, "Geometry is NULL or missing", None
        if geom.is_empty:
            return False, "Geometry is empty (zero coordinates)", None
        if not geom.is_valid:
            try:
                # Non-destructive repair for computational analysis
                repaired = shapely.make_valid(geom)
                return False, f"Geometry is structurally invalid (self-intersection/ring issues)", repaired
            except Exception as e:
                return False, f"Geometry validation failed: {str(e)}", None

        return True, None, geom

    @classmethod
    def evaluate_building_outside(
        cls,
        bld_geom: BaseGeometry,
        prc_geom: BaseGeometry,
        building_code: str,
        parcel_ulpin: str,
        threshold_sqm: float = 0.500,
    ) -> Optional[Dict[str, Any]]:
        """
        RULE-BLDG-001: Evaluates if building footprint extends beyond parcel boundary.
        Calculation: Difference(building, parcel)
        """
        # Ensure geometries are valid for calculation
        valid_bld, _, fixed_bld = cls.validate_geometry(bld_geom)
        valid_prc, _, fixed_prc = cls.validate_geometry(prc_geom)

        g_bld = fixed_bld if fixed_bld else bld_geom
        g_prc = fixed_prc if fixed_prc else prc_geom

        total_bld_area = cls.calculate_metric_area(g_bld)
        if total_bld_area <= 0:
            return None

        # Compute metric difference
        diff_geom = g_bld.difference(g_prc)
        if diff_geom.is_empty:
            return None

        outside_area = round(cls.calculate_metric_area(diff_geom), 3)

        # Tolerance check: Ignore tiny floating-point slivers < 0.1 m²
        if outside_area <= 0.100 or outside_area < threshold_sqm:
            return None

        outside_pct = round((outside_area / total_bld_area) * 100.0, 1)

        # Determine severity
        if outside_area > 10.0 or outside_pct > 15.0:
            severity = ConflictSeverity.HIGH.value
        elif outside_area > 2.0 or outside_pct > 5.0:
            severity = ConflictSeverity.MEDIUM.value
        else:
            severity = ConflictSeverity.LOW.value

        explanation = (
            f"Building {building_code} footprint extends beyond parcel boundary {parcel_ulpin} "
            f"by approximately {outside_area:.2f} m² ({outside_pct}% of total building footprint). "
            f"Configured discrepancy threshold is {threshold_sqm:.2f} m²."
        )

        return {
            "rule_id": "RULE-BLDG-001",
            "rule_name": "Building Outside Parcel Boundary",
            "conflict_type": ConflictType.BUILDING_OUTSIDE_PARCEL.value,
            "severity": severity,
            "measured_value": outside_area,
            "threshold_value": threshold_sqm,
            "measured_unit": "m²",
            "deviation_value": outside_area,
            "explanation": explanation,
            "conflict_geom": diff_geom,
            "discrepancy_details": {
                "total_footprint_sqm": round(total_bld_area, 2),
                "outside_area_sqm": outside_area,
                "outside_percentage": outside_pct,
                "rule_operation": "OUTSIDE_AREA",
            },
        }

    @classmethod
    def evaluate_building_proximity(
        cls,
        bld_geom: BaseGeometry,
        prc_geom: BaseGeometry,
        building_code: str,
        parcel_ulpin: str,
        threshold_meters: float = 1.000,
    ) -> Optional[Dict[str, Any]]:
        """
        RULE-BLDG-002: Detects building boundary proximity to parcel boundary within setback threshold.
        Calculation: Distance from building perimeter to parcel perimeter when inside parcel.
        """
        # If building is outside parcel, boundary proximity is superseded by building_outside
        diff_geom = bld_geom.difference(prc_geom)
        outside_area = cls.calculate_metric_area(diff_geom)
        if outside_area > 0.500:
            return None

        # Calculate metric distance between exterior boundaries
        bld_boundary = bld_geom.boundary
        prc_boundary = prc_geom.boundary

        dist_meters = round(cls.calculate_metric_distance(bld_boundary, prc_boundary), 3)

        if dist_meters <= 0.05:  # Touching or virtually touching boundary
            explanation = (
                f"Building {building_code} touches the boundary of parcel {parcel_ulpin} "
                f"(Distance: {dist_meters:.2f} m, Setback threshold: {threshold_meters:.2f} m)."
            )
            severity = ConflictSeverity.MEDIUM.value
        elif dist_meters < threshold_meters:
            explanation = (
                f"Building {building_code} is situated approximately {dist_meters:.2f} m from the parcel boundary "
                f"of {parcel_ulpin}, which is within the configured setback buffer of {threshold_meters:.2f} m."
            )
            severity = ConflictSeverity.LOW.value
        else:
            return None

        return {
            "rule_id": "RULE-BLDG-002",
            "rule_name": "Building Boundary Proximity",
            "conflict_type": ConflictType.BUILDING_BOUNDARY_PROXIMITY.value,
            "severity": severity,
            "measured_value": dist_meters,
            "threshold_value": threshold_meters,
            "measured_unit": "m",
            "deviation_value": round(threshold_meters - dist_meters, 2),
            "explanation": explanation,
            "conflict_geom": bld_geom,
            "discrepancy_details": {
                "distance_to_boundary_meters": dist_meters,
                "setback_threshold_meters": threshold_meters,
                "rule_operation": "MIN_DISTANCE",
            },
        }

    @classmethod
    def evaluate_parcel_overlap(
        cls,
        prc1_geom: BaseGeometry,
        prc2_geom: BaseGeometry,
        ulpin1: str,
        ulpin2: str,
        threshold_sqm: float = 1.000,
    ) -> Optional[Dict[str, Any]]:
        """
        RULE-PRCL-001: Detects geometric overlap between two parcel polygons.
        Distinguishes touching boundaries (normal adjacency) from true geometric overlap.
        """
        # Section 16 rule: Touching boundaries sharing edges are normal adjacency, NOT conflict
        if prc1_geom.touches(prc2_geom):
            return None

        if not prc1_geom.intersects(prc2_geom):
            return None

        intersection = prc1_geom.intersection(prc2_geom)
        if intersection.is_empty or intersection.geom_type not in ("Polygon", "MultiPolygon"):
            return None  # Line or point intersection is touching, not polygon overlap

        overlap_area = round(cls.calculate_metric_area(intersection), 3)

        # Tolerance check
        if overlap_area <= 0.100 or overlap_area < threshold_sqm:
            return None

        severity = ConflictSeverity.HIGH.value if overlap_area > 5.0 else ConflictSeverity.MEDIUM.value

        explanation = (
            f"Parcel {ulpin1} overlaps adjacent parcel {ulpin2} by approximately {overlap_area:.2f} m². "
            f"Configured geometric overlap tolerance threshold is {threshold_sqm:.2f} m²."
        )

        return {
            "rule_id": "RULE-PRCL-001",
            "rule_name": "Parcel Geometry Overlap",
            "conflict_type": ConflictType.PROPERTY_PROPERTY_OVERLAP.value,
            "severity": severity,
            "measured_value": overlap_area,
            "threshold_value": threshold_sqm,
            "measured_unit": "m²",
            "deviation_value": overlap_area,
            "explanation": explanation,
            "conflict_geom": intersection,
            "discrepancy_details": {
                "overlap_area_sqm": overlap_area,
                "threshold_sqm": threshold_sqm,
                "adjacent_parcel_ulpin": ulpin2,
                "rule_operation": "OVERLAP_AREA",
            },
        }

    @classmethod
    def evaluate_infrastructure_proximity(
        cls,
        prc_geom: BaseGeometry,
        infra_geom: BaseGeometry,
        parcel_ulpin: str,
        infra_name: str,
        utility_category: str,
        threshold_meters: float = 5.000,
    ) -> Optional[Dict[str, Any]]:
        """
        RULE-INFR-001: Identifies critical proximity or direct intersection with infrastructure corridors.
        """
        # Check direct intersection
        if prc_geom.intersects(infra_geom):
            intersection = prc_geom.intersection(infra_geom)
            explanation = (
                f"Parcel {parcel_ulpin} directly intersects infrastructure asset '{infra_name}' "
                f"({utility_category}). Potential easement or utility corridor interaction."
            )
            return {
                "rule_id": "RULE-INFR-001",
                "rule_name": "Infrastructure Direct Intersection",
                "conflict_type": ConflictType.INFRASTRUCTURE_INTERSECTION.value,
                "severity": ConflictSeverity.HIGH.value,
                "measured_value": 0.000,
                "threshold_value": threshold_meters,
                "measured_unit": "m",
                "deviation_value": 0.00,
                "explanation": explanation,
                "conflict_geom": intersection if not intersection.is_empty else prc_geom,
                "discrepancy_details": {
                    "utility_name": infra_name,
                    "category": utility_category,
                    "intersects": True,
                    "distance_meters": 0.0,
                    "rule_operation": "INFRA_INTERSECTION",
                },
            }

        # Check proximity distance
        dist_meters = round(cls.calculate_metric_distance(prc_geom, infra_geom), 3)
        if dist_meters < threshold_meters:
            explanation = (
                f"Parcel {parcel_ulpin} is located within {dist_meters:.2f} m of utility corridor "
                f"'{infra_name}' ({utility_category}), violating configured buffer of {threshold_meters:.2f} m."
            )
            return {
                "rule_id": "RULE-INFR-001",
                "rule_name": "Infrastructure Buffer Proximity",
                "conflict_type": ConflictType.INFRASTRUCTURE_PROXIMITY.value,
                "severity": ConflictSeverity.MEDIUM.value,
                "measured_value": dist_meters,
                "threshold_value": threshold_meters,
                "measured_unit": "m",
                "deviation_value": round(threshold_meters - dist_meters, 2),
                "explanation": explanation,
                "conflict_geom": prc_geom,
                "discrepancy_details": {
                    "utility_name": infra_name,
                    "category": utility_category,
                    "distance_meters": dist_meters,
                    "threshold_meters": threshold_meters,
                    "rule_operation": "INFRA_PROXIMITY",
                },
            }

        return None
