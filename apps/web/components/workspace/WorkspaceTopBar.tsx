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
    <header className="absolute top-3 inset-x-4 h-12 z-30 flex items-center justify-between gap-3 pointer-events-none select-none">
      {/* Brand & Workspace Identity Panel */}
      <div className="pointer-events-auto flex items-center gap-3 bg-[#141816] border border-[rgba(244,240,232,0.08)] px-3 py-1.5 rounded-[6px] shadow-sm">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-7 h-7 rounded-[4px] overflow-hidden shrink-0 shadow-sm group-hover:scale-[1.03] transition-transform">
            <Image
              src="/brand/bhusetu-logo.webp"
              alt="BhuSetu 3D Official Brand Logo"
              width={28}
              height={28}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-wider text-[#F4F0E8] font-mono">
                BHUSETU 3D
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#176C68]" />
            </div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#6F7772]">
              Spatial Intelligence
            </span>
          </div>
        </Link>
      </div>

      {/* Center Omnibar & Macro Telemetry Strip */}
      <div className="pointer-events-auto flex items-center gap-2 max-w-2xl flex-1 justify-center">
        {/* Omnibar Search */}
        <div className="relative flex-1 max-w-md">
          <div
            className={`flex items-center gap-2 bg-[#141816] border px-3 py-1.5 rounded-[6px] shadow-sm transition-all ${
              isSearchFocused
                ? "border-[#B56E48] ring-1 ring-[#B56E48]/30"
                : "border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.18)]"
            }`}
          >
            <Search className="w-3.5 h-3.5 text-[#6F7772]" />
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
              className="bg-transparent text-xs text-[#F4F0E8] placeholder-[#6F7772] font-mono focus:outline-none w-full"
            />
            <button
              onClick={onOpenAI}
              className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1A201D] border border-[rgba(244,240,232,0.12)] text-[10px] font-mono text-[#D9D2C5] hover:text-[#F4F0E8] hover:border-[#B56E48] transition-all flex-shrink-0"
              title="Ask BhuSetu Spatial Intelligence"
              aria-label="Ask BhuSetu Spatial Intelligence"
            >
              <Sparkles className="w-3 h-3 text-[#C47B50]" />
              <span>Ask BhuSetu</span>
            </button>
          </div>

          {/* Search Dropdown Results */}
          {isSearchFocused && (
            <div
              id="workspace-search-listbox"
              role="listbox"
              aria-label="Search suggestions"
              className="absolute top-full left-0 right-0 mt-1.5 bg-[#141816] border border-[rgba(244,240,232,0.12)] rounded-[6px] shadow-lg overflow-hidden py-1 z-40"
            >
              <div className="px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#6F7772] border-b border-[rgba(244,240,232,0.08)]">
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
                        <Building2 className="w-3.5 h-3.5 text-[#C47B50] flex-shrink-0" />
                      ) : item.type === "PARCEL" ? (
                        <MapPin className="w-3.5 h-3.5 text-[#23847D] flex-shrink-0" />
                      ) : item.type === "FLOOR" ? (
                        <Layers className="w-3.5 h-3.5 text-[#23847D] flex-shrink-0" />
                      ) : (
                        <LayoutGrid className="w-3.5 h-3.5 text-[#C47B50] flex-shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="text-xs font-mono truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] font-mono text-[#6F7772]">
                          {item.code}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-[4px] border flex-shrink-0 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Flagship Demonstration Quick-Focus Chip */}
        <button
          onClick={() => onSelectEntity?.("77777777-7777-4000-8000-000000000102", "BUILDING")}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] hover:border-[#B56E48] text-[11px] font-mono text-[#D9D2C5] transition-all flex-shrink-0 group cursor-pointer"
          title="Instant 1-Click Flagship Demo: Inspect Aura Horizon Discrepancy (BLD-KA-BLR-102)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#B56E48]" />
          <span className="text-[#6F7772]">Demo:</span>
          <span className="text-[#F4F0E8] font-bold truncate max-w-[130px]">Aura Horizon</span>
        </button>

        {/* Macro KPI Strip */}
        <div className="hidden xl:flex items-center gap-1.5 bg-[#141816] border border-[rgba(244,240,232,0.08)] px-2.5 py-1 rounded-[6px] text-[11px] font-mono">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#1A201D] text-[#D9D2C5]">
            <span className="text-[#6F7772]">Parcels:</span>
            <span className="text-[#23847D] font-bold">{stats.parcels}</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#1A201D] text-[#D9D2C5]">
            <span className="text-[#6F7772]">Twins:</span>
            <span className="text-[#23847D] font-bold">{stats.buildings}</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#1A201D] text-[#D9D2C5]">
            <span className="text-[#6F7772]">Quality:</span>
            <span className="text-[#F4F0E8] font-bold">{stats.qualityIndex}%</span>
          </div>
          <button
            onClick={() => onSelectEntity?.("77777777-7777-4000-8000-000000000102", "BUILDING")}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#B56E48]/15 hover:bg-[#B56E48]/25 border border-[#B56E48]/40 text-[#C47B50] transition-colors cursor-pointer"
            title="Inspect 3D Twin with Detected Height Discrepancy"
          >
            <AlertTriangle className="w-3 h-3 text-[#B56E48]" />
            <span className="font-bold">{stats.conflicts} Discrepancies</span>
          </button>
        </div>
      </div>

      {/* Right Actions & Persona Badge */}
      <div className="pointer-events-auto flex items-center gap-2 bg-[#141816] border border-[rgba(244,240,232,0.08)] p-1 rounded-[6px] shadow-sm">
        {/* 2D / 3D Switcher */}
        {onToggleMode ? (
          <button
            onClick={onToggleMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-mono font-bold transition-all ${
              activeMode === "3D"
                ? "bg-[#B56E48] text-[#F4F0E8]"
                : "bg-[#1A201D] text-[#6F7772] hover:text-[#D9D2C5]"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{activeMode === "3D" ? "3D Twin" : "2D Cadastre"}</span>
          </button>
        ) : (
          <Link
            href="/properties"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#1A201D] text-[#6F7772] hover:text-[#D9D2C5] text-xs font-mono transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>2D Cadastre</span>
          </Link>
        )}

        {/* Global Modules Quick Link */}
        <Link
          href="/overview"
          className="p-1 rounded-[4px] hover:bg-[#1A201D] text-[#6F7772] hover:text-[#F4F0E8] transition-colors"
          title="All System Intelligence Modules"
        >
          <Layers className="w-4 h-4" />
        </Link>

        {/* User Persona Profile Panel */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-[4px] bg-[#1A201D] hover:bg-[#141816] border border-[rgba(244,240,232,0.08)] text-xs font-mono text-[#D9D2C5] transition-colors"
          >
            <div className="w-5 h-5 rounded-[3px] bg-[#141816] border border-[rgba(244,240,232,0.12)] flex items-center justify-center text-[10px] text-[#C47B50] font-bold">
              {user?.email?.charAt(0).toUpperCase() || "O"}
            </div>
            <span className="hidden sm:inline font-medium text-[#F4F0E8] max-w-[100px] truncate">
              {user?.name || user?.email?.split("@")[0] || "Officer"}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-[3px] bg-[#141816] text-[#6F7772] border border-[rgba(244,240,232,0.08)]">
              {user?.roles?.[0] || "ADMIN"}
            </span>
            <ChevronDown className="w-3 h-3 text-[#6F7772]" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#141816] border border-[rgba(244,240,232,0.12)] rounded-[6px] shadow-2xl py-1 z-40 text-xs font-mono">
              <div className="px-3 py-2 border-b border-[rgba(244,240,232,0.08)]">
                <div className="font-semibold text-[#F4F0E8] truncate">
                  {user?.name || "Official User"}
                </div>
                <div className="text-[11px] text-[#6F7772] truncate">
                  {user?.email || "admin.official@bhusetu.gov.in"}
                </div>
                <div className="text-[10px] text-[#23847D] mt-1 uppercase font-semibold">
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
