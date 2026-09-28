"""
BhuSetu 3D 2D to 3D Building Extrusion Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 6: AI Building Extraction + 3D Generation
"""
from typing import Tuple, List, Dict, Any, Optional
import shapely.geometry
from shapely.geometry import Polygon, MultiPolygon
from shapely.geometry.base import BaseGeometry
from geoalchemy2.elements import WKTElement

from app.core.logging import logger


class Building3DExtrusionService:
    """
    Transforms 2D building footprints into authoritative PostGIS PolyhedralSurfaceZ 3D volumes.
    """

    @classmethod
    def extrude_footprint(
        cls,
        polygon_2d: BaseGeometry,
        ground_elevation: float,
        height: float,
        srid: int = 4326
    ) -> Tuple[Optional[WKTElement], Optional[str], Optional[Dict[str, Any]]]:
        """
        Extrudes a 2D polygon into a closed 3D solid PolyhedralSurfaceZ.
        
        Returns:
            (wkt_element, wkt_str, cesium_3d_geojson)
        """
        if polygon_2d is None or polygon_2d.is_empty:
            raise ValueError("Cannot extrude empty or null geometry.")

        if height <= 0:
            raise ValueError(f"Extrusion height must be strictly positive, got {height}m.")

        # Extract exterior ring coordinates
        if isinstance(polygon_2d, MultiPolygon):
            poly = list(polygon_2d.geoms)[0]
        elif isinstance(polygon_2d, Polygon):
            poly = polygon_2d
        else:
            raise ValueError(f"Expected Polygon geometry type, got {polygon_2d.geom_type}")

        raw_coords = list(poly.exterior.coords)
        if len(raw_coords) < 4:
            raise ValueError("Polygon exterior ring must have at least 4 coordinates (triangle + closure).")

        # Ensure ring is closed
        if raw_coords[0] != raw_coords[-1]:
            raw_coords.append(raw_coords[0])

        z_base = float(ground_elevation)
        z_top = float(ground_elevation + height)

        n_pts = len(raw_coords)
        faces_wkt_parts = []

        # 1. Bottom Face (at ground elevation)
        bottom_pts = [f"{x} {y} {z_base}" for x, y in raw_coords]
        faces_wkt_parts.append(f"(({', '.join(bottom_pts)}))")

        # 2. Top Roof Face (at top elevation - reversed for outward normal orientation)
        top_coords = raw_coords[::-1]
        top_pts = [f"{x} {y} {z_top}" for x, y in top_coords]
        faces_wkt_parts.append(f"(({', '.join(top_pts)}))")

        # 3. Side Wall Quad Faces
        for i in range(n_pts - 1):
            x1, y1 = raw_coords[i]
            x2, y2 = raw_coords[i + 1]

            wall_pts = [
                f"{x1} {y1} {z_base}",
                f"{x2} {y2} {z_base}",
                f"{x2} {y2} {z_top}",
                f"{x1} {y1} {z_top}",
                f"{x1} {y1} {z_base}",
            ]
            faces_wkt_parts.append(f"(({', '.join(wall_pts)}))")

        # Assemble canonical PostGIS PolyhedralSurfaceZ WKT
        all_faces_str = ", ".join(faces_wkt_parts)
        polyhedral_wkt = f"POLYHEDRALSURFACE Z ({all_faces_str})"

        wkt_elem = WKTElement(polyhedral_wkt, srid=srid)

        # Construct lightweight GeoJSON representation for CesiumJS client rendering
        cesium_geojson = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[x, y] for x, y in raw_coords]]
            },
            "properties": {
                "base_elevation": z_base,
                "extruded_height": height,
                "top_elevation": z_top,
            }
        }

        return wkt_elem, polyhedral_wkt, cesium_geojson
