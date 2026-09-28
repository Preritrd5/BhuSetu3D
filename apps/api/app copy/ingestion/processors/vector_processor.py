"""
BhuSetu 3D Vector Format Processor (GeoJSON, Shapefile, GeoPackage)
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 4: Data Ingestion & GIS Processing Pipeline
"""
import tempfile
from pathlib import Path
from typing import Optional, List, Dict, Any
import geopandas as gpd
import pandas as pd
import numpy as np
from app.ingestion.processors.base import BaseProcessor, NormalizedFeature
from app.ingestion.validators.file_validator import FileValidator
from app.ingestion.validators.crs_validator import CrsValidator, CANONICAL_TARGET_CRS
from app.schemas.ingestion import FileInspectionResult
from app.core.logging import logger


class VectorProcessor(BaseProcessor):
    """Parses and normalizes vector datasets (GeoJSON, ESRI Shapefile, GeoPackage)."""

    def _locate_spatial_file(self, file_path: Path) -> Path:
        """If file is a ZIP archive, extracts to temp directory and locates primary spatial file."""
        if file_path.suffix.lower() == ".zip":
            temp_extract = Path(tempfile.mkdtemp(prefix="bhusetu_zip_"))
            extracted = FileValidator.safe_extract_zip(file_path, temp_extract)
            # Locate .shp, .gpkg, or .geojson
            for ext in [".shp", ".gpkg", ".geojson", ".json"]:
                for p in extracted:
                    if p.suffix.lower() == ext:
                        return p
            raise ValueError("ZIP archive does not contain a supported spatial file (.shp, .gpkg, .geojson).")
        return file_path

    def inspect(self, file_path: Path, filename: str) -> FileInspectionResult:
        """Inspects vector file headers, feature count, CRS, geometry types, and bounds."""
        file_size = file_path.stat().st_size
        file_hash = FileValidator.calculate_sha256(file_path)
        actual_path = self._locate_spatial_file(file_path)

        warnings: List[str] = []
        errors: List[str] = []

        try:
            # Read first few features or info without loading entire massive file into memory if possible
            gdf = gpd.read_file(actual_path)
            feature_count = len(gdf)
            columns = [col for col in gdf.columns if col != "geometry"]
            geom_types = list({str(gt) for gt in gdf.geometry.dropna().geom_type})

            # Detect CRS
            detected_crs_str = None
            if gdf.crs is not None:
                detected_crs_str = gdf.crs.to_string()
            else:
                warnings.append("No embedded CRS detected. Dataset may require manual CRS specification.")

            # Calculate bounds
            bounds = None
            if not gdf.empty and gdf.geometry.notnull().any():
                total_bounds = gdf.total_bounds  # [minx, miny, maxx, maxy]
                bounds = [float(b) for b in total_bounds]

            fmt = FileValidator.detect_format(actual_path.name)

            return FileInspectionResult(
                detected_format=fmt,
                file_name=filename,
                file_size_bytes=file_size,
                file_hash=file_hash,
                feature_count=feature_count,
                geometry_types=geom_types,
                detected_crs=detected_crs_str,
                bounds=bounds,
                columns=columns,
                valid=len(errors) == 0,
                warnings=warnings,
                errors=errors,
            )
        except Exception as exc:
            logger.error(f"Vector inspection failed on {filename}: {exc}", exc_info=True)
            return FileInspectionResult(
                detected_format=FileValidator.detect_format(filename),
                file_name=filename,
                file_size_bytes=file_size,
                file_hash=file_hash,
                valid=False,
                errors=[f"Vector inspection error: {str(exc)}"],
            )

    def parse(
        self,
        file_path: Path,
        manual_crs: Optional[str] = None
    ) -> List[NormalizedFeature]:
        """Parses and reprojects features to canonical EPSG:4326."""
        actual_path = self._locate_spatial_file(file_path)
        gdf = gpd.read_file(actual_path)

        # CRS Resolution & Reprojection
        effective_crs, was_manual, crs_name = CrsValidator.resolve_crs(gdf.crs, manual_crs)
        if not CrsValidator.is_canonical_wgs84(effective_crs):
            gdf = gdf.set_crs(effective_crs, allow_override=True)
            gdf = gdf.to_crs(CANONICAL_TARGET_CRS)

        features: List[NormalizedFeature] = []

        for idx, row in gdf.iterrows():
            geom = row.geometry if pd.notnull(row.geometry) else None
            attrs: Dict[str, Any] = {}

            for col in gdf.columns:
                if col == "geometry":
                    continue
                val = row[col]
                # Convert numpy types to native python types
                if pd.isna(val):
                    attrs[col] = None
                elif isinstance(val, (np.integer, int)):
                    attrs[col] = int(val)
                elif isinstance(val, (np.floating, float)):
                    attrs[col] = float(val)
                elif isinstance(val, (np.bool_, bool)):
                    attrs[col] = bool(val)
                elif hasattr(val, "isoformat"):
                    attrs[col] = val.isoformat()
                else:
                    attrs[col] = str(val)

            # Detect potential source ID in attributes (ulpin, id, objectid, parcel_id, gid, survey_no)
            source_id = None
            for key in ["ulpin", "ulpin_2d", "id", "objectid", "gid", "parcel_id", "survey_no", "survey_number"]:
                if key in attrs and attrs[key] is not None:
                    source_id = str(attrs[key])
                    break
            if not source_id:
                source_id = str(idx + 1)

            features.append(
                NormalizedFeature(
                    source_id=source_id,
                    geometry=geom,
                    attributes=attrs,
                    original_geometry_type=geom.geom_type if geom else None,
                    crs=CANONICAL_TARGET_CRS,
                )
            )

        return features
