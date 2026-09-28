"use client";

/**
 * BhuSetu 3D Property Filter Control
 */
import React, { useEffect, useState } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export interface PropertyFilters {
  cityId?: string;
  regionId?: string;
  landUse?: string;
}

interface FilterControlProps {
  filters: PropertyFilters;
  onChangeFilters: (newFilters: PropertyFilters) => void;
  onClearFilters: () => void;
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

export const FilterControl: React.FC<FilterControlProps> = ({
  filters,
  onChangeFilters,
  onClearFilters,
}) => {
  const { token } = useAuth();
  const [cities, setCities] = useState<CityOption[]>([]);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [landUses, setLandUses] = useState<string[]>([]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/properties/filter-options", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          setCities(data.cities || []);
          setRegions(data.regions || []);
          setLandUses(data.land_uses || []);
        }
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    }
    loadOptions();
  }, [token]);

  const hasActiveFilters = Boolean(filters.cityId || filters.regionId || filters.landUse);

  return (
    <div className="bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.08)] rounded-[10px] p-3 shadow-2xl space-y-2.5 text-xs font-mono text-[#F4F0E8]">
      <div className="flex items-center justify-between pb-2 border-b border-[rgba(244,240,232,0.06)]">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#77867C] font-semibold">
          <Filter className="w-3.5 h-3.5 text-[#C47B50]" />
          <span>Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-[10px] text-[#C47B50] hover:text-[#F4F0E8] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* City Filter */}
        <div>
          <label className="block text-[10px] text-[#77867C] mb-1">CITY / JURISDICTION</label>
          <select
            value={filters.cityId || ""}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                cityId: e.target.value || undefined,
                regionId: undefined, // reset region when city changes
              })
            }
            className="w-full bg-[#1A201D] border border-[rgba(244,240,232,0.08)] rounded-[6px] px-2 py-1 text-[#F4F0E8] text-xs focus:outline-none focus:border-[#B56E48] cursor-pointer"
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* Region Filter */}
        <div>
          <label className="block text-[10px] text-[#77867C] mb-1">WARD / REGION</label>
          <select
            value={filters.regionId || ""}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                regionId: e.target.value || undefined,
              })
            }
            className="w-full bg-[#1A201D] border border-[rgba(244,240,232,0.08)] rounded-[6px] px-2 py-1 text-[#F4F0E8] text-xs focus:outline-none focus:border-[#B56E48] cursor-pointer"
          >
            <option value="">All Regions</option>
            {regions
              .filter((r) => !filters.cityId || r.city_id === filters.cityId)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
          </select>
        </div>

        {/* Land Use Filter */}
        <div>
          <label className="block text-[10px] text-[#77867C] mb-1">LAND USE</label>
          <select
            value={filters.landUse || ""}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                landUse: e.target.value || undefined,
              })
            }
            className="w-full bg-[#1A201D] border border-[rgba(244,240,232,0.08)] rounded-[6px] px-2 py-1 text-[#F4F0E8] text-xs focus:outline-none focus:border-[#B56E48] cursor-pointer"
          >
            <option value="">All Land Uses</option>
            {landUses.map((lu) => (
              <option key={lu} value={lu}>
                {lu}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
