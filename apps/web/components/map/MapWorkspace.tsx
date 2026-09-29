"use client";

/**
 * BhuSetu 3D 2D Map Workspace (MapLibre GL JS)
 * Integrated with PostGIS GeoJSON endpoints, dynamic multi-attribute filters,
 * natural-language / ULPIN search, and vibrant colorful cartography with basemap styles.
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
import { CARTO_BASEMAP_CONFIG, BasemapStyle } from "@/lib/carto";
import { API_BASE } from "@/lib/api/config";
import { ActiveLayersState } from "./LayerControl";
import { PropertyFilters } from "./FilterControl";
import { Palette, Moon, Sun, Layers } from "lucide-react";

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUUID(str?: string): boolean {
  return !!str && UUID_RE.test(str);
}

function getStyleForBasemap(style: BasemapStyle) {
  let tiles: string[];
  if (style === "voyager") {
    tiles = CARTO_BASEMAP_CONFIG.getVoyagerTiles(true);
  } else if (style === "dark") {
    tiles = CARTO_BASEMAP_CONFIG.getDarkTiles(true);
  } else {
    tiles = CARTO_BASEMAP_CONFIG.getPositronTiles(true);
  }

  return {
    version: 8 as const,
    sources: {
      "carto-raster-source": {
        type: "raster" as const,
        tiles,
        tileSize: 256,
        attribution: CARTO_BASEMAP_CONFIG.attribution,
      },
    },
    layers: [
      {
        id: "carto-raster-layer",
        type: "raster" as const,
        source: "carto-raster-source",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };
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

  const [basemapStyle, setBasemapStyle] = useState<BasemapStyle>("voyager");
  const [showLegend, setShowLegend] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center: Malleshwaram Zone Cadastral Extents [77.5714, 12.9976]
    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: getStyleForBasemap("voyager"),
      center: [77.5714, 12.9976],
      zoom: 14.5,
      pitchWithRotate: false,
      dragRotate: false,
    });

    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", () => {
      // 1. Regions Layer (Electric Purple Boundary)
      map.addSource("regions-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "regions-line",
        type: "line",
        source: "regions-source",
        paint: {
          "line-color": "#8b5cf6",
          "line-width": 2.5,
          "line-dasharray": [4, 2],
        },
      });

      // 2. Infrastructure Layer (Vibrant Cyan / Emerald)
      map.addSource("infrastructure-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "infrastructure-line",
        type: "line",
        source: "infrastructure-source",
        paint: {
          "line-color": "#06b6d4",
          "line-width": 3,
        },
      });

      // 3. Cadastral Parcels Source & Layers (Vibrant Land Use Palette)
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
            "#f59e0b", // Radiant Amber
            ["==", ["get", "land_use"], "RESIDENTIAL"],
            "#0284c7", // Vivid Sky Blue
            ["==", ["get", "land_use"], "INSTITUTIONAL"],
            "#8b5cf6", // Royal Purple
            ["==", ["get", "land_use"], "MIXED_USE"],
            "#ec4899", // Vibrant Hot Pink
            ["==", ["get", "land_use"], "OPEN_RESERVE"],
            "#10b981", // Lush Emerald Green
            ["==", ["get", "land_use"], "INDUSTRIAL"],
            "#f97316", // Terracotta Flame
            ["==", ["get", "land_use"], "AGRICULTURAL"],
            "#84cc16", // Sunny Lime
            ["==", ["get", "land_use"], "PUBLIC"],
            "#06b6d4", // Turquoise
            "#3b82f6", // Default Blue
          ],
          "fill-opacity": [
            "case",
            ["==", ["get", "id"], ""],
            0.85,
            0.62,
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
            "#ffe066",
            ["==", ["get", "land_use"], "COMMERCIAL"],
            "#b45309",
            ["==", ["get", "land_use"], "RESIDENTIAL"],
            "#0369a1",
            ["==", ["get", "land_use"], "INSTITUTIONAL"],
            "#6d28d9",
            ["==", ["get", "land_use"], "MIXED_USE"],
            "#be185d",
            ["==", ["get", "land_use"], "OPEN_RESERVE"],
            "#047857",
            ["==", ["get", "land_use"], "INDUSTRIAL"],
            "#c2410c",
            ["==", ["get", "land_use"], "AGRICULTURAL"],
            "#4d7c0f",
            "#1d4ed8",
          ],
          "line-width": [
            "case",
            ["==", ["get", "id"], ""],
            4,
            2,
          ],
        },
      });

      // 4. Buildings Footprints Layer (Extruded Amber / Warm Gold)
      map.addSource("buildings-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "buildings-fill",
        type: "fill",
        source: "buildings-source",
        paint: {
          "fill-color": "#fbbf24",
          "fill-opacity": 0.8,
        },
      });
      map.addLayer({
        id: "buildings-line",
        type: "line",
        source: "buildings-source",
        paint: {
          "line-color": "#d97706",
          "line-width": 1.5,
        },
      });

      // Hover Tooltip with Rich Colors
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
            `<div style="font-family: monospace; font-size: 11px; padding: 6px 8px; color: #f8fafc; background: #0f172a; border: 1.5px solid #38bdf8; border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);">
              <div style="font-weight: 800; font-size: 12px; color: #38bdf8; letter-spacing: 0.5px;">${props.ulpin_2d || "PARCEL"}</div>
              <div style="color: #cbd5e1; margin-top: 2px;">Survey No: <span style="color: #fff; font-weight: 600;">${props.survey_number || "N/A"}</span></div>
              <div style="color: #94a3b8;">Recorded Area: <span style="color: #34d399; font-weight: 600;">${Number(props.recorded_area_sqm || 0).toLocaleString()} m²</span></div>
              <div style="display: inline-block; margin-top: 4px; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: #1e293b; color: #f59e0b; border: 1px solid #f59e0b40;">${props.land_use || "N/A"}</div>
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

  // Switch basemap raster tiles without destroying cadastral vector overlays
  const handleBasemapChange = (style: BasemapStyle) => {
    setBasemapStyle(style);
    const map = mapRef.current;
    if (!map) return;

    let tiles: string[];
    if (style === "voyager") {
      tiles = CARTO_BASEMAP_CONFIG.getVoyagerTiles(true);
    } else if (style === "dark") {
      tiles = CARTO_BASEMAP_CONFIG.getDarkTiles(true);
    } else {
      tiles = CARTO_BASEMAP_CONFIG.getPositronTiles(true);
    }

    const source = map.getSource("carto-raster-source") as any;
    if (source && typeof source.setTiles === "function") {
      source.setTiles(tiles);
    }
  };

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

        // Auto-fit view when a query or filter is active and returns parcels
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

  // Update Selected Parcel Highlight in Amber Gold
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const id = selectedParcelId || "";

    if (map.getLayer("parcels-fill")) {
      map.setPaintProperty("parcels-fill", "fill-color", [
        "case",
        ["==", ["get", "id"], id],
        "#fbbf24", // Glowing Gold when selected
        ["==", ["get", "land_use"], "COMMERCIAL"],
        "#f59e0b",
        ["==", ["get", "land_use"], "RESIDENTIAL"],
        "#0284c7",
        ["==", ["get", "land_use"], "INSTITUTIONAL"],
        "#8b5cf6",
        ["==", ["get", "land_use"], "MIXED_USE"],
        "#ec4899",
        ["==", ["get", "land_use"], "OPEN_RESERVE"],
        "#10b981",
        ["==", ["get", "land_use"], "INDUSTRIAL"],
        "#f97316",
        ["==", ["get", "land_use"], "AGRICULTURAL"],
        "#84cc16",
        ["==", ["get", "land_use"], "PUBLIC"],
        "#06b6d4",
        "#3b82f6",
      ]);
      map.setPaintProperty("parcels-fill", "fill-opacity", [
        "case",
        ["==", ["get", "id"], id],
        0.88,
        0.62,
      ]);
      map.setPaintProperty("parcels-line", "line-color", [
        "case",
        ["==", ["get", "id"], id],
        "#ffffff",
        ["==", ["get", "land_use"], "COMMERCIAL"],
        "#b45309",
        ["==", ["get", "land_use"], "RESIDENTIAL"],
        "#0369a1",
        ["==", ["get", "land_use"], "INSTITUTIONAL"],
        "#6d28d9",
        ["==", ["get", "land_use"], "MIXED_USE"],
        "#be185d",
        ["==", ["get", "land_use"], "OPEN_RESERVE"],
        "#047857",
        ["==", ["get", "land_use"], "INDUSTRIAL"],
        "#c2410c",
        ["==", ["get", "land_use"], "AGRICULTURAL"],
        "#4d7c0f",
        "#1d4ed8",
      ]);
      map.setPaintProperty("parcels-line", "line-width", [
        "case",
        ["==", ["get", "id"], id],
        4,
        2,
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
      {/* MapLibre Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Right Basemap Style Switcher */}
      <div className="absolute top-4 right-4 z-20 flex items-center bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.12)] rounded-[8px] p-1 shadow-2xl text-xs font-mono select-none">
        <button
          type="button"
          onClick={() => handleBasemapChange("voyager")}
          className={`px-2.5 py-1 rounded-[6px] flex items-center gap-1.5 transition-all cursor-pointer ${
            basemapStyle === "voyager"
              ? "bg-[#23847D] text-[#F4F0E8] font-bold shadow-md"
              : "text-[#77867C] hover:text-[#F4F0E8]"
          }`}
          title="Vibrant Colorful Cartography"
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Colorful</span>
        </button>

        <button
          type="button"
          onClick={() => handleBasemapChange("dark")}
          className={`px-2.5 py-1 rounded-[6px] flex items-center gap-1.5 transition-all cursor-pointer ${
            basemapStyle === "dark"
              ? "bg-[#23847D] text-[#F4F0E8] font-bold shadow-md"
              : "text-[#77867C] hover:text-[#F4F0E8]"
          }`}
          title="Dark Mode Basemap"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => handleBasemapChange("positron")}
          className={`px-2.5 py-1 rounded-[6px] flex items-center gap-1.5 transition-all cursor-pointer ${
            basemapStyle === "positron"
              ? "bg-[#23847D] text-[#F4F0E8] font-bold shadow-md"
              : "text-[#77867C] hover:text-[#F4F0E8]"
          }`}
          title="Light Positron Basemap"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Light</span>
        </button>
      </div>

      {/* Bottom Right Floating Land Use Color Legend */}
      <div className="absolute bottom-9 right-4 z-20 bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.12)] rounded-[8px] p-2.5 shadow-2xl text-xs font-mono max-w-xs select-none">
        <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(244,240,232,0.08)] mb-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#A2B3A8]">
            <Layers className="w-3 h-3 text-[#C47B50]" />
            <span>Land Use Legend</span>
          </div>
          <button
            type="button"
            onClick={() => setShowLegend(!showLegend)}
            className="text-[10px] text-[#77867C] hover:text-[#F4F0E8] cursor-pointer"
          >
            {showLegend ? "Hide" : "Show"}
          </button>
        </div>

        {showLegend && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[3px] bg-[#f59e0b] border border-[#b45309] shrink-0" />
              <span className="text-[#F4F0E8] truncate">Commercial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[3px] bg-[#0284c7] border border-[#0369a1] shrink-0" />
              <span className="text-[#F4F0E8] truncate">Residential</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[3px] bg-[#8b5cf6] border border-[#6d28d9] shrink-0" />
              <span className="text-[#F4F0E8] truncate">Institutional</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[3px] bg-[#ec4899] border border-[#be185d] shrink-0" />
              <span className="text-[#F4F0E8] truncate">Mixed Use</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[3px] bg-[#10b981] border border-[#047857] shrink-0" />
              <span className="text-[#F4F0E8] truncate">Open Reserve</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[3px] bg-[#f97316] border border-[#c2410c] shrink-0" />
              <span className="text-[#F4F0E8] truncate">Industrial</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
