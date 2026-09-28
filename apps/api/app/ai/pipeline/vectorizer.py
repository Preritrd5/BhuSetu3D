"""
BhuSetu 3D Building Vectorizer & Deterministic GIS Post-Processing
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 6: AI Building Extraction + 3D Generation
"""
import uuid
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import cv2
import shapely.geometry
from shapely.geometry import Polygon, MultiPolygon
from shapely.affinity import affine_transform
import pyproj
from pyproj import Transformer
from affine import Affine

from app.ingestion.validators.geometry_validator import GeometryValidator
from app.ingestion.validators.crs_validator import CrsValidator
from app.core.spatial import geometry_to_geojson
from app.schemas.building_ai import BuildingCandidateResult
from app.core.logging import logger


class BuildingVectorizer:
    """
    Transforms raw AI segmentation probability arrays into valid,
    georeferenced, topologically sound cadastral building footprint polygons.
    """

    @classmethod
    def vectorize_mask(
        cls,
        probability_mask: np.ndarray,
        affine_matrix: Affine,
        source_crs: str = "EPSG:4326",
        threshold: float = 0.5,
        min_area_sqm: float = 15.0,
    ) -> List[BuildingCandidateResult]:
        """
        Extracts polygons from segmentation probability mask.
        """
        # 1. Binary thresholding
        binary_mask = (probability_mask >= threshold).astype(np.uint8) * 255

        # 2. Morphological cleanup: remove single-pixel artifacts
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        cleaned_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)
        cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_CLOSE, kernel)

        # 3. Contour extraction (RETR_EXTERNAL to extract building outer boundaries)
        contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        candidates: List[BuildingCandidateResult] = []

        # Prepare coordinate transformer to WGS84 EPSG:4326 if needed
        is_wgs84 = "4326" in source_crs
        transformer = None
        if not is_wgs84:
            try:
                transformer = Transformer.from_crs(source_crs, "EPSG:4326", always_xy=True)
            except Exception as e:
                logger.warning(f"Could not initialize transformer for CRS {source_crs}: {e}")

        # Approximation of sqm per degree squared near equator / Bengaluru (1 deg ≈ 111,000m)
        approx_sqm_per_deg2 = 111000.0 * 111000.0 * np.cos(np.radians(13.0))

        for idx, contour in enumerate(contours):
            # Require at least 3 points to form a valid polygon
            if len(contour) < 3:
                continue

            # Simplify contour slightly (Douglas-Peucker with epsilon 1.0 pixel)
            epsilon = 0.01 * cv2.arcLength(contour, True)
            approx_contour = cv2.approxPolyDP(contour, epsilon, True)

            if len(approx_contour) < 3:
                approx_contour = contour

            pts = approx_contour.reshape(-1, 2)

            # Map pixel coordinates (x, y) to spatial coordinates using affine geotransform
            geo_coords = []
            for px, py in pts:
                gx, gy = affine_matrix @ (px, py)
                if transformer:
                    gx, gy = transformer.transform(gx, gy)
                geo_coords.append((float(gx), float(gy)))

            # Close polygon ring
            if geo_coords[0] != geo_coords[-1]:
                geo_coords.append(geo_coords[0])

            try:
                poly = Polygon(geo_coords)
            except Exception:
                continue

            # Topology validation and transparent repair
            repaired_poly, status_code, rejection = GeometryValidator.validate_and_repair(poly, "POLYGON")
            if status_code == "REJECTED" or repaired_poly is None or repaired_poly.is_empty:
                continue

            # Calculate approximate area in square meters
            if is_wgs84:
                area_sqm = float(repaired_poly.area * approx_sqm_per_deg2)
            else:
                area_sqm = float(repaired_poly.area)

            # Filter small noise objects
            if area_sqm < min_area_sqm:
                continue

            # Calculate confidence score: mean probability inside contour bounding box
            x, y, w, h = cv2.boundingRect(contour)
            sub_mask = probability_mask[y:y+h, x:x+w]
            contour_confidence = float(np.mean(sub_mask)) if sub_mask.size > 0 else float(threshold)
            confidence = round(min(1.0, max(float(threshold), contour_confidence)), 3)

            cand = BuildingCandidateResult(
                candidate_id=f"cand-{uuid.uuid4().hex[:8]}",
                footprint_geojson=geometry_to_geojson(repaired_poly),
                area_sqm=round(area_sqm, 2),
                confidence=confidence,
                parcel_id=None,
                association_status="UNMATCHED",
                overlap_ratio=0.0,
                estimated_height_m=None,
                height_source="UNKNOWN"
            )
            candidates.append(cand)

        return candidates
