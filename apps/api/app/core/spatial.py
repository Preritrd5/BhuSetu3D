"""
BhuSetu 3D Spatial Utilities & GeoJSON Serialization
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Integration + Property Data Model
"""
from typing import Tuple, Dict, Any, Optional
import json
from fastapi import HTTPException, status
from geoalchemy2.shape import to_shape, from_shape
from geoalchemy2.elements import WKBElement
import shapely.geometry
from shapely.geometry.base import BaseGeometry
from app.core.logging import logger


def parse_bbox(bbox_str: str) -> Tuple[float, float, float, float]:
    """
    Parses and strictly validates a bounding box query string: 'min_lon,min_lat,max_lon,max_lat'.
    Ensures valid geographic range (WGS84 EPSG:4326) and sensible geographic extent.
    """
    if not bbox_str or not bbox_str.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bbox parameter cannot be empty."
        )

    parts = [p.strip() for p in bbox_str.split(",")]
    if len(parts) != 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bounding box must contain exactly 4 comma-separated numbers: min_lon,min_lat,max_lon,max_lat"
        )

    try:
        min_lon = float(parts[0])
        min_lat = float(parts[1])
        max_lon = float(parts[2])
        max_lat = float(parts[3])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bounding box coordinates must be valid floating-point numbers."
        )

    # Validate coordinate intervals
    if not (-180.0 <= min_lon <= 180.0 and -180.0 <= max_lon <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Longitude must be between -180.0 and +180.0 degrees."
        )

    if not (-90.0 <= min_lat <= 90.0 and -90.0 <= max_lat <= 90.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude must be between -90.0 and +90.0 degrees."
        )

    if min_lon >= max_lon:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_lon must be strictly less than max_lon."
        )

    if min_lat >= max_lat:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_lat must be strictly less than max_lat."
        )

    # Prevent massive unbounded spatial queries spanning the entire globe
    if (max_lon - min_lon) > 10.0 or (max_lat - min_lat) > 10.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bounding box extent exceeds maximum allowable range of 10.0 degrees."
        )

    return (min_lon, min_lat, max_lon, max_lat)


def geometry_to_geojson(geom: Any) -> Optional[Dict[str, Any]]:
    """
    Serializes a GeoAlchemy2 WKBElement or Shapely geometry to a standard GeoJSON mapping.
    """
    if geom is None:
        return None

    try:
        if isinstance(geom, WKBElement):
            shapely_geom = to_shape(geom)
            return shapely.geometry.mapping(shapely_geom)
        elif isinstance(geom, BaseGeometry):
            return shapely.geometry.mapping(geom)
        elif isinstance(geom, dict):
            return geom
        elif isinstance(geom, str):
            # Check if JSON string
            if geom.startswith("{"):
                return json.loads(geom)
            # Try parsing as WKT
            shapely_geom = shapely.wkt.loads(geom)
            return shapely.geometry.mapping(shapely_geom)
    except Exception as e:
        logger.warning(f"Error converting geometry to GeoJSON: {e}")
        return None

    return None


def geojson_to_wkb(geojson_dict: Dict[str, Any], srid: int = 4326) -> WKBElement:
    """
    Validates GeoJSON dictionary and transforms it to a GeoAlchemy2 WKBElement with the specified SRID.
    """
    try:
        shapely_geom = shapely.geometry.shape(geojson_dict)
        if not shapely_geom.is_valid:
            logger.warning("Input geometry is structurally invalid; applying buffer(0) fix")
            shapely_geom = shapely_geom.buffer(0)
        return from_shape(shapely_geom, srid=srid)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid GeoJSON geometry representation: {str(e)}"
        )
