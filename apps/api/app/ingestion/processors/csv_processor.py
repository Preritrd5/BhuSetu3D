"""
BhuSetu 3D Tabular / CSV Spatial Processor
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 4: Data Ingestion & GIS Processing Pipeline
"""
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
import pandas as pd
import numpy as np
from shapely import wkt
from shapely.geometry import Point
from pyproj import Transformer
from app.ingestion.processors.base import BaseProcessor, NormalizedFeature
from app.ingestion.validators.file_validator import FileValidator
from app.ingestion.validators.crs_validator import CrsValidator, CANONICAL_TARGET_CRS
from app.schemas.ingestion import FileInspectionResult
from app.core.logging import logger


class CsvProcessor(BaseProcessor):
    """Parses tabular CSV files containing spatial coordinates or WKT geometries."""

    LAT_CANDIDATES = ["latitude", "lat", "point_y", "y", "northing", "coord_y"]
    LON_CANDIDATES = ["longitude", "lon", "lng", "point_x", "x", "easting", "coord_x"]
    WKT_CANDIDATES = ["wkt", "geometry", "geom", "the_geom", "shape"]

    def _find_column(self, columns: List[str], candidates: List[str]) -> Optional[str]:
        """Finds matching column ignoring case and whitespace."""
        col_map = {c.strip().lower(): c for c in columns}
        for cand in candidates:
            if cand.lower() in col_map:
                return col_map[cand.lower()]
        return None

    def inspect(self, file_path: Path, filename: str) -> FileInspectionResult:
        """Inspects CSV structure, column names, coordinates, and row count."""
        file_size = file_path.stat().st_size
        file_hash = FileValidator.calculate_sha256(file_path)

        warnings: List[str] = []
        errors: List[str] = []

        try:
            df = pd.read_csv(file_path, nrows=100)
            columns = list(df.columns)
            total_rows = sum(1 for _ in open(file_path, "r", encoding="utf-8", errors="ignore")) - 1

            lat_col = self._find_column(columns, self.LAT_CANDIDATES)
            lon_col = self._find_column(columns, self.LON_CANDIDATES)
            wkt_col = self._find_column(columns, self.WKT_CANDIDATES)

            geom_types = []
            if wkt_col:
                geom_types.append("WKT_GEOMETRY")
            elif lat_col and lon_col:
                geom_types.append("POINT")
            else:
                warnings.append("No spatial columns (Lat/Lon or WKT) identified. Records will be treated as non-spatial attributes.")

            return FileInspectionResult(
                detected_format="CSV",
                file_name=filename,
                file_size_bytes=file_size,
                file_hash=file_hash,
                feature_count=max(0, total_rows),
                geometry_types=geom_types,
                detected_crs="EPSG:4326" if (lat_col and lon_col) else None,
                columns=columns,
                valid=True,
                warnings=warnings,
                errors=errors,
            )
        except Exception as exc:
            return FileInspectionResult(
                detected_format="CSV",
                file_name=filename,
                file_size_bytes=file_size,
                file_hash=file_hash,
                valid=False,
                errors=[f"CSV inspection error: {str(exc)}"],
            )

    def parse(
        self,
        file_path: Path,
        manual_crs: Optional[str] = None
    ) -> List[NormalizedFeature]:
        """Parses CSV rows and constructs Point or WKT geometries."""
        df = pd.read_csv(file_path)
        columns = list(df.columns)

        lat_col = self._find_column(columns, self.LAT_CANDIDATES)
        lon_col = self._find_column(columns, self.LON_CANDIDATES)
        wkt_col = self._find_column(columns, self.WKT_CANDIDATES)

        # Coordinate transformer if manual CRS is non-WGS84
        transformer = None
        if manual_crs:
            crs_obj = CrsValidator.parse_crs(manual_crs)
            if crs_obj and not CrsValidator.is_canonical_wgs84(crs_obj):
                transformer = Transformer.from_crs(crs_obj, CANONICAL_TARGET_CRS, always_xy=True)

        features: List[NormalizedFeature] = []

        for idx, row in df.iterrows():
            geom = None
            attrs: Dict[str, Any] = {}

            for col in columns:
                val = row[col]
                if pd.isna(val):
                    attrs[col] = None
                elif isinstance(val, (np.integer, int)):
                    attrs[col] = int(val)
                elif isinstance(val, (np.floating, float)):
                    attrs[col] = float(val)
                else:
                    attrs[col] = str(val)

            # Construct geometry
            if wkt_col and pd.notnull(row[wkt_col]):
                try:
                    raw_geom = wkt.loads(str(row[wkt_col]))
                    geom = raw_geom
                except Exception as e:
                    logger.warning(f"Failed to parse WKT at row {idx}: {e}")
            elif lat_col and lon_col and pd.notnull(row[lat_col]) and pd.notnull(row[lon_col]):
                try:
                    lat_val = float(row[lat_col])
                    lon_val = float(row[lon_col])
                    if transformer:
                        lon_val, lat_val = transformer.transform(lon_val, lat_val)
                    geom = Point(lon_val, lat_val)
                except Exception as e:
                    logger.warning(f"Failed to create Point at row {idx}: {e}")

            source_id = None
            for key in ["ulpin", "id", "survey_no", "code", "parcel_id"]:
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
