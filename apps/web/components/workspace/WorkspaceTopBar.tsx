"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Sparkles,
  MapPin,
  Layers,
  AlertTriangle,
  User,
  LogOut,
  ChevronDown,
  Compass,
  FileCheck2,
  History,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SpatialHierarchyTreeResponse } from "@/types/property";

interface WorkspaceTopBarProps {
  activeMode?: "3D" | "2D";
  onToggleMode?: () => void;
  onOpenAI: () => void;
  onSelectEntity?: (id: string, type: "PARCEL" | "BUILDING" | "FLOOR" | "UNIT" | "ROOM") => void;
  treeData?: SpatialHierarchyTreeResponse | null;
  stats?: {
    parcels: number;
    buildings: number;
    units: number;
    qualityIndex: number;
    conflicts: number;
  };
}

export const WorkspaceTopBar: React.FC<WorkspaceTopBarProps> = ({
  activeMode = "3D",
  onToggleMode,
  onOpenAI,
  onSelectEntity,
  treeData,
  stats = {
    parcels: 3,
    buildings: 3,
    units: 4,
    qualityIndex: 94.2,
    conflicts: 2,
  },
}) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedSearchIdx, setSelectedSearchIdx] = useState<number>(-1);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const dynamicSearchItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      type: "PARCEL" | "BUILDING" | "FLOOR" | "UNIT" | "ROOM";
      code: string;
      title: string;
      badge: string;
      badgeColor: string;
    }> = [];

    const parcels = treeData?.city?.regions?.flatMap((r) => r.parcels) || [];
    for (const p of parcels) {
      items.push({
        id: p.id,
        type: "PARCEL",
        code: p.ulpin_2d,
        title: `${p.survey_number} Cadastral Parcel`,
        badge: `${p.land_use} • ${p.recorded_area_sqm}m²`,
        badgeColor: "text-[#23847D] bg-[#176C68]/15 border-[#176C68]/30",
      });

      for (const b of p.buildings || []) {
        items.push({
          id: b.id,
          type: "BUILDING",
          code: b.building_code,
          title: b.name,
          badge: b.has_discrepancy
            ? `${b.building_type} • Discrepancy`
            : `${b.building_type} • ${b.detected_floors} Floors`,
          badgeColor: b.has_discrepancy
            ? "text-[#C47B50] bg-[#B56E48]/15 border-[#B56E48]/30"
            : "text-[#23847D] bg-[#176C68]/15 border-[#176C68]/30",
        });

        for (const f of b.floors || []) {
          items.push({
            id: f.floor_code,
            type: "FLOOR",
            code: f.floor_code,
            title: `${b.name} - ${f.floor_label || f.floor_code}`,
            badge: f.is_unsanctioned
              ? "Unapproved Floor"
              : `Floor Slab • ${f.base_elevation.toFixed(1)}m`,
            badgeColor: f.is_unsanctioned
              ? "text-[#C47B50] bg-[#B56E48]/20 border-[#B56E48]/40"
              : "text-[#D9D2C5] bg-[#1A201D] border-[rgba(244,240,232,0.12)]",
          });

          for (const u of f.units || []) {
            items.push({
              id: u.unit_number,
              type: "UNIT",
              code: u.ulpin_3d,
              title: `${u.unit_label || u.unit_number} (${b.name})`,
              badge: `${u.carpet_area_sqm}m² • 3D Unit`,
              badgeColor: "text-[#F4F0E8] bg-[#1A201D] border-[rgba(244,240,232,0.12)]",
            });
          }
        }
      }
    }

    items.sort((a, b) => {
      if (a.id === "77777777-7777-4000-8000-000000000102") return -1;
      if (b.id === "77777777-7777-4000-8000-000000000102") return 1;
      return 0;
    });

    return items;
  }, [treeData]);

  const filteredItems = searchQuery.trim()
    ? dynamicSearchItems.filter(
        (item) =>
          item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.badge.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : dynamicSearchItems.slice(0, 8);

  const handleSelectItem = (item: (typeof dynamicSearchItems)[0]) => {
    if (onSelectEntity) {
      onSelectEntity(item.id, item.type);
    }
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  return (
    <header className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-6 h-13 sm:h-14 z-30 flex items-center justify-between gap-3 pointer-events-none select-none">
      {/* Zone 1: Left - Brand & Omnibar Search */}
      <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Brand & Workspace Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.12)] px-3 sm:px-3.5 py-1.5 rounded-[6px] shadow-sm">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-[4px] overflow-hidden shrink-0 shadow-sm group-hover:scale-[1.03] transition-transform">
              <Image
                src="/brand/bhusetu-logo.webp"
                alt="BhuSetu 3D Official Brand Logo"
                width={32}
                height={32}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold tracking-wider text-[#F4F0E8] font-mono leading-none">
                  BHUSETU 3D
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#176C68]" />
              </div>
              <span className="hidden sm:block text-xs font-mono uppercase tracking-widest text-[#94A3B8] mt-0.5">
                Spatial Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Omnibar Search */}
        <div className="relative w-48 sm:w-60 md:w-72 lg:w-80">
          <div
            className={`flex items-center gap-1.5 sm:gap-2 bg-[#141816]/95 backdrop-blur-md border px-2.5 sm:px-3 py-1.5 rounded-[6px] shadow-sm transition-all ${
              isSearchFocused
                ? "border-[#B56E48] ring-1 ring-[#B56E48]/30"
                : "border-[rgba(244,240,232,0.12)] hover:border-[rgba(244,240,232,0.22)]"
            }`}
          >
            <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
            <input
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isSearchFocused}
              aria-controls="workspace-search-listbox"
              aria-haspopup="listbox"
              aria-label="Search cadastral parcels, 3D buildings, and units"
              placeholder="Search parcel, building, ULPIN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedSearchIdx(-1);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsSearchFocused(false);
                  setSelectedSearchIdx(-1);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  if (!isSearchFocused) setIsSearchFocused(true);
                  setSelectedSearchIdx((prev) =>
                    filteredItems.length > 0 ? (prev + 1) % filteredItems.length : -1
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedSearchIdx((prev) =>
                    filteredItems.length > 0
                      ? (prev - 1 + filteredItems.length) % filteredItems.length
                      : -1
                  );
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const targetItem =
                    selectedSearchIdx >= 0 && selectedSearchIdx < filteredItems.length
                      ? filteredItems[selectedSearchIdx]
                      : filteredItems[0];
                  if (targetItem) {
                    handleSelectItem(targetItem);
                    setSelectedSearchIdx(-1);
                  }
                }
              }}
              className="bg-transparent text-xs sm:text-[13px] text-[#F4F0E8] placeholder-[#94A3B8] font-mono focus:outline-none w-full min-w-0"
            />
            <button
              onClick={onOpenAI}
              className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-[4px] bg-[#1A201D] border border-[rgba(244,240,232,0.15)] text-xs font-mono text-[#D9D2C5] hover:text-[#F4F0E8] hover:border-[#B56E48] transition-all shrink-0 cursor-pointer"
              title="Ask BhuSetu Spatial Intelligence"
              aria-label="Ask BhuSetu Spatial Intelligence"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C47B50]" />
              <span className="hidden sm:inline font-semibold">Ask</span>
            </button>
          </div>

          {/* Search Dropdown Results */}
          {isSearchFocused && (
            <div
              id="workspace-search-listbox"
              role="listbox"
              aria-label="Search suggestions"
              className="absolute top-full left-0 right-0 mt-1.5 bg-[#141816] border border-[rgba(244,240,232,0.14)] rounded-[8px] shadow-2xl overflow-hidden py-1 z-40"
            >
              <div className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-[#94A3B8] border-b border-[rgba(244,240,232,0.08)] font-bold">
                Authoritative PostGIS Digital Twin Entities
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredItems.map((item, idx) => (
                  <button
                    key={item.id}
                    role="option"
                    aria-selected={idx === selectedSearchIdx}
                    onMouseDown={() => handleSelectItem(item)}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2 transition-colors border-b border-[rgba(244,240,232,0.04)] last:border-0 ${
                      idx === selectedSearchIdx
                        ? "bg-[#1A201D] text-[#F4F0E8]"
                        : "hover:bg-[#1A201D] text-[#D9D2C5]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.type === "BUILDING" ? (
                        <Building2 className="w-4 h-4 text-[#C47B50] flex-shrink-0" />
                      ) : item.type === "PARCEL" ? (
                        <MapPin className="w-4 h-4 text-[#23847D] flex-shrink-0" />
                      ) : item.type === "FLOOR" ? (
                        <Layers className="w-4 h-4 text-[#23847D] flex-shrink-0" />
                      ) : (
                        <LayoutGrid className="w-4 h-4 text-[#C47B50] flex-shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="text-xs font-mono font-medium truncate">
                          {item.title}
                        </div>
                        <div className="text-xs font-mono text-[#A7B3AB]">
                          {item.code}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-[4px] border font-bold flex-shrink-0 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone 2: Center - Target Context & Macro Telemetry */}
      <div className="pointer-events-auto hidden md:flex items-center gap-2 min-w-0 justify-center">
        {/* Flagship Demonstration Quick-Focus Chip */}
        <button
          onClick={() => onSelectEntity?.("77777777-7777-4000-8000-000000000102", "BUILDING")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#141816]/95 hover:bg-[#1A201D] border border-[rgba(244,240,232,0.12)] hover:border-[#B56E48] text-xs font-mono text-[#D9D2C5] transition-all cursor-pointer group shadow-sm shrink-0"
          title="Instant 1-Click Flagship Demo: Inspect Aura Horizon Discrepancy (BLD-KA-BLR-102)"
        >
          <span className="w-2 h-2 rounded-full bg-[#B56E48] group-hover:scale-110 transition-transform" />
          <span className="text-[#94A3B8]">Target:</span>
          <span className="text-[#F4F0E8] font-bold truncate max-w-[150px] lg:max-w-[200px]">
            Aura Horizon Commercial
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-rose-950/40 border border-rose-800/50 text-rose-300 text-[11px] font-bold">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>+3.0m Discrepancy</span>
          </span>
        </button>

        {/* Macro KPI Strip (Visible on 2xl screens) */}
        <div className="hidden 2xl:flex items-center gap-1.5 bg-[#141816]/95 border border-[rgba(244,240,232,0.12)] px-2.5 py-1 rounded-[6px] text-xs font-mono">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1A201D] text-[#D9D2C5]">
            <span className="text-[#94A3B8]">Parcels:</span>
            <span className="text-[#23847D] font-bold">{stats.parcels}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1A201D] text-[#D9D2C5]">
            <span className="text-[#94A3B8]">Twins:</span>
            <span className="text-[#23847D] font-bold">{stats.buildings}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1A201D] text-[#D9D2C5]">
            <span className="text-[#94A3B8]">Quality:</span>
            <span className="text-[#F4F0E8] font-bold">{stats.qualityIndex}%</span>
          </div>
        </div>
      </div>

      {/* Zone 3: Right - Mode Switcher, Modules, and User Profile */}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.12)] p-1 rounded-[6px] shadow-sm shrink-0">
        {/* 2D / 3D Switcher */}
        {onToggleMode ? (
          <button
            onClick={onToggleMode}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold transition-all cursor-pointer ${
              activeMode === "3D"
                ? "bg-[#B56E48] text-[#F4F0E8] shadow-sm"
                : "bg-[#1A201D] text-[#94A3B8] hover:text-[#F4F0E8]"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{activeMode === "3D" ? "3D Twin" : "2D Cadastre"}</span>
          </button>
        ) : (
          <Link
            href="/properties"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[4px] bg-[#1A201D] text-[#94A3B8] hover:text-[#F4F0E8] text-xs font-mono transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2D Cadastre</span>
          </Link>
        )}

        {/* Global Modules Quick Link */}
        <Link
          href="/overview"
          className="p-1.5 rounded-[4px] hover:bg-[#1A201D] text-[#94A3B8] hover:text-[#F4F0E8] transition-colors"
          title="All System Intelligence Modules"
          aria-label="All System Intelligence Modules"
        >
          <Layers className="w-4 h-4" />
        </Link>

        {/* User Persona Profile Panel */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] bg-[#1A201D] hover:bg-[#141816] border border-[rgba(244,240,232,0.12)] text-xs font-mono text-[#D9D2C5] transition-colors cursor-pointer"
            aria-label="User account and profile menu"
          >
            <div className="w-6 h-6 rounded-[3px] bg-[#141816] border border-[rgba(244,240,232,0.15)] flex items-center justify-center text-xs text-[#C47B50] font-bold">
              {user?.email?.charAt(0).toUpperCase() || "O"}
            </div>
            <span className="hidden sm:inline font-medium text-[#F4F0E8] max-w-[120px] truncate">
              {user?.name || user?.email?.split("@")[0] || "Officer"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-[3px] bg-[#141816] text-[#A7B3AB] border border-[rgba(244,240,232,0.10)] font-semibold">
              {user?.roles?.[0] || "ADMIN"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-[#141816] border border-[rgba(244,240,232,0.12)] rounded-[6px] shadow-2xl py-1 z-40 text-xs font-mono">
              <div className="px-3 py-2 border-b border-[rgba(244,240,232,0.08)]">
                <div className="font-semibold text-[#F4F0E8] truncate text-sm">
                  {user?.name || "Official User"}
                </div>
                <div className="text-xs text-[#94A3B8] truncate mt-0.5">
                  {user?.email || "admin.official@bhusetu.gov.in"}
                </div>
                <div className="text-xs text-[#2EB8B0] mt-1 uppercase font-semibold">
                  Role: {user?.roles?.join(", ") || "ADMINISTRATOR"}
                </div>
              </div>
              <div className="py-1">
                <Link
                  href="/overview"
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-[#D9D2C5] hover:bg-[#1A201D] hover:text-[#F4F0E8] transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Module Overview</span>
                </Link>
                <Link
                  href="/history"
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-[#D9D2C5] hover:bg-[#1A201D] hover:text-[#F4F0E8] transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>4D History Scrubber</span>
                </Link>
                <Link
                  href="/evidence"
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-[#D9D2C5] hover:bg-[#1A201D] hover:text-[#F4F0E8] transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Cryptographic Vault</span>
                </Link>
              </div>
              <div className="pt-1 border-t border-[rgba(244,240,232,0.08)]">
                <button
                  onClick={() => logout()}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-[#C47B50] hover:bg-[#B56E48]/20 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
