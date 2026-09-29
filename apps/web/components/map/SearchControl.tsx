"use client";

/**
 * BhuSetu 3D Property Search Control
 * Supports searching by ULPIN, Survey Number, or Parcel ID.
 * Supports partial matching, autocomplete suggestions, Enter-to-search,
 * empty state handling, and integrated active filter scoping.
 */
import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Search, Loader2, X, MapPin, ChevronRight, CornerDownLeft } from "lucide-react";
import { API_BASE } from "@/lib/api/config";
import { useAuth } from "@/hooks/useAuth";
import { PropertyFilters } from "./FilterControl";

export interface PropertySearchResultItem {
  id: string;
  ulpin_2d: string;
  survey_number: string;
  land_use: string;
  recorded_area_sqm: number;
  city_name: string;
  city_id?: string;
  region_name: string;
  region_id?: string;
  buildings_count: number;
  center: [number, number]; // [lon, lat]
  bbox?: [number, number, number, number];
}

interface SearchControlProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  onSelectProperty: (property: PropertySearchResultItem) => void;
  onClearSearch: () => void;
  activeFilters?: PropertyFilters;
}

function isDemoToken(token: string | null | undefined): boolean {
  return !token || token.startsWith("demo_token_");
}

export const SearchControl: React.FC<SearchControlProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onSelectProperty,
  onClearSearch,
  activeFilters,
}) => {
  const { token } = useAuth();
  const [localQuery, setLocalQuery] = useState(searchQuery || "");
  const [results, setResults] = useState<PropertySearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external searchQuery changes to local input state
  useEffect(() => {
    setLocalQuery(searchQuery || "");
    if (!searchQuery) {
      setResults([]);
      setIsOpen(false);
      setHasSearched(false);
    }
  }, [searchQuery]);

  // Fetch autocomplete suggestions with debounce
  useEffect(() => {
    const trimmed = localQuery.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (!isDemoToken(token)) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        let url = `${API_BASE}/properties/search?q=${encodeURIComponent(trimmed)}&limit=8`;
        if (activeFilters?.cityId) {
          url += `&city_id=${activeFilters.cityId}`;
        }
        if (activeFilters?.regionId) {
          url += `&region_id=${activeFilters.regionId}`;
        }
        if (activeFilters?.landUse) {
          url += `&land_use=${encodeURIComponent(activeFilters.landUse)}`;
        }

        const res = await fetch(url, { headers });
        if (res.ok) {
          const data: PropertySearchResultItem[] = await res.json();
          setResults(data);
          setIsOpen(true);
          setHasSearched(true);
        } else {
          setResults([]);
          setHasSearched(true);
        }
      } catch (err) {
        console.error("Search query failed:", err);
        setResults([]);
        setHasSearched(true);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [localQuery, token, activeFilters?.cityId, activeFilters?.regionId, activeFilters?.landUse]);

  // Click outside listener to dismiss suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalQuery(val);
    onSearchChange(val);
    if (!val.trim()) {
      onClearSearch();
      setResults([]);
      setIsOpen(false);
      setHasSearched(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = localQuery.trim();
      if (!trimmed) {
        handleClear();
        return;
      }
      setIsOpen(false);
      onSearchSubmit(trimmed);
      // If there's an exact or top match, also select it
      if (results.length === 1) {
        onSelectProperty(results[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (item: PropertySearchResultItem) => {
    const displayVal = item.ulpin_2d || item.survey_number;
    setLocalQuery(displayVal);
    onSearchChange(displayVal);
    onSelectProperty(item);
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalQuery("");
    setResults([]);
    setIsOpen(false);
    setHasSearched(false);
    onClearSearch();
    inputRef.current?.focus();
  };

  return (
    <div ref={dropdownRef} className="relative w-full max-w-sm sm:max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-[#77867C] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search by ULPIN, Survey No, or Property…"
          className="w-full pl-9 pr-14 py-2 bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.12)] rounded-[8px] text-xs font-mono text-[#F4F0E8] placeholder-[#77867C] focus:outline-none focus:border-[#B56E48] focus:ring-1 focus:ring-[#B56E48]/30 shadow-lg transition-colors"
        />

        {/* Right Action Icons */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-[#23847D] animate-spin" />
          ) : localQuery ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSearchSubmit(localQuery.trim());
                }}
                className="p-1 rounded text-[#77867C] hover:text-[#B56E48] hover:bg-[#1A201D] transition-colors cursor-pointer"
                title="Press Enter to search"
              >
                <CornerDownLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded text-[#77867C] hover:text-[#F4F0E8] hover:bg-[#1A201D] transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#141816]/98 backdrop-blur-md border border-[rgba(244,240,232,0.12)] rounded-[8px] shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
          {results.length > 0 ? (
            <div>
              <div className="px-3 py-1.5 bg-[#0F1210] border-b border-[rgba(244,240,232,0.06)] flex items-center justify-between text-[10px] font-mono text-[#77867C]">
                <span>MATCHING PROPERTIES ({results.length})</span>
                <span className="text-[#A2B3A8]">Click to locate • Enter to filter</span>
              </div>
              <div className="divide-y divide-[rgba(244,240,232,0.06)]">
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full px-3.5 py-2 text-left hover:bg-[#1A201D] transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold font-mono text-[#C47B50] group-hover:text-[#F4F0E8] truncate">
                          {item.ulpin_2d}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[4px] bg-[#0F1210] text-[#A2B3A8] border border-[rgba(244,240,232,0.06)] shrink-0">
                          {item.land_use}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#77867C] flex-wrap">
                        <span>{item.survey_number}</span>
                        <span>•</span>
                        <span>{Number(item.recorded_area_sqm).toLocaleString()} m²</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-[#23847D]" />
                          {item.region_name || item.city_name}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#77867C] group-hover:text-[#C47B50] transition-colors ml-2 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : hasSearched && !isLoading ? (
            <div className="p-4 text-center space-y-1">
              <p className="text-xs font-mono text-[#F4F0E8]">
                No matching property records found
              </p>
              <p className="text-[11px] font-mono text-[#77867C]">
                No parcel matches &ldquo;{localQuery}&rdquo;{activeFilters?.landUse ? ` in ${activeFilters.landUse}` : ""}.
              </p>
              <p className="text-[10px] font-mono text-[#5A645E]">
                Try searching by ULPIN (e.g., &ldquo;KA-BLR-2026-P124&rdquo;) or Survey Number (e.g., &ldquo;Survey 106&rdquo;).
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
