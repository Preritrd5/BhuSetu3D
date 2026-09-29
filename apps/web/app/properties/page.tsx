"use client";

/**
 * BhuSetu 3D 2D Parcel Mapping & Property Explorer Workspace
 * Evidence-Backed 3D Property Intelligence Platform
 * Supports dynamic PostGIS filtering, search by ULPIN / Survey Number,
 * layers control, and property inspection.
 */
import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { SpatialLoadingRoller } from "@/components/common/SpatialLoadingRoller";
import { MapWorkspace } from "@/components/map/MapWorkspace";
import { PropertyInspector } from "@/components/map/PropertyInspector";
import { SearchControl, PropertySearchResultItem } from "@/components/map/SearchControl";
import { LayerControl, ActiveLayersState } from "@/components/map/LayerControl";
import { FilterControl, PropertyFilters } from "@/components/map/FilterControl";
import { MapStatusFooter } from "@/components/map/MapStatusFooter";
import {
  MapPin,
  Layers,
  Filter,
  ShieldCheck,
  Building2,
  X,
  Search,
} from "lucide-react";

function PropertiesExplorerContent() {
  const searchParams = useSearchParams();
  const urlParcelId = searchParams.get("parcel");

  // Selection & Inspector State
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(urlParcelId || null);
  const [zoomTargetGeom, setZoomTargetGeom] = useState<any>(null);

  // Search Query State
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Layers State
  const [activeLayers, setActiveLayers] = useState<ActiveLayersState>({
    parcels: true,
    buildings: true,
    regions: true,
    infrastructure: false,
  });

  // Filters State
  const [filters, setFilters] = useState<PropertyFilters>({});

  // Floating Control Drawer States
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Viewport Metrics for Status Footer
  const [viewportMetrics, setViewportMetrics] = useState({
    lng: null as number | null,
    lat: null as number | null,
    zoom: 14.5,
    featureCount: 0,
    isLoading: false,
  });

  // Synchronize selection if URL changes
  useEffect(() => {
    if (urlParcelId && urlParcelId !== selectedParcelId) {
      setSelectedParcelId(urlParcelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlParcelId]);

  const handleSelectParcel = (id: string) => {
    setSelectedParcelId(id);
  };

  const handleSelectPropertyFromSearch = (item: PropertySearchResultItem) => {
    if (!item || !item.id) {
      setSelectedParcelId(null);
      return;
    }
    setSelectedParcelId(item.id);
    setSearchQuery(item.ulpin_2d || item.survey_number);

    if (item.bbox) {
      const [minx, miny, maxx, maxy] = item.bbox;
      setZoomTargetGeom({
        type: "Polygon",
        coordinates: [
          [
            [minx, miny],
            [maxx, miny],
            [maxx, maxy],
            [minx, maxy],
            [minx, miny],
          ],
        ],
      });
    } else if (item.center) {
      const [lon, lat] = item.center;
      setZoomTargetGeom({
        type: "Polygon",
        coordinates: [
          [
            [lon - 0.0015, lat - 0.0015],
            [lon + 0.0015, lat - 0.0015],
            [lon + 0.0015, lat + 0.0015],
            [lon - 0.0015, lat + 0.0015],
            [lon - 0.0015, lat - 0.0015],
          ],
        ],
      });
    }
  };

  const handleSearchSubmit = (q: string) => {
    setSearchQuery(q);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleLocationFocus = useCallback((coords: [number, number]) => {
    const [lon, lat] = coords;
    setZoomTargetGeom({
      type: "Polygon",
      coordinates: [
        [
          [lon - 0.004, lat - 0.004],
          [lon + 0.004, lat - 0.004],
          [lon + 0.004, lat + 0.004],
          [lon - 0.004, lat + 0.004],
          [lon - 0.004, lat - 0.004],
        ],
      ],
    });
  }, []);

  const handleToggleLayer = (key: keyof ActiveLayersState) => {
    setActiveLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeFilterCount = [filters.cityId, filters.regionId, filters.landUse].filter(Boolean).length;
  const isSearchActive = Boolean(searchQuery.trim());

  return (
    <ProtectedRoute moduleName="Cadastral Properties Registry">
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-4rem)] bg-[#0F1210] text-[#F4F0E8] select-none font-sans">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* 2D Geospatial Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          {/* Header Bar */}
          <header className="h-14 bg-[#141816] border-b border-[rgba(244,240,232,0.08)] px-4 sm:px-6 flex items-center justify-between z-10 select-none">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-[4px] bg-[#1A201D] text-[#23847D] border border-[#176C68]/40 uppercase font-semibold">
                  2D CADASTRAL
                </span>
                <span className="text-sm font-bold font-mono text-[#F4F0E8] flex items-center gap-2 truncate">
                  <MapPin className="w-4 h-4 text-[#C47B50] shrink-0" />
                  <span className="truncate">2D Cadastral Map & Property Explorer</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href={`/3d-city${selectedParcelId ? `?parcel=${selectedParcelId}` : ""}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#B56E48] hover:bg-[#C47B50] text-xs font-mono font-bold text-[#F4F0E8] transition-all shadow-sm shrink-0"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">3D City View</span>
                <span className="sm:hidden">3D</span>
              </Link>

              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] text-[11px] font-mono text-[#8C988F]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#23847D]" />
                <span>GEODETIC CADASTRAL ENGINE</span>
              </div>
            </div>
          </header>

          {/* Map Area */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Top Left Floating Controls (Search, Layers, Filters) */}
            <div className="absolute top-4 left-4 z-20 space-y-2 max-w-sm pointer-events-auto">
              <SearchControl
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearchSubmit={handleSearchSubmit}
                onSelectProperty={handleSelectPropertyFromSearch}
                onClearSearch={handleClearSearch}
                activeFilters={filters}
              />

              {/* Action Buttons: Layers & Filters */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLayersOpen(!isLayersOpen);
                    setIsFiltersOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-[6px] border text-xs font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                    isLayersOpen
                      ? "bg-[#1A201D] text-[#F4F0E8] border-[#B56E48]"
                      : "bg-[#141816]/95 text-[#77867C] border-[rgba(244,240,232,0.08)] hover:text-[#F4F0E8]"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-[#23847D]" />
                  <span>Layers</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFiltersOpen(!isFiltersOpen);
                    setIsLayersOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-[6px] border text-xs font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                    isFiltersOpen || activeFilterCount > 0
                      ? "bg-[#1A201D] text-[#F4F0E8] border-[#B56E48]"
                      : "bg-[#141816]/95 text-[#77867C] border-[rgba(244,240,232,0.08)] hover:text-[#F4F0E8]"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-[#C47B50]" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#B56E48] text-[#F4F0E8] text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Reset All Filters button if any filter or search is active */}
                {(activeFilterCount > 0 || isSearchActive) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({});
                      setSearchQuery("");
                      setSelectedParcelId(null);
                    }}
                    className="px-2 py-1.5 rounded-[6px] bg-[#141816]/90 border border-[rgba(244,240,232,0.08)] text-[11px] font-mono text-[#C47B50] hover:text-[#F4F0E8] transition-colors flex items-center gap-1 cursor-pointer"
                    title="Clear search and all filters"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset All</span>
                  </button>
                )}
              </div>

              {/* Active Search & Filter Indicator Banner */}
              {isSearchActive && (
                <div className="flex items-center gap-1.5 bg-[#141816]/95 backdrop-blur-md border border-[#B56E48]/40 rounded-[6px] px-2.5 py-1 text-[11px] font-mono text-[#F4F0E8] shadow-md w-fit">
                  <Search className="w-3 h-3 text-[#B56E48]" />
                  <span>Filtered: &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="ml-1 text-[#77867C] hover:text-[#F4F0E8] cursor-pointer"
                    title="Clear search filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Collapsible Layer Control Card */}
              {isLayersOpen && (
                <div className="w-72">
                  <LayerControl
                    layers={activeLayers}
                    onToggleLayer={handleToggleLayer}
                    parcelCount={viewportMetrics.featureCount}
                  />
                </div>
              )}

              {/* Collapsible Filter Control Card */}
              {isFiltersOpen && (
                <FilterControl
                  filters={filters}
                  onChangeFilters={setFilters}
                  onClearFilters={() => setFilters({})}
                  onLocationFocus={handleLocationFocus}
                />
              )}
            </div>

            {/* Central Map Canvas */}
            <main className="flex-1 h-full w-full relative">
              <MapWorkspace
                activeLayers={activeLayers}
                filters={filters}
                searchQuery={searchQuery}
                selectedParcelId={selectedParcelId}
                onSelectParcel={handleSelectParcel}
                onViewportMetricsChange={setViewportMetrics}
                zoomTargetGeom={zoomTargetGeom}
              />
            </main>

            {/* Right Sliding Property Inspector */}
            {selectedParcelId && (
              <PropertyInspector
                parcelId={selectedParcelId}
                onClose={() => setSelectedParcelId(null)}
                onZoomToProperty={(geom) => setZoomTargetGeom(geom)}
              />
            )}
          </div>

          {/* Bottom Telemetry Footer */}
          <MapStatusFooter
            lng={viewportMetrics.lng}
            lat={viewportMetrics.lat}
            zoom={viewportMetrics.zoom}
            featureCount={viewportMetrics.featureCount}
            isLoading={viewportMetrics.isLoading}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function PropertiesExplorerPage() {
  return (
    <Suspense
      fallback={
        <SpatialLoadingRoller
          fullScreen={true}
          label="Loading 2D GIS Workspace"
          subtitle="Loading cadastral parcel registry, ULPIN layers & vector tiles..."
        />
      }
    >
      <PropertiesExplorerContent />
    </Suspense>
  );
}
