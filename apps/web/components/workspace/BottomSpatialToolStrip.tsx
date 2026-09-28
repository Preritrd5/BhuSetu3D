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
}) => {
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  return (
    <div
      role="toolbar"
      aria-label="3D Spatial Tools"
      className="absolute bottom-11 inset-x-0 z-20 flex justify-center pointer-events-none select-none max-sm:bottom-3 px-2"
    >
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.10)] p-1.5 rounded-[10px] shadow-2xl max-w-full overflow-x-auto no-scrollbar touch-manipulation">
        {/* Select / Inspect Tool */}
        <button
          onClick={() => onSelectTool("SELECT")}
          role="button"
          aria-pressed={activeTool === "SELECT"}
          aria-label="Inspect 3D Geometry"
          className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-[6px] text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTool === "SELECT"
              ? "bg-[#B56E48] text-[#F4F0E8] shadow-md"
              : "text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D]"
          }`}
          title="Inspect 3D Geometry [V / I]"
        >
          <MousePointer className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Inspect</span>
        </button>

        {/* Toggle Layers Rail */}
        {onToggleLayers && (
          <button
            onClick={onToggleLayers}
            role="button"
            aria-label="Toggle Spatial Layers"
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-[6px] text-xs font-mono text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D] transition-all cursor-pointer"
            title="Toggle Spatial Layers [L]"
          >
            <Layers className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Layers</span>
          </button>
        )}

        {/* 3D Measurement Tool */}
        <button
          onClick={() => onSelectTool("MEASURE")}
          role="button"
          aria-pressed={activeTool === "MEASURE"}
          aria-label="Measure 3D Distance, Height and Area"
          className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-[6px] text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTool === "MEASURE"
              ? "bg-[#B56E48] text-[#F4F0E8] shadow-md"
              : "text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D]"
          }`}
          title="Measure 3D Distance, Height & Area [M]"
        >
          <Ruler className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Measure</span>
        </button>

        {/* 3D Spatial Comparison Tool */}
        <button
          onClick={() => onSelectTool("COMPARE")}
          role="button"
          aria-pressed={activeTool === "COMPARE"}
          aria-label="Compare Two 3D Objects"
          className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-[6px] text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTool === "COMPARE"
              ? "bg-[#23847D] text-[#F4F0E8] shadow-md"
              : "text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D]"
          }`}
          title="Compare Two 3D Objects [C]"
        >
          <GitCompare className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Compare</span>
        </button>

        {/* 4D Temporal Timeline Scrubber Tool */}
        <button
          onClick={() => onSelectTool("TIMELINE")}
          role="button"
          aria-pressed={activeTool === "TIMELINE"}
          aria-label="4D Temporal Change Detection Timeline"
          className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-[6px] text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTool === "TIMELINE"
              ? "bg-[#1A201D] text-[#F4F0E8] border border-[#B56E48]"
              : "text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#1A201D]"
          }`}
          title="4D Temporal Change Detection [T]"
        >
          <History className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">4D Timeline</span>
        </button>

        <div className="w-[1px] h-5 bg-[rgba(244,240,232,0.12)] mx-0.5 sm:mx-1 flex-shrink-0" />

        {/* Camera Views Quick Popover */}
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

        {/* 2D Cadastre Switcher */}
        {onNavigate2D && (
          <button
            onClick={onNavigate2D}
            role="button"
            aria-label="Switch to 2D Cadastral Map"
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-[6px] text-xs font-mono text-[#D9D2C5] hover:text-[#23847D] hover:bg-[#1A201D] transition-all cursor-pointer"
            title="Switch to 2D Cadastral Map [2]"
          >
            <Map className="w-4 h-4 text-[#23847D] flex-shrink-0" />
            <span className="hidden md:inline">2D Cadastre</span>
          </button>
        )}

        <div className="w-[1px] h-5 bg-[rgba(244,240,232,0.12)] mx-0.5 sm:mx-1 flex-shrink-0" />

        {/* Grounded AI Spatial Investigator */}
        <button
          onClick={onOpenAI}
          role="button"
          aria-label="Ask BhuSetu Spatial Intelligence"
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-[6px] text-xs font-mono font-bold bg-[#1A201D] border border-[rgba(244,240,232,0.12)] text-[#F4F0E8] hover:border-[#B56E48] transition-all cursor-pointer"
          title="Ask BhuSetu Spatial Intelligence"
        >
          <Sparkles className="w-4 h-4 text-[#C47B50] flex-shrink-0" />
          <span className="hidden sm:inline">Ask BhuSetu</span>
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
    </div>
  );
};
