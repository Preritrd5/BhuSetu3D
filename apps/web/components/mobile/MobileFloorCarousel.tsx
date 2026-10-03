/**
 * MobileFloorCarousel — Touch-first horizontal swipeable floor selector.
 *
 * Replaces the desktop vertical floors panel on mobile/tablet.
 * Uses the SAME floor data and selection state as the desktop floor panel.
 * Calling onSelectFloor triggers the same handleSelectLevel("FLOOR", id) in
 * page.tsx that drives Cesium camera + inspector.
 */
"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Layers, Box } from "lucide-react";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";

// ── Shared floor data (same as desktop panel in CesiumViewer) ─────────────
export const FLOOR_DEFINITIONS = [
  {
    id: "FL-07",
    label: "Floor 07",
    sublabel: "Sky Lounge",
    badge: "DEMO",
    isConflict: false,
  },
  {
    id: "FL-06",
    label: "Floor 06",
    sublabel: "R&D Studios",
    badge: "DEMO",
    isConflict: false,
  },
  {
    id: "FL-05",
    label: "Floor 05",
    sublabel: "Corp Advisory",
    badge: "DEMO",
    isConflict: false,
  },
  {
    id: "FL-04",
    label: "Floor 04",
    sublabel: "Tech Workstations",
    badge: "DEMO",
    isConflict: false,
  },
  {
    id: "FL-03",
    label: "Floor 03",
    sublabel: "Executive Suite",
    badge: "+3m AUTH",
    isConflict: true,
  },
  {
    id: "FL-02",
    label: "Floor 02",
    sublabel: "Commercial Banking",
    badge: "DEMO",
    isConflict: false,
  },
  {
    id: "FL-01",
    label: "Floor 01",
    sublabel: "Ground Lobby",
    badge: "DEMO",
    isConflict: false,
  },
] as const;

export interface FloorItemDefinition {
  id: string;
  label: string;
  sublabel: string;
  badge?: string;
  isConflict?: boolean;
}

export type FloorId = (typeof FLOOR_DEFINITIONS)[number]["id"];

interface MobileFloorCarouselProps {
  selectedFloorId: string | null;
  onSelectFloor: (level: SpatialLevel, id: string, parentBuildingId?: string, parentParcelId?: string) => void;
  floors?: FloorItemDefinition[];
  selectedBuildingId?: string | null;
  selectedParcelId?: string | null;
  isolateFloor?: boolean;
  explodeFloors?: boolean;
  onToggleIsolateFloor?: () => void;
  onToggleExplodeFloors?: () => void;
  /** When true (immersive mode), minimise the carousel to a single compact strip */
  isImmersive?: boolean;
}

export function MobileFloorCarousel({
  selectedFloorId,
  onSelectFloor,
  floors,
  selectedBuildingId,
  selectedParcelId,
  isolateFloor = false,
  explodeFloors = false,
  onToggleIsolateFloor,
  onToggleExplodeFloors,
  isImmersive = false,
}: MobileFloorCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const effectiveFloors = floors && floors.length > 0 ? floors : (FLOOR_DEFINITIONS as unknown as FloorItemDefinition[]);

  // Auto-scroll selected floor into the centre on mount and when selection changes
  const scrollToSelected = useCallback(() => {
    const container = scrollRef.current;
    if (!container || !selectedFloorId) return;

    const index = effectiveFloors.findIndex((f) => f.id === selectedFloorId);
    if (index === -1) return;

    // Each card is roughly 112px wide + 8px gap
    const CARD_W = 120;
    const GAP = 8;
    const containerW = container.offsetWidth;
    const targetLeft = index * (CARD_W + GAP);
    const scrollTarget = targetLeft - containerW / 2 + CARD_W / 2;

    container.scrollTo({ left: Math.max(0, scrollTarget), behavior: "smooth" });
  }, [selectedFloorId, effectiveFloors]);

  useEffect(() => {
    // Short delay so the DOM has rendered before we measure
    const t = setTimeout(scrollToSelected, 100);
    return () => clearTimeout(t);
  }, [scrollToSelected]);

  // In immersive mode, collapse to a tiny pill showing current floor
  if (isImmersive) {
    const curr = effectiveFloors.find((f) => f.id === selectedFloorId);
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#141816]/90 backdrop-blur-md rounded-full border border-[rgba(244,240,232,0.12)] shadow-lg pointer-events-auto">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2EB8B0] animate-ping shrink-0" />
        <span className="text-[11px] font-mono font-bold text-[#2EB8B0] uppercase tracking-wider">
          {curr ? `${curr.label} — ${curr.sublabel}` : "Floor"}
        </span>
      </div>
    );
  }

  const totalFloors = effectiveFloors.length;
  const selectedIndex = effectiveFloors.findIndex((f) => f.id === selectedFloorId);

  return (
    <div
      className="flex flex-col gap-0 w-full pointer-events-auto"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >

      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0F1210]/98">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-[#A2B3A8] uppercase tracking-wider">
            Floors
          </span>
          <span className="text-[10px] font-mono text-[#C47B50] font-bold bg-[#C47B50]/15 px-1.5 py-0.5 rounded border border-[#C47B50]/25">
            {selectedIndex !== -1
              ? `${String(totalFloors - selectedIndex).padStart(2, "0")} / ${String(totalFloors).padStart(2, "0")}`
              : `${totalFloors} LVL`}
          </span>
        </div>

        {/* Quick mode pills */}
        <div className="flex items-center gap-1.5">
          {onToggleIsolateFloor && (
            <button
              onClick={onToggleIsolateFloor}
              className={`flex items-center gap-1 px-2 py-1 rounded-[5px] text-[10px] font-mono font-bold transition-all cursor-pointer ${
                isolateFloor
                  ? "bg-[#B56E48] text-[#F4F0E8]"
                  : "bg-[#1A201D] text-[#A2B3A8] border border-[rgba(244,240,232,0.08)]"
              }`}
            >
              <Box className="w-3 h-3" />
              <span>Isolate</span>
            </button>
          )}
          {onToggleExplodeFloors && (
            <button
              onClick={onToggleExplodeFloors}
              className={`flex items-center gap-1 px-2 py-1 rounded-[5px] text-[10px] font-mono font-bold transition-all cursor-pointer ${
                explodeFloors
                  ? "bg-[#23847D] text-[#0F1210]"
                  : "bg-[#1A201D] text-[#A2B3A8] border border-[rgba(244,240,232,0.08)]"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Explode</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Horizontal scrolling floor strip ───────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex flex-row items-stretch gap-2 overflow-x-auto no-scrollbar px-3 py-2.5 bg-[#141816]/98 border-t border-[rgba(244,240,232,0.06)]"
        style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory" }}
      >
        {effectiveFloors.map((fl) => {
          const isSelected = selectedFloorId === fl.id;
          return (
            <button
              key={fl.id}
              onClick={() => onSelectFloor("FLOOR", fl.id, selectedBuildingId || undefined, selectedParcelId || undefined)}
              style={{ scrollSnapAlign: "center", minWidth: "112px", maxWidth: "112px" }}
              className={`flex flex-col items-start justify-between p-2.5 rounded-[8px] border transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? "bg-[#C47B50] border-[#C47B50] shadow-md"
                  : fl.isConflict
                  ? "bg-[#1A201D] border-rose-800/40 hover:border-rose-600/50"
                  : "bg-[#1A201D] border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.18)]"
              }`}
            >
              {/* Floor number */}
              <span
                className={`text-[13px] font-mono font-bold ${
                  isSelected ? "text-[#F4F0E8]" : "text-[#D9D2C5]"
                }`}
              >
                {fl.label}
              </span>

              {/* Floor name — truncated to 2 lines */}
              <span
                className={`text-[10px] font-sans leading-tight mt-0.5 line-clamp-2 ${
                  isSelected ? "text-[#F4F0E8]/85" : "text-[#77867C]"
                }`}
              >
                {fl.sublabel}
              </span>

              {/* Badge */}
              <span
                className={`mt-1.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded self-start ${
                  isSelected
                    ? "bg-white/20 text-[#F4F0E8]"
                    : fl.isConflict
                    ? "bg-rose-900/70 text-rose-300"
                    : "bg-[#23847D]/20 text-[#2EB8B0]"
                }`}
              >
                {fl.badge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
