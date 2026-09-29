"use client";

/**
 * BhuSetu 3D Property Search Control
 */
import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, MapPin, Building, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE } from "@/lib/api/config";

export interface PropertySearchResultItem {
  id: string;
  ulpin_2d: string;
  survey_number: string;
  land_use: string;
  recorded_area_sqm: number;
  city_name: string;
  region_name: string;
  buildings_count: number;
  center: [number, number]; // [lon, lat]
  bbox?: [number, number, number, number];
}

interface SearchControlProps {
  onSelectProperty: (property: PropertySearchResultItem) => void;
}

export const SearchControl: React.FC<SearchControlProps> = ({ onSelectProperty }) => {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PropertySearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/properties/search?q=${encodeURIComponent(query.trim())}&limit=10`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Search query failed:", err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, token]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: PropertySearchResultItem) => {
    onSelectProperty(item);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-[#77867C] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search by ULPIN, Survey No, or Parcel ID..."
          className="w-full pl-9 pr-9 py-2 bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.10)] rounded-[8px] text-xs font-mono text-[#F4F0E8] placeholder-[#77867C] focus:outline-none focus:border-[#B56E48] shadow-lg transition-colors"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 w-4 h-4 text-[#23847D] animate-spin" />
        ) : query ? (
          <button
            onClick={handleClear}
            className="absolute right-3 text-[#77867C] hover:text-[#F4F0E8] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.10)] rounded-[8px] shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
          {results.length > 0 ? (
            <div className="divide-y divide-[rgba(244,240,232,0.06)]">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#1A201D] transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-[#C47B50] group-hover:text-[#F4F0E8]">
                        {item.ulpin_2d}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[#0F1210] text-[#A2B3A8] border border-[rgba(244,240,232,0.06)]">
                        {item.land_use}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#77867C]">
                      <span>Survey: {item.survey_number}</span>
                      <span>•</span>
                      <span>{item.recorded_area_sqm.toLocaleString()} m²</span>
                      <span>•</span>
                      <span className="text-[#77867C]">{item.city_name}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#77867C] group-hover:text-[#C47B50] transition-colors ml-2 flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 && !isLoading ? (
            <div className="p-4 text-center text-xs font-mono text-[#77867C]">
              No matching property records found.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
