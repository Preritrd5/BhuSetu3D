"use client";

import React, { useState } from "react";
import {
  Building2,
  MapPin,
  Layers,
  LayoutGrid,
  DoorOpen,
  Eye,
  X,
  Compass,
  RotateCcw,
  Plus,
  Minus,
  RefreshCw,
  Box,
  ChevronUp,
  Globe2,
} from "lucide-react";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";

export interface RightSpatialControlRailProps {
  // 1. INSPECT Props
  selection?: ActiveSpatialSelection | null;
  onRestoreInspector?: () => void;
  onCloseInspector?: () => void;
  onClearSelection?: () => void;
  isRightPanelOpen?: boolean;

  // 2. 360° Camera Props
  cameraMode: "GIS_ORBIT" | "IMMERSIVE";
  onEnterImmersiveMode: () => void;
  onExitImmersiveMode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCamera: () => void;
  onRefreshScene: () => void;

  // 3. FLOORS Props
  currentLevel: SpatialLevel;
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  selectedParcelId: string | null;
  activeBuildingFloors: {
    id: string;
    label: string;
    badge: string;
    badgeColor: string;
    sublabel: string;
    isConflict?: boolean;
  }[];
  onSelectLevel: (
    level: SpatialLevel,
    id?: string,
    parentBuildingId?: string,
    parentParcelId?: string
  ) => void;
  isolateFloor?: boolean;
  explodeFloors?: boolean;
  onToggleIsolateFloor?: () => void;
  onToggleExplodeFloors?: () => void;

  // Mobile / Visibility Controls
  hideMobileFloorPanel?: boolean;
  className?: string;
}

export const RightSpatialControlRail: React.FC<RightSpatialControlRailProps> = ({
  selection,
  onRestoreInspector,
  onCloseInspector,
  onClearSelection,
  isRightPanelOpen = false,

  cameraMode,
  onEnterImmersiveMode,
  onExitImmersiveMode,
  onZoomIn,
  onZoomOut,
  onResetCamera,
  onRefreshScene,

  currentLevel,
  selectedBuildingId,
  selectedFloorId,
  selectedParcelId,
  activeBuildingFloors = [],
  onSelectLevel,
  isolateFloor,
  explodeFloors,
  onToggleIsolateFloor,
  onToggleExplodeFloors,

  hideMobileFloorPanel = false,
  className = "",
}) => {
  // Independent expand/collapse states for each of the 3 controls
  const [isInspectExpanded, setIsInspectExpanded] = useState<boolean>(true);
  const [is360Expanded, setIs360Expanded] = useState<boolean>(true);
  const [isFloorsExpanded, setIsFloorsExpanded] = useState<boolean>(true);

  // Helper to render icon for current selection
  const renderEntityIcon = (level?: SpatialLevel | string) => {
    switch (level) {
      case "PARCEL":
        return <MapPin className="w-3.5 h-3.5 text-[#2EB8B0] shrink-0" />;
      case "BUILDING":
        return <Building2 className="w-3.5 h-3.5 text-[#C47B50] shrink-0" />;
      case "FLOOR":
        return <Layers className="w-3.5 h-3.5 text-[#2EB8B0] shrink-0" />;
      case "UNIT":
        return <LayoutGrid className="w-3.5 h-3.5 text-[#C47B50] shrink-0" />;
      case "ROOM":
        return <DoorOpen className="w-3.5 h-3.5 text-[#2EB8B0] shrink-0" />;
      case "CITY":
        return <Globe2 className="w-3.5 h-3.5 text-[#2EB8B0] shrink-0" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-[#C47B50] shrink-0" />;
    }
  };

  // Determine if floors panel should be displayed (building selected and floors exist)
  const hasFloorPanel =
    !hideMobileFloorPanel &&
    (currentLevel === "BUILDING" ||
      currentLevel === "FLOOR" ||
      currentLevel === "UNIT" ||
      currentLevel === "ROOM" ||
      currentLevel === "ELEMENT" ||
      currentLevel === "CORRIDOR") &&
    Boolean(selectedBuildingId) &&
    activeBuildingFloors.length > 0;

  // Active inspect target info
  const inspectTitle = selection?.title || (selectedBuildingId ? "Selected Building" : "Spatial Object");
  const inspectType = selection?.entityType || currentLevel;
  const isCitySelection = !selection || selection.entityType === "CITY";

  return (
    <div
      className={`absolute z-20 flex flex-col items-end gap-2.5 transition-all duration-300 pointer-events-none select-none max-md:top-[104px] max-md:right-3 md:top-[68px] ${
        isRightPanelOpen
          ? "md:right-[416px] lg:right-[420px] xl:right-[428px]"
          : "md:right-4"
      } ${className}`}
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. INSPECT CONTROL (Always First in Vertical Stack)            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {!isCitySelection && (
        <div className="flex flex-col items-end animate-in fade-in slide-in-from-right-2 duration-200">
          {isInspectExpanded ? (
            <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 pl-3 rounded-[8px] bg-[#141816]/98 backdrop-blur-md border border-[rgba(244,240,232,0.12)] shadow-2xl text-xs font-mono max-w-[320px] min-w-[265px]">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {renderEntityIcon(inspectType)}
                <span className="text-[11px] font-bold text-[#A7B3AB] uppercase tracking-wider shrink-0">
                  {inspectType}
                </span>
                <span className="text-[#6F7772]/40 shrink-0">•</span>
                <span
                  className="text-[#F4F0E8] font-medium truncate max-w-[130px]"
                  title={inspectTitle}
                >
                  {inspectTitle}
                </span>
              </div>

              {/* Inspect Button / Toggle */}
              <button
                onClick={() => {
                  if (isRightPanelOpen && onCloseInspector) {
                    onCloseInspector();
                  } else if (onRestoreInspector) {
                    onRestoreInspector();
                  }
                }}
                className={`ml-1 px-2.5 py-1 rounded-[4px] text-[11px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                  isRightPanelOpen
                    ? "bg-[#23847D] text-[#0F1210] hover:bg-[#2EB8B0]"
                    : "bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8]"
                }`}
                title={isRightPanelOpen ? "Close Contextual Inspector" : "Open Contextual Inspector"}
              >
                <Eye className="w-3 h-3" />
                <span>{isRightPanelOpen ? "Inspecting" : "Inspect"}</span>
              </button>

              {/* Collapse to circular icon */}
              <button
                onClick={() => setIsInspectExpanded(false)}
                className="p-1 rounded-[4px] hover:bg-[#1A201D] text-[#6F7772] hover:text-[#F4F0E8] transition-colors cursor-pointer shrink-0 ml-0.5"
                title="Collapse Inspect to circular button"
                aria-label="Collapse Inspect"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>

              {/* Clear Selection */}
              {onClearSelection && (
                <button
                  onClick={onClearSelection}
                  className="p-1 rounded-[4px] hover:bg-[#1A201D] text-[#6F7772] hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                  title="Deselect object"
                  aria-label="Deselect object"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            /* Collapsed Compact Circular Icon Button */
            <button
              onClick={() => setIsInspectExpanded(true)}
              className={`w-10 h-10 rounded-full bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.14)] hover:border-[#C47B50]/60 shadow-xl flex items-center justify-center transition-all cursor-pointer pointer-events-auto group relative ${
                isRightPanelOpen
                  ? "border-[#23847D] text-[#2EB8B0] bg-[#23847D]/15"
                  : "text-[#C47B50] hover:text-[#F4F0E8] hover:bg-[#B56E48]/20"
              }`}
              title={`Inspect: ${inspectTitle} (Click to expand)`}
              aria-label="Expand Inspect panel"
            >
              <Eye className="w-4 h-4" />
              {isRightPanelOpen && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#2EB8B0] animate-ping" />
              )}
            </button>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. 360° CONTROLS (Always Directly Below Inspect)              */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-end">
        {is360Expanded ? (
          <div
            className="pointer-events-auto flex items-center gap-1 bg-[#141816]/95 backdrop-blur-md p-1 sm:p-1.5 rounded-[8px] border border-[rgba(244,240,232,0.12)] shadow-2xl"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* GIS Orbit Mode Toggle */}
            <button
              onClick={onExitImmersiveMode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] transition-all cursor-pointer font-mono font-bold text-[11px] ${
                cameraMode === "GIS_ORBIT"
                  ? "bg-[#B56E48] text-[#F4F0E8] shadow-md"
                  : "text-[#6F7772] hover:text-[#D9D2C5] hover:bg-[#1A201D]"
              }`}
              title="GIS Orbit Mode — orbit around buildings from outside"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>GIS</span>
            </button>

            {/* Immersive 360° View Toggle */}
            <button
              onClick={onEnterImmersiveMode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] transition-all cursor-pointer font-mono font-bold text-[11px] ${
                cameraMode === "IMMERSIVE"
                  ? "bg-[#23847D] text-white shadow-md"
                  : "text-[#6F7772] hover:text-[#2EB8B0] hover:bg-[#23847D]/15"
              }`}
              title="Immersive View — step inside the selected floor and look around 360°. Drag to look."
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${cameraMode === "IMMERSIVE" ? "animate-spin" : ""}`}
                style={cameraMode === "IMMERSIVE" ? { animationDuration: "3s" } : {}}
              />
              <span>360°</span>
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-[rgba(244,240,232,0.10)] mx-0.5" />

            {/* Zoom In */}
            <button
              onClick={onZoomIn}
              className="p-1.5 sm:p-2 rounded-[6px] hover:bg-[#1A201D] text-[#D9D2C5] hover:text-[#C47B50] transition-all cursor-pointer"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Zoom Out */}
            <button
              onClick={onZoomOut}
              className="p-1.5 sm:p-2 rounded-[6px] hover:bg-[#1A201D] text-[#D9D2C5] hover:text-[#C47B50] transition-all cursor-pointer"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Re-focus / Center Camera */}
            <button
              onClick={onResetCamera}
              className="p-1.5 sm:p-2 rounded-[6px] hover:bg-[#1A201D] text-[#D9D2C5] hover:text-[#C47B50] transition-all cursor-pointer"
              title="Re-focus camera on current selection"
            >
              <Compass className="w-4 h-4" />
            </button>

            {/* Refresh 3D Scene */}
            <button
              onClick={onRefreshScene}
              className="p-1.5 sm:p-2 rounded-[6px] hover:bg-[#1A201D] text-[#D9D2C5] hover:text-[#C47B50] transition-all cursor-pointer"
              title="Refresh 3D Scene"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Explode / Isolate Quick Toggles */}
            {onToggleExplodeFloors && (
              <button
                onClick={onToggleExplodeFloors}
                className={`p-1.5 sm:p-2 rounded-[6px] transition-all cursor-pointer ${
                  explodeFloors
                    ? "bg-[#23847D] text-[#0F1210] font-bold shadow-md"
                    : "hover:bg-[#1A201D] text-[#D9D2C5] hover:text-[#23847D]"
                }`}
                title={explodeFloors ? "Collapse Floors" : "Explode Floors (vertical separation)"}
              >
                <Layers className="w-4 h-4" />
              </button>
            )}
            {onToggleIsolateFloor && (
              <button
                onClick={onToggleIsolateFloor}
                className={`p-1.5 sm:p-2 rounded-[6px] transition-all cursor-pointer ${
                  isolateFloor
                    ? "bg-[#B56E48] text-[#F4F0E8] font-bold shadow-md"
                    : "hover:bg-[#1A201D] text-[#D9D2C5] hover:text-[#C47B50]"
                }`}
                title={isolateFloor ? "Exit Floor Isolation" : "Isolate Current Floor"}
              >
                <Box className="w-4 h-4" />
              </button>
            )}

            {/* Collapse 360 to circular icon */}
            <button
              onClick={() => setIs360Expanded(false)}
              className="p-1 sm:p-1.5 rounded-[6px] hover:bg-[#1A201D] text-[#6F7772] hover:text-[#F4F0E8] transition-colors cursor-pointer shrink-0 ml-0.5"
              title="Collapse 360° controls to circular button"
              aria-label="Collapse 360 controls"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Collapsed Compact Circular Icon Button */
          <button
            onClick={() => setIs360Expanded(true)}
            className={`w-10 h-10 rounded-full bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.14)] hover:border-[#2EB8B0]/60 shadow-xl flex items-center justify-center transition-all cursor-pointer pointer-events-auto group relative ${
              cameraMode === "IMMERSIVE"
                ? "border-[#23847D] text-[#2EB8B0] bg-[#23847D]/15"
                : "text-[#2EB8B0] hover:text-[#F4F0E8] hover:bg-[#23847D]/20"
            }`}
            title={`360° Camera Controls (${cameraMode === "IMMERSIVE" ? "360° Active" : "GIS Orbit"} - Click to expand)`}
            aria-label="Expand 360 camera controls"
          >
            {cameraMode === "IMMERSIVE" ? (
              <RotateCcw className="w-4 h-4 animate-spin" style={{ animationDuration: "4s" }} />
            ) : (
              <Compass className="w-4 h-4" />
            )}
            {cameraMode === "IMMERSIVE" && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#2EB8B0] animate-pulse" />
            )}
          </button>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. FLOORS PANEL (Always Directly Below 360°)                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {hasFloorPanel && (
        <div className="flex flex-col items-end animate-in fade-in slide-in-from-right-2 duration-200">
          {isFloorsExpanded ? (
            <div className="pointer-events-auto flex flex-col bg-[#141816]/98 backdrop-blur-md rounded-[10px] border border-[rgba(244,240,232,0.12)] shadow-2xl overflow-hidden w-[245px] sm:w-[265px] xl:w-[275px]">
              {/* Header */}
              <div className="px-3 py-2 bg-[#0F1210] border-b border-[rgba(244,240,232,0.08)] flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#A2B3A8] uppercase tracking-wider">
                  FLOORS
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#C47B50] font-bold bg-[#C47B50]/15 px-2 py-0.5 rounded-[4px] border border-[#C47B50]/25">
                    {activeBuildingFloors.length} {activeBuildingFloors.length === 1 ? "LEVEL" : "LEVELS"}
                  </span>
                  <button
                    onClick={() => setIsFloorsExpanded(false)}
                    className="p-1 rounded-[4px] hover:bg-[#1A201D] text-[#6F7772] hover:text-[#F4F0E8] transition-colors cursor-pointer"
                    title="Collapse Floors to circular button"
                    aria-label="Collapse Floors panel"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Floor Items (Rendered dynamically top to bottom with internal scroll) */}
              <div className="flex flex-col p-1.5 gap-1 max-h-[calc(100vh-280px)] sm:max-h-[380px] overflow-y-auto no-scrollbar">
                {activeBuildingFloors.map((fl) => {
                  const isSelected = selectedFloorId === fl.id;
                  return (
                    <button
                      key={fl.id}
                      onClick={() =>
                        onSelectLevel(
                          "FLOOR",
                          fl.id,
                          selectedBuildingId || undefined,
                          selectedParcelId || undefined
                        )
                      }
                      className={`px-3 py-2 rounded-[6px] text-left transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? "bg-[#C47B50] text-[#F4F0E8] shadow-md font-bold"
                          : "hover:bg-[#1A201D] text-[#D9D2C5]"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-[13px] font-mono font-bold">
                            {fl.label}
                          </span>
                          <span
                            className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${fl.badgeColor}`}
                          >
                            {fl.badge}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-sans block truncate mt-0.5 ${
                            isSelected ? "text-[#F4F0E8]/90 font-medium" : "text-[#77867C]"
                          }`}
                        >
                          {fl.sublabel}
                        </span>
                      </div>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isSelected
                            ? "bg-white"
                            : fl.isConflict
                            ? "bg-rose-400"
                            : "bg-[#23847D]"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Quick Mode Toggles (Isolate / Explode) */}
              <div className="p-2 bg-[#0F1210] border-t border-[rgba(244,240,232,0.08)] grid grid-cols-2 gap-1.5 text-xs font-mono font-bold">
                {onToggleIsolateFloor && (
                  <button
                    onClick={onToggleIsolateFloor}
                    className={`py-1.5 px-2 rounded-[6px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isolateFloor
                        ? "bg-[#B56E48] text-[#F4F0E8] shadow-sm font-bold"
                        : "bg-[#1A201D] hover:bg-[#222A26] text-[#A2B3A8] hover:text-[#F4F0E8] border border-[rgba(244,240,232,0.08)]"
                    }`}
                    title="Isolate selected floor"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>{isolateFloor ? "ISOLATED" : "ISOLATE"}</span>
                  </button>
                )}
                {onToggleExplodeFloors && (
                  <button
                    onClick={onToggleExplodeFloors}
                    className={`py-1.5 px-2 rounded-[6px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      explodeFloors
                        ? "bg-[#23847D] text-[#0F1210] shadow-sm font-bold"
                        : "bg-[#1A201D] hover:bg-[#222A26] text-[#A2B3A8] hover:text-[#F4F0E8] border border-[rgba(244,240,232,0.08)]"
                    }`}
                    title="Explode all floors vertically"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{explodeFloors ? "COLLAPSE" : "EXPLODE"}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Collapsed Compact Circular Icon Button */
            <button
              onClick={() => setIsFloorsExpanded(true)}
              className={`w-10 h-10 rounded-full bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.14)] hover:border-[#C47B50]/60 shadow-xl flex items-center justify-center transition-all cursor-pointer pointer-events-auto group relative ${
                selectedFloorId
                  ? "border-[#C47B50] text-[#C47B50] bg-[#C47B50]/15"
                  : "text-[#C47B50] hover:text-[#F4F0E8] hover:bg-[#B56E48]/20"
              }`}
              title={`Floors Panel (${selectedFloorId || activeBuildingFloors.length + " Levels"} - Click to expand)`}
              aria-label="Expand Floors panel"
            >
              <Layers className="w-4 h-4" />
              {selectedFloorId && (
                <span className="absolute -bottom-1 -left-1 px-1 py-0.2 text-[8.5px] font-mono font-bold bg-[#C47B50] text-white rounded-full leading-none shadow">
                  {selectedFloorId.replace(/^(FL-|floor-)/i, "")}
                </span>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
