"""
BhuSetu 3D Raster Format Processor (GeoTIFF, DEM, DSM)
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 4: Data Ingestion & GIS Processing Pipeline
"""
from pathlib import Path
from typing import Optional, List, Dict, Any
import rasterio
from rasterio.warp import transform_bounds
from shapely.geometry import box, Polygon
from app.ingestion.processors.base import BaseProcessor, NormalizedFeature
from app.ingestion.validators.file_validator import FileValidator
from app.ingestion.validators.crs_validator import CrsValidator, CANONICAL_TARGET_CRS
from app.schemas.ingestion import FileInspectionResult
from app.core.logging import logger


class RasterProcessor(BaseProcessor):
    """Inspects and processes GeoTIFF raster datasets (DEM, DSM, satellite/drone imagery)."""

    def inspect(self, file_path: Path, filename: str) -> FileInspectionResult:
        """Inspects raster header, dimensions, resolution, bands, nodata, and bounds."""
        file_size = file_path.stat().st_size
        file_hash = FileValidator.calculate_sha256(file_path)

        warnings: List[str] = []
        errors: List[str] = []

        try:
            with rasterio.open(file_path) as src:
                width, height = src.width, src.height
                bands = src.count
                crs_str = src.crs.to_string() if src.crs else None
                nodata = src.nodata
                dtypes = list(src.dtypes)
                res = list(src.res)

                # Native bounds
                b = src.bounds
                native_bounds = [float(b.left), float(b.bottom), float(b.right), float(b.top)]

                # Reprojected bounds in EPSG:4326 for spatial_coverage
                wgs84_bounds = native_bounds
                if src.crs and not CrsValidator.is_canonical_wgs84(CrsValidator.parse_crs(src.crs)):
                    try:
                        wgs84_b = transform_bounds(src.crs, CANONICAL_TARGET_CRS, b.left, b.bottom, b.right, b.top)
                        wgs84_bounds = [float(w) for w in wgs84_b]
                    except Exception as trans_err:
                        warnings.append(f"Reprojection of raster bounds to EPSG:4326 failed: {trans_err}")

                meta = {
                    "width": width,
                    "height": height,
                    "bands": bands,
                    "dtypes": dtypes,
                    "nodata": nodata,
                    "resolution": res,
                    "crs": crs_str,
                    "bounds": wgs84_bounds,
                }

                if not crs_str:
                    warnings.append("Raster file lacks embedded CRS.")

                return FileInspectionResult(
                    detected_format="GEOTIFF",
                    file_name=filename,
                    file_size_bytes=file_size,
                    file_hash=file_hash,
                    feature_count=1,
                    geometry_types=["RASTER_COVERAGE_POLYGON"],
                    detected_crs=crs_str,
                    bounds=wgs84_bounds,
                    raster_metadata=meta,
                    valid=True,
                    warnings=warnings,
                    errors=errors,
                )
        except Exception as exc:
            logger.error(f"GeoTIFF inspection failed on {filename}: {exc}", exc_info=True)
            return FileInspectionResult(
                detected_format="GEOTIFF",
                file_name=filename,
                file_size_bytes=file_size,
                file_hash=file_hash,
                valid=False,
                errors=[f"Raster inspection error: {str(exc)}"],
            )

    def parse(
        self,
        file_path: Path,
        manual_crs: Optional[str] = None
    ) -> List[NormalizedFeature]:
        """Creates a single NormalizedFeature containing the bounding box polygon coverage and metadata."""
        inspection = self.inspect(file_path, file_path.name)
        if not inspection.valid or not inspection.bounds:
            raise ValueError(f"Cannot parse invalid raster: {inspection.errors}")

        minx, miny, maxx, maxy = inspection.bounds
        coverage_polygon = box(minx, miny, maxx, maxy)

        meta = inspection.raster_metadata or {}
        feature = NormalizedFeature(
            source_id=file_path.stem,
            geometry=coverage_polygon,
            attributes=meta,
            original_geometry_type="Polygon",
            crs=CANONICAL_TARGET_CRS,
        )
        return [feature]
