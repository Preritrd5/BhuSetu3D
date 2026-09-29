"use client";

/**
 * BhuSetu 3D Property Search Control
 * Supports searching by ULPIN, Survey Number, Land Use, City, or Region.
 * Supports partial matching, autocomplete suggestions, Enter-to-search,
 * high-contrast solid dropdown, and integrated active filter scoping.
 */
import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Search, Loader2, X, MapPin, ChevronRight, CornerDownLeft, Sparkles } from "lucide-react";
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

const QUICK_SEARCH_EXAMPLES = [
  "Commercial",
  "Residential",
  "Survey 106",
  "Survey 105",
  "KA-BLR-2026-P102",
];

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

        let url = `${API_BASE}/properties/search?q=${encodeURIComponent(trimmed)}&limit=12`;
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

  const handleQuickSearch = (term: string) => {
    setLocalQuery(term);
    onSearchChange(term);
    onSearchSubmit(term);
    inputRef.current?.focus();
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
          onFocus={() => setIsOpen(true)}
          placeholder="Search by ULPIN, Survey No, Land Use..."
          className="w-full pl-9 pr-14 py-2 bg-[#141816] border border-[rgba(244,240,232,0.18)] rounded-[8px] text-xs font-mono text-[#F4F0E8] placeholder-[#77867C] focus:outline-none focus:border-[#B56E48] focus:ring-1 focus:ring-[#B56E48]/40 shadow-2xl transition-colors"
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
                title="Press Enter to filter map"
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

      {/* Solid High-Contrast Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#141816] border border-[rgba(244,240,232,0.22)] rounded-[8px] shadow-2xl overflow-hidden z-50 max-h-76 overflow-y-auto ring-1 ring-black/60">
          {results.length > 0 ? (
            <div>
              <div className="px-3.5 py-2 bg-[#0F1210] border-b border-[rgba(244,240,232,0.08)] flex items-center justify-between text-[11px] font-mono text-[#A2B3A8]">
                <span className="font-semibold text-[#F4F0E8]">MATCHING PROPERTIES ({results.length})</span>
                <span className="text-[#23847D] font-bold">Press Enter to Filter Map</span>
              </div>
              <div className="divide-y divide-[rgba(244,240,232,0.08)]">
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-[#1E2621] transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold font-mono text-[#F59E0B] group-hover:text-[#FFFFFF] truncate">
                          {item.ulpin_2d}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#0A0D0B] text-[#A2B3A8] border border-[rgba(244,240,232,0.12)] font-semibold shrink-0">
                          {item.land_use}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#94A3B8] flex-wrap">
                        <span className="text-[#F4F0E8] font-semibold">{item.survey_number}</span>
                        <span>•</span>
                        <span>{Number(item.recorded_area_sqm).toLocaleString()} m²</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-[#38BDF8]">
                          <MapPin className="w-2.5 h-2.5" />
                          {item.region_name || item.city_name}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#77867C] group-hover:text-[#F59E0B] transition-colors ml-2 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : hasSearched && !isLoading ? (
            <div className="p-4 text-center space-y-2 bg-[#141816]">
              <p className="text-xs font-bold font-mono text-[#FFFFFF]">
                No matching property records found
              </p>
              <p className="text-[11px] font-mono text-[#CBD5E1]">
                No parcel matches &ldquo;<span className="text-[#F59E0B]">{localQuery}</span>&rdquo;{activeFilters?.landUse ? ` under ${activeFilters.landUse}` : ""}.
              </p>
              <div className="pt-2 border-t border-[rgba(244,240,232,0.08)]">
                <p className="text-[10px] uppercase font-bold text-[#77867C] mb-1.5 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#23847D]" />
                  <span>Try a quick search:</span>
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {QUICK_SEARCH_EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => handleQuickSearch(ex)}
                      className="px-2 py-0.5 rounded bg-[#1A201D] text-[#23847D] hover:bg-[#23847D] hover:text-white border border-[#23847D]/40 text-[10px] font-mono transition-colors cursor-pointer"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Helpful Quick Prompts when focused without query */
            <div className="p-3 bg-[#141816] space-y-2">
              <div className="text-[10px] uppercase font-bold text-[#77867C] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                <span>Search suggestions:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SEARCH_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => handleQuickSearch(ex)}
                    className="px-2 py-1 rounded bg-[#1A201D] text-[#A2B3A8] hover:text-white hover:bg-[#23847D] border border-[rgba(244,240,232,0.12)] text-[10px] font-mono transition-colors cursor-pointer"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
