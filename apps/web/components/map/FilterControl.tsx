"use client";

/**
 * BhuSetu 3D Property Filter Control
 * Fetches real cities, regions, and land-use categories directly from the PostGIS database.
 * Supports cascading City -> Region selection, instant filter changes,
 * All Cities / All Regions / All Land Uses reset handling, and active filter counters.
 */
import React, { useEffect, useState, useRef } from "react";
import { Filter, RotateCcw, Check, ChevronDown } from "lucide-react";
import { API_BASE } from "@/lib/api/config";

export interface PropertyFilters {
  cityId?: string;   // Real UUID from DB
  regionId?: string; // Real UUID from DB
  landUse?: string;  // e.g. "RESIDENTIAL", "COMMERCIAL"
  cityName?: string;
  regionName?: string;
}

interface FilterControlProps {
  filters: PropertyFilters;
  onChangeFilters: (newFilters: PropertyFilters) => void;
  onClearFilters: () => void;
  onLocationFocus?: (coords: [number, number], zoom?: number) => void;
}

interface CityOption {
  id: string;
  name: string;
  code: string;
}

interface RegionOption {
  id: string;
  name: string;
  code: string;
  city_id: string;
}

// Known coordinates for Karnataka administrative centers
const JURISDICTION_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  "11111111-1111-4000-8000-000000000001": { center: [77.5714, 12.9976], zoom: 14.5 }, // Bengaluru Malleshwaram Cadastral zone
  "22222222-2222-4000-8000-000000000001": { center: [77.5714, 12.9976], zoom: 15.5 }, // Malleshwaram Zone W-101
  BLR: { center: [77.5714, 12.9976], zoom: 14.5 },
  "W-101": { center: [77.5714, 12.9976], zoom: 15.5 },
};

const STATIC_LAND_USES = [
  "RESIDENTIAL",
  "COMMERCIAL",
  "INSTITUTIONAL",
  "MIXED_USE",
  "OPEN_RESERVE",
  "INDUSTRIAL",
  "AGRICULTURAL",
  "PUBLIC",
];

export const FilterControl: React.FC<FilterControlProps> = ({
  filters,
  onChangeFilters,
  onClearFilters,
  onLocationFocus,
}) => {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [allRegions, setAllRegions] = useState<RegionOption[]>([]);
  const [landUses, setLandUses] = useState<string[]>(STATIC_LAND_USES);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const fetchedRef = useRef(false);

  // Load authoritative filter options from backend
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function loadOptions() {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/properties/filter-options`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.cities) && data.cities.length > 0) {
            setCities(data.cities);
          }
          if (Array.isArray(data.regions) && data.regions.length > 0) {
            setAllRegions(data.regions);
          }
          if (Array.isArray(data.land_uses) && data.land_uses.length > 0) {
            setLandUses(data.land_uses);
          }
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      } catch (err) {
        console.warn("[FilterControl] Could not reach filter-options endpoint:", err);
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadOptions();
  }, []);

  // Filter available regions by selected city
  const visibleRegions = filters.cityId
    ? allRegions.filter((r) => r.city_id === filters.cityId)
    : allRegions;

  const hasActiveFilters = Boolean(filters.cityId || filters.regionId || filters.landUse);
  const activeCount = [filters.cityId, filters.regionId, filters.landUse].filter(Boolean).length;

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      // "All Cities" selected
      onChangeFilters({
        ...filters,
        cityId: undefined,
        cityName: undefined,
        regionId: undefined,
        regionName: undefined,
      });
      return;
    }

    const city = cities.find((c) => c.id === val);
    onChangeFilters({
      ...filters,
      cityId: val,
      cityName: city?.name,
      regionId: undefined, // reset region when city changes
      regionName: undefined,
    });

    // Auto-focus map on city if center is known
    const loc = JURISDICTION_CENTERS[val] || (city?.code ? JURISDICTION_CENTERS[city.code] : null);
    if (loc && onLocationFocus) {
      onLocationFocus(loc.center, loc.zoom);
    }
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      // "All Regions" selected
      onChangeFilters({
        ...filters,
        regionId: undefined,
        regionName: undefined,
      });
      return;
    }

    const region = allRegions.find((r) => r.id === val);
    onChangeFilters({
      ...filters,
      regionId: val,
      regionName: region?.name,
    });

    const loc = JURISDICTION_CENTERS[val] || (region?.code ? JURISDICTION_CENTERS[region.code] : null);
    if (loc && onLocationFocus) {
      onLocationFocus(loc.center, loc.zoom);
    }
  };

  const handleLandUseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChangeFilters({
      ...filters,
      landUse: val || undefined,
    });
  };

  return (
    <div className="bg-[#141816]/98 backdrop-blur-md border border-[rgba(244,240,232,0.12)] rounded-[10px] p-3 shadow-2xl space-y-3 text-xs font-mono text-[#F4F0E8] w-72">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[rgba(244,240,232,0.08)]">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#A2B3A8] font-bold">
          <Filter className="w-3.5 h-3.5 text-[#C47B50]" />
          <span>Cadastral Filters</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#B56E48] text-[#F4F0E8] text-[10px] font-bold">
              {activeCount} active
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1 text-[11px] text-[#C47B50] hover:text-[#F4F0E8] transition-colors cursor-pointer"
            title="Reset all filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {loadError && (
        <div className="text-[10px] text-[#C47B50] bg-[#C47B50]/10 p-1.5 rounded border border-[#C47B50]/20">
          Backend API connecting... options loaded with defaults.
        </div>
      )}

      {/* Filter Controls */}
      <div className="space-y-2.5">
        {/* City / Jurisdiction Dropdown */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-[#77867C] mb-1">
            City / Jurisdiction
          </label>
          <div className="relative">
            <select
              value={filters.cityId || ""}
              onChange={handleCityChange}
              disabled={isLoading && cities.length === 0}
              className="w-full bg-[#1A201D] border border-[rgba(244,240,232,0.12)] rounded-[6px] px-2.5 py-1.5 text-[#F4F0E8] text-xs focus:outline-none focus:border-[#B56E48] cursor-pointer appearance-none pr-7"
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#77867C] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Ward / Region Dropdown */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-[#77867C] mb-1">
            Ward / Region
          </label>
          <div className="relative">
            <select
              value={filters.regionId || ""}
              onChange={handleRegionChange}
              disabled={visibleRegions.length === 0}
              className="w-full bg-[#1A201D] border border-[rgba(244,240,232,0.12)] rounded-[6px] px-2.5 py-1.5 text-[#F4F0E8] text-xs focus:outline-none focus:border-[#B56E48] cursor-pointer appearance-none pr-7 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Regions</option>
              {visibleRegions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#77867C] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Land Use Dropdown */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-[#77867C] mb-1">
            Land Use Classification
          </label>
          <div className="relative">
            <select
              value={filters.landUse || ""}
              onChange={handleLandUseChange}
              className="w-full bg-[#1A201D] border border-[rgba(244,240,232,0.12)] rounded-[6px] px-2.5 py-1.5 text-[#F4F0E8] text-xs focus:outline-none focus:border-[#B56E48] cursor-pointer appearance-none pr-7"
            >
              <option value="">All Land Uses</option>
              {landUses.map((lu) => (
                <option key={lu} value={lu}>
                  {lu.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#77867C] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Active Filter Summary Pills */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-[rgba(244,240,232,0.06)] space-y-1">
          <div className="text-[10px] text-[#77867C] font-semibold">Active Criteria:</div>
          <div className="flex flex-wrap gap-1">
            {filters.cityId && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-[#1A201D] text-[#23847D] px-1.5 py-0.5 rounded border border-[#23847D]/30">
                <Check className="w-2.5 h-2.5" />
                {filters.cityName || "City"}
              </span>
            )}
            {filters.regionId && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-[#1A201D] text-[#23847D] px-1.5 py-0.5 rounded border border-[#23847D]/30">
                <Check className="w-2.5 h-2.5" />
                {filters.regionName || "Ward"}
              </span>
            )}
            {filters.landUse && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-[#1A201D] text-[#C47B50] px-1.5 py-0.5 rounded border border-[#C47B50]/30">
                <Check className="w-2.5 h-2.5" />
                {filters.landUse}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
