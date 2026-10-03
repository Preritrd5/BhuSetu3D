/**
 * MobileContextBar — Compact spatial context strip replacing the desktop breadcrumb on mobile.
 *
 * Shows:   ← [Up]    Building Name    Floor 03 / 07
 * Replaces the large multi-segment desktop breadcrumb.
 * Tap "← Back" calls onUpOneLevel. Tap level chips navigates there.
 */
"use client";

import React from "react";
import { ChevronLeft, Building2 } from "lucide-react";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";

interface MobileContextBarProps {
  currentLevel: SpatialLevel;
  buildingName: string;
  floorName: string;
  selectedFloorId: string | null;
  totalFloors?: number;
  onUpOneLevel: () => void;
  onNavigateToLevel: (level: SpatialLevel, id?: string) => void;
  isVisible?: boolean;
}

// Short label for a given level
function levelLabel(level: SpatialLevel): string {
  switch (level) {
    case "CITY":
      return "City";
    case "REGION":
      return "Region";
    case "PARCEL":
      return "Parcel";
    case "BUILDING":
      return "Building";
    case "FLOOR":
      return "Floor";
    case "UNIT":
      return "Unit";
    case "ROOM":
      return "Room";
    case "CORRIDOR":
      return "Corridor";
    case "ELEMENT":
    case "DOOR":
    case "WINDOW":
      return "Element";
    case "HALL":
      return "Hall";
    default:
      return level;
  }
}

// The parent level for "back" labelling
function parentLevelLabel(level: SpatialLevel): string {
  switch (level) {
    case "FLOOR":
    case "UNIT":
      return "Building";
    case "ROOM":
    case "CORRIDOR":
    case "HALL":
      return "Floor";
    case "ELEMENT":
    case "DOOR":
    case "WINDOW":
      return "Unit";
    case "BUILDING":
      return "Parcel";
    case "PARCEL":
    case "REGION":
      return "City";
    default:
      return "Up";
  }
}

export function MobileContextBar({
  currentLevel,
  buildingName,
  floorName,
  selectedFloorId,
  totalFloors = 7,
  onUpOneLevel,
  onNavigateToLevel,
  isVisible = true,
}: MobileContextBarProps) {
  if (!isVisible) return null;


  // Parse floor number from "FL-03" → 3
  const floorNum = selectedFloorId
    ? parseInt(selectedFloorId.replace(/\D/g, ""), 10) || null
    : null;

  // The primary context name depends on current level
  const primaryName =
    currentLevel === "BUILDING" || currentLevel === "PARCEL"
      ? buildingName
      : floorName || buildingName;

  return (
    <div
      className="flex items-center gap-0 w-full min-w-0 bg-[#0F1210]/95 backdrop-blur-md border-b border-[rgba(244,240,232,0.08)] pointer-events-auto select-none"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >

      {/* Back button */}
      {currentLevel !== "CITY" && currentLevel !== "REGION" && (
        <button
          onClick={onUpOneLevel}
          className="flex items-center gap-1 px-3 py-2.5 text-[#A2B3A8] hover:text-[#D9D2C5] hover:bg-[#1A201D] transition-all cursor-pointer shrink-0 border-r border-[rgba(244,240,232,0.07)]"
          aria-label={`Go back to ${parentLevelLabel(currentLevel)}`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-[11px] font-mono font-semibold hidden sm:inline">
            {parentLevelLabel(currentLevel)}
          </span>
        </button>
      )}

      {/* Building icon + name */}
      <div className="flex items-center gap-2 px-3 py-2 min-w-0 flex-1 overflow-hidden">
        <Building2 className="w-3.5 h-3.5 text-[#C47B50] shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-mono text-[#A2B3A8] uppercase tracking-wider leading-none mb-0.5">
            {levelLabel(currentLevel)}
          </p>
          <p className="text-[13px] font-sans font-semibold text-[#D9D2C5] truncate leading-tight">
            {primaryName}
          </p>
        </div>
      </div>

      {/* Floor position indicator (only when floor/unit selected) */}
      {floorNum !== null &&
        (currentLevel === "FLOOR" ||
          currentLevel === "UNIT" ||
          currentLevel === "ROOM" ||
          currentLevel === "ELEMENT" ||
          currentLevel === "CORRIDOR" ||
          currentLevel === "HALL") && (
          <div className="flex items-center shrink-0 pr-3 pl-2">
            <span className="text-[12px] font-mono font-bold text-[#C47B50] bg-[#C47B50]/10 px-2 py-1 rounded border border-[#C47B50]/25 whitespace-nowrap">
              {String(floorNum).padStart(2, "0")}&nbsp;/&nbsp;{String(totalFloors).padStart(2, "0")}
            </span>
          </div>
        )}
    </div>
  );
}
