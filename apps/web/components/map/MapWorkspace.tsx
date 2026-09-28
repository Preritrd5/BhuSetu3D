"use client";

/**
 * BhuSetu 3D 2D Map Workspace (MapLibre GL JS)
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  Popup,
  GeoJSONSource,
  LngLatBounds,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAuth } from "@/hooks/useAuth";
import { CARTO_BASEMAP_CONFIG } from "@/lib/carto";
import { ActiveLayersState } from "./LayerControl";
import { PropertyFilters } from "./FilterControl";

interface MapWorkspaceProps {
  activeLayers: ActiveLayersState;
  filters: PropertyFilters;
  selectedParcelId: string | null;
  onSelectParcel: (parcelId: string) => void;
  onViewportMetricsChange: (metrics: {
    lng: number | null;
    lat: number | null;
    zoom: number;
    featureCount: number;
    isLoading: boolean;
  }) => void;
  zoomTargetGeom?: any;
}

// Authenticated CARTO dark style
const MAP_STYLE: any = {
  version: 8,
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: CARTO_BASEMAP_CONFIG.getMapLibreTiles(true),
      tileSize: 256,
      attribution: CARTO_BASEMAP_CONFIG.attribution,
    },
  },
  layers: [
    {
      id: "carto-dark-layer",
      type: "raster",
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const MapWorkspace: React.FC<MapWorkspaceProps> = ({
  activeLayers,
  filters,
  selectedParcelId,
  onSelectParcel,
  onViewportMetricsChange,
  zoomTargetGeom,
}) => {
  const { token } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hoverPopupRef = useRef<Popup | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center: Bengaluru / Karnataka (77.5946, 12.9716)
    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [77.5946, 12.9716],
      zoom: 13,
      pitchWithRotate: false,
      dragRotate: false,
    });

    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", () => {
      // 1. Regions Layer
      map.addSource("regions-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "regions-line",
        type: "line",
        source: "regions-source",
        paint: {
          "line-color": "#c084fc",
          "line-width": 2,
          "line-dasharray": [3, 2],
        },
      });

      // 2. Infrastructure Layer
      map.addSource("infrastructure-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "infrastructure-line",
        type: "line",
        source: "infrastructure-source",
        paint: {
          "line-color": "#34d399",
          "line-width": 2.5,
        },
      });

      // 3. Cadastral Parcels Source & Layers
      map.addSource("parcels-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "parcels-fill",
        type: "fill",
        source: "parcels-source",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "id"], ""],
            "#f59e0b",
            ["==", ["get", "land_use"], "COMMERCIAL"],
            "#059669",
            ["==", ["get", "land_use"], "INDUSTRIAL"],
            "#d97706",
            ["==", ["get", "land_use"], "AGRICULTURAL"],
            "#65a30d",
            "#0284c7", // Default Residential
          ],
          "fill-opacity": [
            "case",
            ["==", ["get", "id"], ""],
            0.75,
            0.35,
          ],
        },
      });

      map.addLayer({
        id: "parcels-line",
        type: "line",
        source: "parcels-source",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "id"], ""],
            "#fbbf24",
            "#38bdf8",
          ],
          "line-width": [
            "case",
            ["==", ["get", "id"], ""],
            3,
            1.2,
          ],
        },
      });

      // 4. Buildings Footprints Layer
      map.addSource("buildings-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "buildings-fill",
        type: "fill",
        source: "buildings-source",
        paint: {
          "fill-color": "#f59e0b",
          "fill-opacity": 0.65,
        },
      });
      map.addLayer({
        id: "buildings-line",
        type: "line",
        source: "buildings-source",
        paint: {
          "line-color": "#fef08a",
          "line-width": 1,
        },
      });

      // Hover Tooltip
      const hoverPopup = new Popup({
        closeButton: false,
        closeOnClick: false,
        className: "bhusetu-map-popup",
      });
      hoverPopupRef.current = hoverPopup;

      map.on("mousemove", "parcels-fill", (e) => {
        if (!e.features || e.features.length === 0) return;
        map.getCanvas().style.cursor = "pointer";

        const f = e.features[0];
        const props = f.properties || {};

        hoverPopup
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family: monospace; font-size: 11px; padding: 4px; color: #f8fafc; background: #0f172a; border: 1px solid #334155; border-radius: 4px;">
              <div style="font-weight: bold; color: #38bdf8;">${props.ulpin_2d || "PARCEL"}</div>
              <div style="color: #94a3b8;">Survey: ${props.survey_number || "N/A"}</div>
              <div style="color: #94a3b8;">Area: ${Number(props.recorded_area_sqm || 0).toLocaleString()} m²</div>
              <div style="color: #cbd5e1; font-size: 10px; margin-top: 2px;">Land Use: ${props.land_use || "N/A"}</div>
            </div>`
          )
          .addTo(map);
      });

      map.on("mouseleave", "parcels-fill", () => {
        map.getCanvas().style.cursor = "";
        hoverPopup.remove();
      });

      // Click to select
      map.on("click", "parcels-fill", (e) => {
        if (!e.features || e.features.length === 0) return;
        const parcelId = e.features[0].properties?.id;
        if (parcelId) {
          onSelectParcel(parcelId);
        }
      });

      // Track cursor position
      map.on("mousemove", (e) => {
        onViewportMetricsChange({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
          zoom: map.getZoom(),
          featureCount,
          isLoading,
        });
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Viewport-based Bounding Box Query with Debounce
  const loadViewportData = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const bounds = map.getBounds();
    const minLon = bounds.getWest();
    const minLat = bounds.getSouth();
    const maxLon = bounds.getEast();
    const maxLat = bounds.getNorth();

    // Prevent massive unbounded queries at very low zoom levels
    if (map.getZoom() < 10) {
      setFeatureCount(0);
      onViewportMetricsChange({
        lng: map.getCenter().lng,
        lat: map.getCenter().lat,
        zoom: map.getZoom(),
        featureCount: 0,
        isLoading: false,
      });
      return;
    }

    // Cancel in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const bboxStr = `${minLon.toFixed(5)},${minLat.toFixed(5)},${maxLon.toFixed(5)},${maxLat.toFixed(5)}`;

      let parcelUrl = `http://localhost:8000/api/v1/properties/geojson/parcels?bbox=${bboxStr}&limit=500`;
      if (filters.cityId) parcelUrl += `&city_id=${filters.cityId}`;
      if (filters.regionId) parcelUrl += `&region_id=${filters.regionId}`;
      if (filters.landUse) parcelUrl += `&land_use=${encodeURIComponent(filters.landUse)}`;

      // Fetch parcels
      const res = await fetch(parcelUrl, { headers, signal: controller.signal });
      if (res.ok) {
        const geojsonData = await res.json();
        const source = map.getSource("parcels-source") as GeoJSONSource;
        if (source) {
          source.setData(geojsonData);
        }
        const count = geojsonData.features?.length || 0;
        setFeatureCount(count);
        onViewportMetricsChange({
          lng: map.getCenter().lng,
          lat: map.getCenter().lat,
          zoom: map.getZoom(),
          featureCount: count,
          isLoading: false,
        });
      }

      // Fetch buildings if layer is active
      if (activeLayers.buildings && map.getZoom() >= 13) {
        const bldUrl = `http://localhost:8000/api/v1/properties/geojson/buildings?bbox=${bboxStr}&limit=500`;
        const bRes = await fetch(bldUrl, { headers, signal: controller.signal });
        if (bRes.ok) {
          const bData = await bRes.json();
          const bSource = map.getSource("buildings-source") as GeoJSONSource;
          if (bSource) bSource.setData(bData);
        }
      }

      // Fetch infrastructure if layer is active
      if (activeLayers.infrastructure) {
        const infraUrl = `http://localhost:8000/api/v1/properties/geojson/infrastructure?bbox=${bboxStr}&limit=200`;
        const iRes = await fetch(infraUrl, { headers, signal: controller.signal });
        if (iRes.ok) {
          const iData = await iRes.json();
          const iSource = map.getSource("infrastructure-source") as GeoJSONSource;
          if (iSource) iSource.setData(iData);
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Failed to load viewport data:", err);
      }
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeLayers, token]);

  // Hook map moveend event
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let timeoutId: NodeJS.Timeout;
    const handleMoveEnd = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        loadViewportData();
      }, 350);
    };

    map.on("moveend", handleMoveEnd);

    // Initial load when style is ready
    if (map.isStyleLoaded()) {
      loadViewportData();
    } else {
      map.once("load", loadViewportData);
    }

    return () => {
      map.off("moveend", handleMoveEnd);
      clearTimeout(timeoutId);
    };
  }, [loadViewportData]);

  // Handle Layer Visibility Toggles
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer("parcels-fill")) {
      map.setLayoutProperty("parcels-fill", "visibility", activeLayers.parcels ? "visible" : "none");
      map.setLayoutProperty("parcels-line", "visibility", activeLayers.parcels ? "visible" : "none");
    }
    if (map.getLayer("buildings-fill")) {
      map.setLayoutProperty("buildings-fill", "visibility", activeLayers.buildings ? "visible" : "none");
      map.setLayoutProperty("buildings-line", "visibility", activeLayers.buildings ? "visible" : "none");
    }
    if (map.getLayer("regions-line")) {
      map.setLayoutProperty("regions-line", "visibility", activeLayers.regions ? "visible" : "none");
    }
    if (map.getLayer("infrastructure-line")) {
      map.setLayoutProperty("infrastructure-line", "visibility", activeLayers.infrastructure ? "visible" : "none");
    }
  }, [activeLayers]);

  // Update Selected Parcel Highlight
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const id = selectedParcelId || "";

    if (map.getLayer("parcels-fill")) {
      map.setPaintProperty("parcels-fill", "fill-color", [
        "case",
        ["==", ["get", "id"], id],
        "#f59e0b", // Amber when selected
        ["==", ["get", "land_use"], "COMMERCIAL"],
        "#059669",
        ["==", ["get", "land_use"], "INDUSTRIAL"],
        "#d97706",
        ["==", ["get", "land_use"], "AGRICULTURAL"],
        "#65a30d",
        "#0284c7",
      ]);
      map.setPaintProperty("parcels-fill", "fill-opacity", [
        "case",
        ["==", ["get", "id"], id],
        0.75,
        0.35,
      ]);
      map.setPaintProperty("parcels-line", "line-color", [
        "case",
        ["==", ["get", "id"], id],
        "#fbbf24",
        "#38bdf8",
      ]);
      map.setPaintProperty("parcels-line", "line-width", [
        "case",
        ["==", ["get", "id"], id],
        3.5,
        1.2,
      ]);
    }
  }, [selectedParcelId]);

  // Handle Zoom to Geometry
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !zoomTargetGeom) return;

    try {
      const bounds = new LngLatBounds();
      const coords = zoomTargetGeom.coordinates;

      const extendCoords = (c: any) => {
        if (typeof c[0] === "number" && typeof c[1] === "number") {
          bounds.extend([c[0], c[1]]);
        } else if (Array.isArray(c)) {
          c.forEach(extendCoords);
        }
      };

      extendCoords(coords);

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: 80,
          maxZoom: 17,
          duration: 1200,
        });
      }
    } catch (err) {
      console.error("Failed to fit bounds to geometry:", err);
    }
  }, [zoomTargetGeom]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-canvas">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
