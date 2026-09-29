"use client";

/**
 * BhuSetu 3D 2D Map Workspace (MapLibre GL JS)
 * Integrated with PostGIS GeoJSON endpoints, dynamic multi-attribute filters,
 * natural-language / ULPIN search, and geodetic coordinate tracking.
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
import { API_BASE } from "@/lib/api/config";
import { ActiveLayersState } from "./LayerControl";
import { PropertyFilters } from "./FilterControl";

interface MapWorkspaceProps {
  activeLayers: ActiveLayersState;
  filters: PropertyFilters;
  searchQuery?: string;
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUUID(str?: string): boolean {
  return !!str && UUID_RE.test(str);
}

export const MapWorkspace: React.FC<MapWorkspaceProps> = ({
  activeLayers,
  filters,
  searchQuery,
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

    // Default center: Malleshwaram Zone Cadastral Extents [77.5714, 12.9976]
    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [77.5714, 12.9976],
      zoom: 14.5,
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
            ["==", ["get", "land_use"], "INSTITUTIONAL"],
            "#8b5cf6",
            ["==", ["get", "land_use"], "MIXED_USE"],
            "#ec4899",
            ["==", ["get", "land_use"], "OPEN_RESERVE"],
            "#10b981",
            "#0284c7", // Default Residential
          ],
          "fill-opacity": [
            "case",
            ["==", ["get", "id"], ""],
            0.75,
            0.4,
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
            `<div style="font-family: monospace; font-size: 11px; padding: 4px 6px; color: #f8fafc; background: #0f172a; border: 1px solid #334155; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
              <div style="font-weight: bold; color: #38bdf8;">${props.ulpin_2d || "PARCEL"}</div>
              <div style="color: #94a3b8;">${props.survey_number || "N/A"}</div>
              <div style="color: #cbd5e1;">Area: ${Number(props.recorded_area_sqm || 0).toLocaleString()} m²</div>
              <div style="color: #f59e0b; font-size: 10px; margin-top: 2px;">${props.land_use || "N/A"}</div>
            </div>`
          )
          .addTo(map);
      });

      map.on("mouseleave", "parcels-fill", () => {
        map.getCanvas().style.cursor = "";
        hoverPopup.remove();
      });

      // Click to select parcel
      map.on("click", "parcels-fill", (e) => {
        if (!e.features || e.features.length === 0) return;
        const parcelId = e.features[0].properties?.id;
        if (parcelId) {
          onSelectParcel(parcelId);
        }
      });

      // Track cursor position for footer
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

  // Viewport and Filter Data Fetcher
  const loadViewportData = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const bounds = map.getBounds();
    const minLon = bounds.getWest();
    const minLat = bounds.getSouth();
    const maxLon = bounds.getEast();
    const maxLat = bounds.getNorth();

    // Prevent massive unbounded queries at very low zoom levels unless a specific search is active
    if (map.getZoom() < 9 && !searchQuery?.trim() && !filters.cityId) {
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
      const isDemoToken = !token || token.startsWith("demo_token_");
      const headers: Record<string, string> = {};
      if (token && !isDemoToken) headers["Authorization"] = `Bearer ${token}`;

      const bboxStr = `${minLon.toFixed(5)},${minLat.toFixed(5)},${maxLon.toFixed(5)},${maxLat.toFixed(5)}`;

      let parcelUrl = `${API_BASE}/properties/geojson/parcels?limit=500`;

      // If not searching for a specific query, restrict to viewport bbox
      if (!searchQuery?.trim()) {
        parcelUrl += `&bbox=${bboxStr}`;
      }

      if (filters.cityId && isUUID(filters.cityId)) {
        parcelUrl += `&city_id=${filters.cityId}`;
      }
      if (filters.regionId && isUUID(filters.regionId)) {
        parcelUrl += `&region_id=${filters.regionId}`;
      }
      if (filters.landUse) {
        parcelUrl += `&land_use=${encodeURIComponent(filters.landUse)}`;
      }
      if (searchQuery && searchQuery.trim()) {
        parcelUrl += `&q=${encodeURIComponent(searchQuery.trim())}`;
      }

      // 1. Fetch Parcels
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

        // If a search or specific filter was executed and returned features, auto-fit view to them
        if ((searchQuery?.trim() || filters.regionId || filters.landUse) && count > 0) {
          try {
            const fitBounds = new LngLatBounds();
            let hasValidCoords = false;
            geojsonData.features.forEach((feat: any) => {
              const coords = feat.geometry?.coordinates;
              if (coords) {
                const extendCoords = (c: any) => {
                  if (typeof c[0] === "number" && typeof c[1] === "number") {
                    fitBounds.extend([c[0], c[1]]);
                    hasValidCoords = true;
                  } else if (Array.isArray(c)) {
                    c.forEach(extendCoords);
                  }
                };
                extendCoords(coords);
              }
            });
            if (hasValidCoords && !fitBounds.isEmpty()) {
              map.fitBounds(fitBounds, {
                padding: 60,
                maxZoom: 16.5,
                duration: 800,
              });
            }
          } catch (e) {
            console.warn("[MapWorkspace] Auto-fit bounds error:", e);
          }
        }
      }

      // 2. Fetch Buildings if layer is active
      if (activeLayers.buildings && map.getZoom() >= 12) {
        const bldUrl = `${API_BASE}/properties/geojson/buildings?bbox=${bboxStr}&limit=500`;
        const bRes = await fetch(bldUrl, { headers, signal: controller.signal });
        if (bRes.ok) {
          const bData = await bRes.json();
          const bSource = map.getSource("buildings-source") as GeoJSONSource;
          if (bSource) bSource.setData(bData);
        }
      }

      // 3. Fetch Infrastructure if layer is active
      if (activeLayers.infrastructure) {
        const infraUrl = `${API_BASE}/properties/geojson/infrastructure?bbox=${bboxStr}&limit=200`;
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
  }, [filters, searchQuery, activeLayers, token, onViewportMetricsChange]);

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

  // Immediate re-fetch whenever filters or search query change
  useEffect(() => {
    loadViewportData();
  }, [filters, searchQuery, loadViewportData]);

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

  // Update Selected Parcel Highlight in Amber
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
        ["==", ["get", "land_use"], "INSTITUTIONAL"],
        "#8b5cf6",
        ["==", ["get", "land_use"], "MIXED_USE"],
        "#ec4899",
        ["==", ["get", "land_use"], "OPEN_RESERVE"],
        "#10b981",
        "#0284c7",
      ]);
      map.setPaintProperty("parcels-fill", "fill-opacity", [
        "case",
        ["==", ["get", "id"], id],
        0.8,
        0.4,
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

  // Handle Zoom to Geometry (from search or inspector)
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
          duration: 1000,
        });
      }
    } catch (err) {
      console.error("Failed to fit bounds to geometry:", err);
    }
  }, [zoomTargetGeom]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0A0D0B]">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
