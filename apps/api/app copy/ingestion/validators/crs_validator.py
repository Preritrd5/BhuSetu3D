"""
BhuSetu 3D Coordinate Reference System (CRS) Validator & Transformer
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 4: Data Ingestion & GIS Processing Pipeline
"""
from typing import Optional, Tuple, Any
import pyproj
from pyproj import CRS
from pyproj.exceptions import CRSError
from app.core.logging import logger

CANONICAL_TARGET_CRS = "EPSG:4326"


class CrsValidator:
    """Detects, validates, and manages coordinate reprojection to canonical EPSG:4326."""

    @staticmethod
    def parse_crs(crs_input: Any) -> Optional[CRS]:
        """Parses any CRS representation into a pyproj.CRS object."""
        if crs_input is None:
            return None
        try:
            if isinstance(crs_input, CRS):
                return crs_input
            if isinstance(crs_input, int):
                return CRS.from_epsg(crs_input)
            if isinstance(crs_input, str):
                trimmed = crs_input.strip()
                if not trimmed:
                    return None
                if trimmed.isdigit():
                    return CRS.from_epsg(int(trimmed))
                return CRS.from_user_input(trimmed)
            return CRS.from_user_input(crs_input)
        except (CRSError, Exception) as exc:
            logger.warning(f"Could not parse CRS '{crs_input}': {exc}")
            return None

    @classmethod
    def resolve_crs(
        cls,
        detected_crs: Optional[Any],
        manual_crs: Optional[str] = None
    ) -> Tuple[CRS, bool, Optional[str]]:
        """
        Resolves effective CRS.
        Returns (effective_crs, was_manual_override, crs_name/code).
        Raises ValueError if no valid CRS can be determined.
        """
        parsed = cls.parse_crs(detected_crs)
        manual_parsed = cls.parse_crs(manual_crs)

        if manual_parsed is not None:
            code = manual_parsed.to_string()
            return manual_parsed, True, code

        if parsed is not None:
            code = parsed.to_string()
            return parsed, False, code

        raise ValueError(
            "Missing Spatial Reference System (CRS). The dataset lacks an embedded projection, "
            "and no manual CRS override was specified."
        )

    @staticmethod
    def is_canonical_wgs84(crs: CRS) -> bool:
        """Checks if CRS is already EPSG:4326 / WGS84."""
        try:
            epsg = crs.to_epsg()
            if epsg == 4326:
                return True
            # Also check auth name and code
            auth = crs.to_authority()
            if auth and auth[0].upper() == "EPSG" and auth[1] == "4326":
                return True
        except Exception:
            pass
        return False
