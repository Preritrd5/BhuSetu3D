"use client";

import React, { useState } from "react";
import {
  MousePointer,
  Layers,
  Ruler,
  GitCompare,
  History,
  Sparkles,
  Compass,
  Camera,
  Maximize2,
  Map,
  ChevronUp,
  MoreHorizontal,
  X,
} from "lucide-react";
import { SpatialToolType, CameraViewPreset } from "@/types/tools";

interface BottomSpatialToolStripProps {
  activeTool: SpatialToolType | null;
  onSelectTool: (tool: SpatialToolType) => void;
  onToggleLayers?: () => void;
  onOpenAI: () => void;
  onResetCamera: () => void;
  onSetCameraPreset?: (preset: CameraViewPreset) => void;
  onNavigate2D?: () => void;
  onTakeSnapshot?: () => void;
  heading?: number;
  onResetNorth?: () => void;
}

export const BottomSpatialToolStrip: React.FC<BottomSpatialToolStripProps> = ({
  activeTool,
  onSelectTool,
  onToggleLayers,
  onOpenAI,
  onResetCamera,
  onSetCameraPreset,
  onNavigate2D,
  onTakeSnapshot,
  heading,
  onResetNorth,
}) => {
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const isSecondaryActive = activeTool === "COMPARE" || activeTool === "TIMELINE";

  return (
    <div
      role="toolbar"
      aria-label="3D Spatial Tools"
      className="absolute bottom-11 sm:bottom-12 inset-x-0 z-20 flex justify-center pointer-events-none select-none px-2"
    >

      <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.08)] p-1 sm:p-1.5 rounded-[10px] shadow-2xl max-w-full touch-manipulation">
        {/* P0-1: Select / Inspect Tool */}
        <button
          onClick={() => {
            onSelectTool("SELECT");
            setShowMoreMenu(false);
          }}
          role="button"
          aria-pressed={activeTool === "SELECT"}
          aria-label="Inspect 3D Geometry"
          className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-[6px] text-xs font-mono font-bold transition-all cursor-pointer min-h-[40px] sm:min-h-[auto] ${
            activeTool === "SELECT"
              ? "bg-[#B56E48] text-[#F4F0E8] shadow-md"
              : "text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D]"
          }`}
          title="Inspect 3D Geometry [V / I]"
        >
          <MousePointer className="w-4 h-4 flex-shrink-0" />
          <span className="hidden xs:inline">Inspect</span>
        </button>

        {/* P0-2: Toggle Layers Drawer / Rail */}
        {onToggleLayers && (
          <button
            onClick={() => {
              onToggleLayers();
              setShowMoreMenu(false);
            }}
            role="button"
            aria-label="Toggle Spatial Layers"
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-3 sm:py-2 rounded-[6px] text-xs font-mono text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D] transition-all cursor-pointer min-h-[40px] sm:min-h-[auto]"
            title="Toggle Spatial Layers [L]"
          >
            <Layers className="w-4 h-4 flex-shrink-0 text-[#23847D]" />
            <span className="hidden xs:inline">Layers</span>
          </button>
        )}

        {/* P0-3: 3D Measurement Tool */}
        <button
          onClick={() => {
            onSelectTool("MEASURE");
            setShowMoreMenu(false);
          }}
          role="button"
          aria-pressed={activeTool === "MEASURE"}
          aria-label="Measure 3D Distance, Height and Area"
          className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-[6px] text-xs font-mono font-bold transition-all cursor-pointer min-h-[40px] sm:min-h-[auto] ${
            activeTool === "MEASURE"
              ? "bg-[#B56E48] text-[#F4F0E8] shadow-md"
              : "text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D]"
          }`}
          title="Measure 3D Distance, Height & Area [M]"
        >
          <Ruler className="w-4 h-4 flex-shrink-0 text-[#C47B50]" />
          <span className="hidden xs:inline">Measure</span>
        </button>

        {/* Desktop-Only Tools (Shown in toolbar for xl+ screens, hidden in compact mode) */}
        <div className="hidden xl:flex items-center gap-1.5">
          {/* 3D Spatial Comparison Tool */}
          <button
            onClick={() => onSelectTool("COMPARE")}
            role="button"
            aria-pressed={activeTool === "COMPARE"}
            aria-label="Compare Two 3D Objects"
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-[6px] text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTool === "COMPARE"
                ? "bg-[#23847D] text-[#F4F0E8] shadow-md"
                : "text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D]"
            }`}
            title="Compare Two 3D Objects [C]"
          >
            <GitCompare className="w-4 h-4 flex-shrink-0" />
            <span>Compare</span>
          </button>

          {/* 4D Temporal Timeline Scrubber Tool */}
          <button
            onClick={() => onSelectTool("TIMELINE")}
            role="button"
            aria-pressed={activeTool === "TIMELINE"}
            aria-label="4D Temporal Change Detection Timeline"
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-[6px] text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTool === "TIMELINE"
                ? "bg-[#1A201D] text-[#F4F0E8] border border-[#B56E48]"
                : "text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D]"
            }`}
            title="4D Temporal Change Detection [T]"
          >
            <History className="w-4 h-4 flex-shrink-0" />
            <span>4D Timeline</span>
          </button>

          <div className="w-[1px] h-5 bg-[rgba(244,240,232,0.12)] mx-0.5" />

          {/* Camera Views Quick Popover (Desktop) */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowCameraMenu((prev) => !prev)}
              role="button"
              aria-haspopup="menu"
              aria-expanded={showCameraMenu}
              aria-label="Camera View Presets"
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-[6px] text-xs font-mono text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D] transition-all cursor-pointer"
              title="Camera View Presets"
            >
              <Camera className="w-4 h-4" />
              <ChevronUp className={`w-3.5 h-3.5 transition-transform ${showCameraMenu ? "rotate-180" : ""}`} />
            </button>

            {showCameraMenu && (
              <div
                role="menu"
                aria-label="Camera view options"
                className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.12)] rounded-[8px] shadow-2xl p-2 min-w-[190px] flex flex-col gap-1 text-xs font-mono z-30"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    onSetCameraPreset?.("TOP_DOWN");
                    setShowCameraMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-left text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D] transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-[#23847D]" />
                  <span>2D Top-Down (Nadir)</span>
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    onSetCameraPreset?.("BUILDING");
                    setShowCameraMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-left text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D] transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-[#B56E48]" />
                  <span>3D Perspective</span>
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    onSetCameraPreset?.("NORTH");
                    setShowCameraMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-left text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D] transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-[#C47B50]" />
                  <span>Orient North [N]</span>
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    onSetCameraPreset?.("FIT");
                    setShowCameraMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-left text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D] transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#23847D]" />
                  <span>Frame Selected [F]</span>
                </button>
              </div>
            )}
          </div>

          {/* Integrated Spatial Compass (Orient North) */}
          <button
            onClick={onResetNorth || (() => onSetCameraPreset?.("NORTH"))}
            role="button"
            aria-label="Orient camera to True North"
            className="group relative flex items-center justify-center w-8 h-8 rounded-[6px] text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D] transition-all cursor-pointer"
            title="Orient camera to True North (Click to reset) [N]"
          >
            <div
              className="transition-transform duration-100 ease-out flex items-center justify-center"
              style={{ transform: `rotate(${-(heading ?? 0)}deg)` }}
            >
              <div className="relative w-4 h-4 flex flex-col items-center justify-center">
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[7px] border-b-rose-500 mb-[1px]" />
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[7px] border-t-slate-400" />
              </div>
            </div>
            <span className="absolute -top-0.5 right-0.5 font-mono text-[8px] font-bold text-rose-500 select-none">
              N
            </span>
          </button>

          {/* Reset Camera (Home) */}
          <button
            onClick={onResetCamera}
            role="button"
            aria-label="Reset Camera View to Home"
            className="p-2 rounded-[6px] text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D] transition-all flex items-center justify-center cursor-pointer"
            title="Reset Camera (Home)"
          >
            <Compass className="w-4 h-4 flex-shrink-0" />
          </button>
        </div>

        {/* Mobile & Tablet "More" Overflow Trigger */}
        <div className="xl:hidden relative">
          <button
            onClick={() => setShowMoreMenu((prev) => !prev)}
            role="button"
            aria-label="More Spatial Tools"
            className={`flex items-center justify-center gap-1 px-3 py-2 rounded-[6px] text-xs font-mono transition-all cursor-pointer min-h-[40px] ${
              isSecondaryActive || showMoreMenu
                ? "bg-[#1A201D] text-[#F4F0E8] border border-[rgba(244,240,232,0.15)]"
                : "text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D]"
            }`}
            title="More Spatial Tools"
          >
            <MoreHorizontal className="w-4 h-4 flex-shrink-0" />
            <span className="hidden xs:inline">More</span>
            {isSecondaryActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#B56E48]" />
            )}
          </button>

          {/* More Tools Popover Sheet */}
          {showMoreMenu && (
            <div
              className="absolute bottom-14 right-0 bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.12)] rounded-[10px] shadow-2xl p-2 min-w-[210px] flex flex-col gap-1 text-xs font-mono z-30"
            >
              <div className="px-2.5 py-1 text-xs uppercase tracking-wider text-[#94A3B8] font-bold border-b border-[rgba(244,240,232,0.08)] flex items-center justify-between">
                <span>Spatial Tools</span>
                <button onClick={() => setShowMoreMenu(false)} className="text-[#8C988F] hover:text-[#F4F0E8] p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Compare */}
              <button
                onClick={() => {
                  onSelectTool("COMPARE");
                  setShowMoreMenu(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-left transition-colors cursor-pointer ${
                  activeTool === "COMPARE" ? "bg-[#23847D] text-[#F4F0E8]" : "text-[#D9D2C5] hover:bg-[#1A201D]"
                }`}
              >
                <GitCompare className="w-4 h-4 text-[#2EB8B0]" />
                <span>Compare Objects [C]</span>
              </button>

              {/* 4D Timeline */}
              <button
                onClick={() => {
                  onSelectTool("TIMELINE");
                  setShowMoreMenu(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-left transition-colors cursor-pointer ${
                  activeTool === "TIMELINE" ? "bg-[#B56E48] text-[#F4F0E8]" : "text-[#D9D2C5] hover:bg-[#1A201D]"
                }`}
              >
                <History className="w-4 h-4 text-[#C47B50]" />
                <span>4D Timeline [T]</span>
              </button>

              {/* Camera Views Divider */}
              <div className="pt-1.5 border-t border-[rgba(244,240,232,0.08)] px-2 text-xs text-[#94A3B8] uppercase font-bold">
                Camera Presets
              </div>

              <div className="grid grid-cols-2 gap-1 px-1">
                <button
                  onClick={() => {
                    onSetCameraPreset?.("TOP_DOWN");
                    setShowMoreMenu(false);
                  }}
                  className="p-1.5 rounded-[4px] bg-[#1A201D] text-[11px] text-[#D9D2C5] hover:text-[#F4F0E8] text-center"
                >
                  2D Nadir
                </button>
                <button
                  onClick={() => {
                    onSetCameraPreset?.("BUILDING");
                    setShowMoreMenu(false);
                  }}
                  className="p-1.5 rounded-[4px] bg-[#1A201D] text-[11px] text-[#D9D2C5] hover:text-[#F4F0E8] text-center"
                >
                  3D View
                </button>
                <button
                  onClick={() => {
                    onSetCameraPreset?.("NORTH");
                    setShowMoreMenu(false);
                  }}
                  className="p-1.5 rounded-[4px] bg-[#1A201D] text-[11px] text-[#D9D2C5] hover:text-[#F4F0E8] text-center"
                >
                  Orient N
                </button>
                <button
                  onClick={() => {
                    onResetCamera();
                    setShowMoreMenu(false);
                  }}
                  className="p-1.5 rounded-[4px] bg-[#1A201D] text-[11px] text-[#D9D2C5] hover:text-[#F4F0E8] text-center"
                >
                  Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
