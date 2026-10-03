/**
 * MobileHeader — Dedicated mobile top bar for BhuSetu 3D.
 *
 * Only renders on mobile viewports (md:hidden is applied at usage site in page.tsx).
 *
 * Layout:  [BHUSETU 3D logo/text]   [SPACER]   [Search icon]   [Menu icon]
 *
 * - Search icon tap: expands a full-width search sheet
 * - Menu icon tap: opens a full-screen mobile navigation drawer
 * - No desktop elements: no KPI, no discrepancy badge, no email, no role
 * - Touch targets: all interactive elements ≥ 44×44px
 * - Height: 56px (h-14)
 */
"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  Menu,
  X,
  Building2,
  MapPin,
  Layers,
  LayoutGrid,
  Sparkles,
  LogOut,
  ChevronRight,
  Home,
  Map,
  History,
  BarChart3,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SpatialHierarchyTreeResponse } from "@/types/property";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";

interface MobileHeaderProps {
  onOpenAI: () => void;
  onSelectEntity?: (id: string, type: "PARCEL" | "BUILDING" | "FLOOR" | "UNIT" | "ROOM") => void;
  treeData?: SpatialHierarchyTreeResponse | null;
  onNavigate?: (path: string) => void;
}

interface SearchItem {
  id: string;
  type: "PARCEL" | "BUILDING" | "FLOOR" | "UNIT" | "ROOM";
  code: string;
  title: string;
  badge: string;
}

export function MobileHeader({
  onOpenAI,
  onSelectEntity,
  treeData,
  onNavigate,
}: MobileHeaderProps) {
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when sheet opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  // Build search items from tree data
  const searchItems = React.useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = [];
    const parcels = treeData?.city?.regions?.flatMap((r) => r.parcels) || [];
    for (const p of parcels) {
      items.push({
        id: p.id,
        type: "PARCEL",
        code: p.ulpin_2d,
        title: `Parcel ${p.survey_number}`,
        badge: `${p.land_use}`,
      });
      for (const b of p.buildings || []) {
        items.push({
          id: b.id,
          type: "BUILDING",
          code: b.building_code,
          title: b.name,
          badge: b.has_discrepancy ? "Discrepancy" : `${b.detected_floors} Floors`,
        });
        for (const f of b.floors || []) {
          items.push({
            id: f.floor_code,
            type: "FLOOR",
            code: f.floor_code,
            title: `${b.name} — ${f.floor_label || f.floor_code}`,
            badge: `${f.base_elevation.toFixed(1)}m`,
          });
        }
      }
    }
    return items;
  }, [treeData]);

  const filtered = searchQuery.trim()
    ? searchItems.filter(
        (it) =>
          it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          it.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchItems.slice(0, 8);

  const handleSelectItem = (item: SearchItem) => {
    onSelectEntity?.(item.id, item.type);
    setSearchOpen(false);
  };

  const entityIcon = (type: string) => {
    if (type === "BUILDING") return <Building2 className="w-4 h-4 text-[#C47B50]" />;
    if (type === "PARCEL") return <MapPin className="w-4 h-4 text-[#23847D]" />;
    if (type === "FLOOR") return <Layers className="w-4 h-4 text-[#23847D]" />;
    return <LayoutGrid className="w-4 h-4 text-[#C47B50]" />;
  };

  return (
    <>
      {/* ── Primary Mobile Top Bar ──────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 h-14 z-50 bg-[#0F1210] border-b border-[rgba(244,240,232,0.10)] flex items-center px-3 gap-2 select-none">
        {/* Brand */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative w-7 h-7 rounded-[4px] overflow-hidden shrink-0">
            <Image
              src="/brand/bhusetu-logo.webp"
              alt="BhuSetu 3D"
              width={28}
              height={28}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col leading-none min-w-0">
            <span className="text-[14px] font-bold tracking-wider text-[#F4F0E8] font-mono leading-tight">
              BHUSETU 3D
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#5A6B62] leading-tight">
              Spatial Intelligence
            </span>
          </div>
        </div>

        {/* Search icon button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center justify-center w-11 h-11 rounded-[8px] bg-[#141816] border border-[rgba(244,240,232,0.10)] hover:border-[rgba(244,240,232,0.2)] text-[#A2B3A8] active:bg-[#1A201D] transition-colors cursor-pointer shrink-0"
          aria-label="Open search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Menu icon button */}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex items-center justify-center w-11 h-11 rounded-[8px] bg-[#141816] border border-[rgba(244,240,232,0.10)] hover:border-[rgba(244,240,232,0.2)] text-[#A2B3A8] active:bg-[#1A201D] transition-colors cursor-pointer shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── Full-Width Search Sheet ──────────────────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#0F1210]">
          {/* Search header */}
          <div className="flex items-center gap-2 px-3 h-14 border-b border-[rgba(244,240,232,0.10)] shrink-0">
            <Search className="w-5 h-5 text-[#A2B3A8] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search parcel, building, ULPIN…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[15px] font-mono text-[#F4F0E8] placeholder-[#5A6B62] outline-none min-w-0"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="flex items-center justify-center w-11 h-11 text-[#A2B3A8] hover:text-[#F4F0E8] cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ask BhuSetu shortcut */}
          <button
            onClick={() => { setSearchOpen(false); onOpenAI(); }}
            className="flex items-center gap-3 px-4 py-3.5 border-b border-[rgba(244,240,232,0.07)] hover:bg-[#141816] active:bg-[#1A201D] transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-[8px] bg-[#2EB8B0]/15 border border-[#2EB8B0]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#2EB8B0]" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#F4F0E8]">Ask BhuSetu AI</p>
              <p className="text-[12px] text-[#5A6B62] font-mono">Natural language spatial queries</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#5A6B62] ml-auto shrink-0" />
          </button>

          {/* Search label */}
          <div className="px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-[#5A6B62] font-bold border-b border-[rgba(244,240,232,0.06)]">
            {searchQuery.trim() ? `Results for "${searchQuery}"` : "PostGIS Spatial Entities"}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-4 py-8 text-[#5A6B62] text-sm font-mono text-center">
                No entities found
              </p>
            )}
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-[rgba(244,240,232,0.06)] hover:bg-[#141816] active:bg-[#1A201D] transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-[8px] bg-[#1A201D] border border-[rgba(244,240,232,0.10)] flex items-center justify-center shrink-0">
                  {entityIcon(item.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-[#F4F0E8] truncate">{item.title}</p>
                  <p className="text-[11px] font-mono text-[#5A6B62]">{item.code}</p>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1A201D] border border-[rgba(244,240,232,0.10)] text-[#A2B3A8] shrink-0 ml-2">
                  {item.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Full-Screen Navigation Drawer ────────────────────────────────── */}
      {menuOpen && (
        <>
          {/* Scrim */}
          <div
            className="fixed inset-0 z-[59] bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          {/* Drawer — slides in from right */}
          <div className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-[340px] z-[60] bg-[#0F1210] border-l border-[rgba(244,240,232,0.10)] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-[rgba(244,240,232,0.10)] shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative w-6 h-6 rounded-[3px] overflow-hidden">
                  <Image src="/brand/bhusetu-logo.webp" alt="BhuSetu 3D" width={24} height={24} className="w-full h-full object-contain" />
                </div>
                <span className="text-[13px] font-bold font-mono text-[#F4F0E8] tracking-wider">BHUSETU 3D</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center w-10 h-10 rounded-[8px] hover:bg-[#141816] text-[#A2B3A8] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User info */}
            <div className="px-4 py-3 border-b border-[rgba(244,240,232,0.08)] bg-[#141816]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#1A201D] border border-[rgba(244,240,232,0.12)] flex items-center justify-center text-[15px] text-[#C47B50] font-bold shrink-0">
                  {user?.email?.charAt(0).toUpperCase() || "O"}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#F4F0E8] truncate">{user?.name || "Official User"}</p>
                  <p className="text-[11px] font-mono text-[#5A6B62] truncate">{user?.email || "admin@bhusetu.gov.in"}</p>
                  <p className="text-[10px] font-mono text-[#2EB8B0] uppercase font-semibold">{user?.roles?.[0] || "ADMIN"}</p>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto py-2">
              {[
                { icon: <Home className="w-5 h-5" />, label: "3D City Twin", path: "/3d-city", active: true },
                { icon: <Map className="w-5 h-5" />, label: "2D Cadastral Map", path: "/properties" },
                { icon: <BarChart3 className="w-5 h-5" />, label: "Analytics", path: "/analytics" },
                { icon: <History className="w-5 h-5" />, label: "4D History", path: "/history" },
                { icon: <Shield className="w-5 h-5" />, label: "Verification Queue", path: "/verification" },
                { icon: <Sparkles className="w-5 h-5" />, label: "AI Investigator", path: "/spatial-investigator" },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => { setMenuOpen(false); onNavigate?.(item.path); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    item.active
                      ? "bg-[#B56E48]/15 text-[#F4F0E8] border-l-2 border-[#B56E48]"
                      : "text-[#A2B3A8] hover:bg-[#141816] hover:text-[#F4F0E8]"
                  }`}
                >
                  <span className={item.active ? "text-[#C47B50]" : "text-[#6F7772]"}>{item.icon}</span>
                  <span className="text-[14px] font-medium">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-[#5A6B62] ml-auto" />
                </button>
              ))}
            </div>

            {/* Bottom: Sign out */}
            <div className="px-4 py-3 border-t border-[rgba(244,240,232,0.08)] shrink-0" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-[8px] text-[#C47B50] hover:bg-[#B56E48]/15 transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-[14px] font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
