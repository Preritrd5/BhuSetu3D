"""
BhuSetu 3D Geometry Validator & Repair Engine
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 4: Data Ingestion & GIS Processing Pipeline
"""
from typing import Optional, Tuple, Set
import shapely
from shapely.geometry.base import BaseGeometry
from shapely.geometry import (
    Polygon,
    MultiPolygon,
    LineString,
    MultiLineString,
    Point,
    GeometryCollection,
)
from shapely.validation import make_valid
from app.core.logging import logger


class GeometryValidator:
    """Verifies topological validity, coordinate ranges, and transparently repairs salvageable geometries."""

    POLYGON_TYPES = {"Polygon", "MultiPolygon"}
    LINE_TYPES = {"LineString", "MultiLineString"}
    POINT_TYPES = {"Point", "MultiPoint"}

    @classmethod
    def validate_and_repair(
        cls,
        geom: Optional[BaseGeometry],
        expected_category: str = "POLYGON"
    ) -> Tuple[Optional[BaseGeometry], str, Optional[str]]:
        """
        Validates geometry, performs controlled repair if necessary.
        Returns:
            (resulting_geom, status_code, rejection_reason)
            status_code: 'VALID', 'REPAIRED', 'REJECTED'
            rejection_reason: None, 'EMPTY_GEOMETRY', 'TYPE_MISMATCH', 'UNREPAIRABLE_GEOMETRY'
        """
        if geom is None or geom.is_empty:
            return None, "REJECTED", "EMPTY_GEOMETRY"

        # Check coordinate bounds (WGS84 lat/long sanity check: -180..180, -90..90)
        try:
            minx, miny, maxx, maxy = geom.bounds
            if abs(minx) > 180.01 or abs(maxx) > 180.01 or abs(miny) > 90.01 or abs(maxy) > 90.01:
                return None, "REJECTED", "COORDINATES_OUT_OF_BOUNDS_FOR_WGS84"
        except Exception as e:
            return None, "REJECTED", f"BOUNDS_CALCULATION_FAILED: {e}"

        # If already valid
        if geom.is_valid:
            normalized_geom = cls._filter_expected_type(geom, expected_category)
            if normalized_geom is None:
                return None, "REJECTED", f"TYPE_MISMATCH_EXPECTED_{expected_category}_GOT_{geom.geom_type.upper()}"
            return normalized_geom, "VALID", None

        # Attempt transparent repair using shapely.validation.make_valid
        try:
            repaired = make_valid(geom)
            if repaired is None or repaired.is_empty:
                return None, "REJECTED", "REPAIR_RESULTED_IN_EMPTY_GEOMETRY"

            normalized = cls._filter_expected_type(repaired, expected_category)
            if normalized is not None and normalized.is_valid and not normalized.is_empty:
                logger.info(f"Geometry repaired successfully: {geom.geom_type} -> {normalized.geom_type}")
                return normalized, "REPAIRED", None
            else:
                return None, "REJECTED", "UNREPAIRABLE_GEOMETRY_INVALID_AFTER_MAKE_VALID"
        except Exception as repair_exc:
            logger.warning(f"make_valid failed on geometry: {repair_exc}")
            return None, "REJECTED", f"UNREPAIRABLE_GEOMETRY: {repair_exc}"

    @classmethod
    def _filter_expected_type(
        cls,
        geom: BaseGeometry,
        expected_category: str
    ) -> Optional[BaseGeometry]:
        """Extracts and normalizes geometry matching the expected category (POLYGON, LINE, POINT, ANY)."""
        gtype = geom.geom_type

        if expected_category == "ANY":
            return geom

        if expected_category == "POLYGON":
            if gtype in cls.POLYGON_TYPES:
                return geom
            if gtype == "GeometryCollection":
                # Extract polygon sub-elements
                polygons = [g for g in geom.geoms if g.geom_type in cls.POLYGON_TYPES]
                if not polygons:
                    return None
                if len(polygons) == 1:
                    return polygons[0]
                return shapely.unary_union(polygons)
            return None

        if expected_category == "LINE":
            if gtype in cls.LINE_TYPES:
                return geom
            if gtype == "GeometryCollection":
                lines = [g for g in geom.geoms if g.geom_type in cls.LINE_TYPES]
                if not lines:
                    return None
                if len(lines) == 1:
                    return lines[0]
                return shapely.unary_union(lines)
            return None

        if expected_category == "POINT":
            if gtype in cls.POINT_TYPES:
                return geom
            return None

        return geom
