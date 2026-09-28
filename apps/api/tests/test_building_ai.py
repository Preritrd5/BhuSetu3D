"""
BhuSetu 3D AI Building Extraction & 3D Extrusion Unit Tests
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 6: AI Building Extraction + 3D Generation
"""
import pytest
import numpy as np
import shapely.geometry
from affine import Affine

from app.ai.models.unet import BuildingSegmentationUNet
from app.ai.pipeline.tiling import WindowedTiler, TileMerger
from app.ai.pipeline.vectorizer import BuildingVectorizer
from app.ai.pipeline.height_estimator import HeightEstimator
from app.ai.pipeline.extrusion_service import Building3DExtrusionService


def test_unet_model_initialization():
    """Verify U-Net model metadata and initialization."""
    model = BuildingSegmentationUNet(device="cpu")
    meta = model.get_metadata()
    assert meta["model_name"] == "building-segmentation-unet"
    assert meta["model_version"] == "v1.0"
    assert "PyTorch" in meta["framework"]


def test_unet_model_prediction_shape_and_range():
    """Verify model inference on synthetic image tile."""
    model = BuildingSegmentationUNet(device="cpu")
    # 256x256 RGB tile
    tile = (np.random.rand(256, 256, 3) * 255).astype(np.uint8)
    prob_mask = model.predict(tile)

    assert prob_mask.shape == (256, 256)
    assert np.all(prob_mask >= 0.0)
    assert np.all(prob_mask <= 1.0)


def test_windowed_tiler_and_merger():
    """Verify window generation and seamless tile blending."""
    tiler = WindowedTiler(tile_size=256, overlap=32)
    windows = tiler.generate_windows(height=512, width=512)
    assert len(windows) > 1

    merger = TileMerger(height=512, width=512)
    for y1, y2, x1, x2 in windows:
        th = y2 - y1
        tw = x2 - x1
        tile_pred = np.ones((th, tw), dtype=np.float32) * 0.8
        merger.add_tile(tile_pred, y1, y2, x1, x2)

    merged = merger.get_merged_result()
    assert merged.shape == (512, 512)
    assert np.allclose(merged, 0.8, atol=1e-2)


def test_vectorizer_contour_extraction():
    """Verify vectorization of probability mask into georeferenced polygons."""
    mask = np.zeros((300, 300), dtype=np.float32)
    # Add a high-confidence building footprint (80x80 square)
    mask[50:130, 50:130] = 0.95

    # Simple affine transform near Bengaluru
    transform = Affine.translation(77.5900, 12.9700) @ Affine.scale(0.00001, -0.00001)

    candidates = BuildingVectorizer.vectorize_mask(
        probability_mask=mask,
        affine_matrix=transform,
        source_crs="EPSG:4326",
        threshold=0.5,
        min_area_sqm=5.0
    )

    assert len(candidates) >= 1
    cand = candidates[0]
    assert cand.area_sqm > 10.0
    assert cand.confidence >= 0.5
    assert cand.footprint_geojson["type"] == "Polygon"


def test_height_estimator_attributes():
    """Verify height estimation from survey/attribute dictionaries."""
    poly = shapely.geometry.Polygon([(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)])

    # Test direct height attribute
    attrs = {"height": 18.5, "ground_elevation": 920.0}
    h, z, source, conf = HeightEstimator.estimate_height(poly, attributes=attrs)
    assert h == 18.5
    assert z == 920.0
    assert source == "SURVEY_ATTRIBUTE"
    assert conf > 0.9

    # Test floor count inference
    floor_attrs = {"floors": 4}
    fh, fz, fsource, fconf = HeightEstimator.estimate_height(poly, attributes=floor_attrs)
    assert fh == 12.0
    assert fsource == "INFERRED_FLOOR_COUNT"

    # Test illustrative fallback
    ih, iz, isource, iconf = HeightEstimator.estimate_height(poly, default_illustrative_height=15.0)
    assert ih == 15.0
    assert isource == "ILLUSTRATIVE_ASSUMED"


def test_extrusion_polyhedralsurfacez():
    """Verify 2D footprint extrusion into valid PostGIS PolyhedralSurfaceZ WKT."""
    poly = shapely.geometry.Polygon([
        (77.590, 12.970),
        (77.592, 12.970),
        (77.592, 12.972),
        (77.590, 12.972),
        (77.590, 12.970)
    ])

    wkt_elem, wkt_str, cesium_json = Building3DExtrusionService.extrude_footprint(
        polygon_2d=poly,
        ground_elevation=910.0,
        height=15.0,
        srid=4326
    )

    assert wkt_elem is not None
    assert wkt_str.startswith("POLYHEDRALSURFACE Z (")
    # A box has 6 faces (1 bottom, 1 top, 4 side quads)
    assert "910.0" in wkt_str
    assert "925.0" in wkt_str
    assert cesium_json["properties"]["extruded_height"] == 15.0
    assert cesium_json["properties"]["top_elevation"] == 925.0


def test_extrusion_negative_height_rejected():
    """Verify that non-positive height is rejected with ValueError."""
    poly = shapely.geometry.Polygon([(0, 0), (1, 0), (1, 1), (0, 1), (0, 0)])
    with pytest.raises(ValueError, match="strictly positive"):
        Building3DExtrusionService.extrude_footprint(poly, ground_elevation=100.0, height=-5.0)
