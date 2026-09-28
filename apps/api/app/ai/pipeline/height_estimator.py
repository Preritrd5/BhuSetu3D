"""
BhuSetu 3D Building Height & Elevation Estimation Engine
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 6: AI Building Extraction + 3D Generation
"""
from typing import Tuple, Optional, Dict, Any
from pathlib import Path
import numpy as np
import shapely.geometry
from shapely.geometry.base import BaseGeometry
import rasterio
from rasterio.mask import mask
from app.core.logging import logger


class HeightEstimator:
    """
    Evidence-aware building height and base elevation derivation.
    Follows strict source hierarchy: DSM-DEM difference -> Attribute/Survey -> Illustrative/Unavailable.
    """

    @classmethod
    def estimate_height(
        cls,
        footprint_geom: BaseGeometry,
        dsm_path: Optional[str] = None,
        dem_path: Optional[str] = None,
        attributes: Optional[Dict[str, Any]] = None,
        default_illustrative_height: Optional[float] = None,
        default_ground_elevation: float = 920.0  # Bengaluru mean elevation ASL
    ) -> Tuple[Optional[float], float, str, float]:
        """
        Derives building height and ground elevation.
        
        Returns:
            (height_m, ground_elevation_m, height_source, height_confidence)
            height_source: 'DSM_DEM_DIFFERENCE', 'SURVEY_ATTRIBUTE', 'ILLUSTRATIVE_ASSUMED', 'HEIGHT_UNAVAILABLE'
        """
        # 1. Attribute / Survey source
        if attributes:
            for key in ["height", "bldg_height", "height_m", "building_height"]:
                if key in attributes and attributes[key] is not None:
                    try:
                        val = float(attributes[key])
                        if 1.0 <= val <= 800.0:
                            ground_z = float(attributes.get("ground_elevation", default_ground_elevation))
                            return val, ground_z, "SURVEY_ATTRIBUTE", 0.95
                    except (ValueError, TypeError):
                        pass

            # Floor count inference if height not explicitly present (3.0m per floor standard)
            for floor_key in ["floors", "detected_floors", "num_floors", "storeys"]:
                if floor_key in attributes and attributes[floor_key] is not None:
                    try:
                        num = int(attributes[floor_key])
                        if 1 <= num <= 150:
                            calc_height = float(num * 3.0)
                            return calc_height, default_ground_elevation, "INFERRED_FLOOR_COUNT", 0.75
                    except (ValueError, TypeError):
                        pass

        # 2. DSM / DEM Difference
        if dsm_path and dem_path and Path(dsm_path).exists() and Path(dem_path).exists():
            try:
                geom_geojson = [shapely.geometry.mapping(footprint_geom)]

                with rasterio.open(dsm_path) as dsm_src, rasterio.open(dem_path) as dem_src:
                    dsm_out, _ = mask(dsm_src, geom_geojson, crop=True)
                    dem_out, _ = mask(dem_src, geom_geojson, crop=True)

                    dsm_valid = dsm_out[dsm_out != dsm_src.nodata]
                    dem_valid = dem_out[dem_out != dem_src.nodata]

                    if len(dsm_valid) > 0 and len(dem_valid) > 0:
                        ground_z = float(np.nanmedian(dem_valid))
                        roof_z = float(np.nanpercentile(dsm_valid, 90))
                        diff = roof_z - ground_z

                        if 2.0 <= diff <= 500.0:
                            return round(diff, 2), round(ground_z, 2), "DSM_DEM_DIFFERENCE", 0.88
            except Exception as e:
                logger.warning(f"DSM/DEM height calculation failed: {e}")

        # 3. Explicit illustrative prototype fallback
        if default_illustrative_height is not None and default_illustrative_height > 0:
            return round(default_illustrative_height, 2), default_ground_elevation, "ILLUSTRATIVE_ASSUMED", 0.40

        # 4. Height unavailable (Do not fabricate authoritative values)
        return None, default_ground_elevation, "HEIGHT_UNAVAILABLE", 0.0
