"use client";

import React from "react";
import {
  Ruler,
  ArrowUpDown,
  Square,
  RotateCcw,
  X,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { MeasurementMode, MeasurementResult } from "@/types/tools";

interface MeasurementHUDProps {
  mode: MeasurementMode;
  onSelectMode: (mode: MeasurementMode) => void;
  result: MeasurementResult | null;
  pointCount: number;
  onClear: () => void;
  onClose: () => void;
  className?: string;
}

export const MeasurementHUD: React.FC<MeasurementHUDProps> = ({
  mode,
  onSelectMode,
  result,
  pointCount,
  onClear,
  onClose,
  className = "",
}) => {
  const getInstruction = () => {
    switch (mode) {
      case "DISTANCE":
        if (pointCount === 0) return "Click first point on 3D geometry";
        if (pointCount === 1) return "Click second point to measure 3D distance";
        return "Measurement complete. Click 'Clear' to measure again.";
      case "HEIGHT":
        if (pointCount === 0) return "Click base point (e.g. ground or slab level)";
        if (pointCount === 1) return "Click top point (e.g. roof or ceiling level)";
        return "Height delta computed. Click 'Clear' to measure again.";
      case "AREA":
        if (pointCount < 3)
          return `Click points to trace polygon boundary (${pointCount}/3 minimum)`;
        return `Polygon has ${pointCount} vertices. Click more points or view computed area below.`;
      default:
        return "Click on 3D geometry to measure";
    }
  };

  return (
    <div
      className={`fixed top-20 inset-x-0 z-30 flex justify-center pointer-events-none select-none animate-in fade-in slide-in-from-top-4 duration-200 ${className}`}
    >
      <div className="pointer-events-auto flex flex-col items-center gap-2 max-w-xl w-full px-4">
        {/* Main Floating Tool Strip */}
        <div className="flex items-center gap-2 p-2 px-3 rounded-full bg-[#0F1210]/95 backdrop-blur-sm border border-[rgba(244,240,232,0.12)] shadow-lg text-xs font-mono">
          <div className="flex items-center gap-1.5 pr-2 border-r border-[rgba(244,240,232,0.08)] text-[#C47B50]">
            <Ruler className="w-4 h-4" />
            <span className="font-bold text-[11px] tracking-widest uppercase text-[#F4F0E8]">3D MEASURE</span>
          </div>

          {/* Mode Toggles: Distance, Height, Area */}
          <div className="flex items-center gap-1 bg-[#141816] p-0.5 rounded-full border border-[rgba(244,240,232,0.08)]">
            <button
              onClick={() => onSelectMode("DISTANCE")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                mode === "DISTANCE"
                  ? "bg-[#B56E48] text-[#F4F0E8] font-semibold"
                  : "text-[#6F7772] hover:text-[#D9D2C5]"
              }`}
              title="Measure 3D point-to-point Euclidean distance"
            >
              <Ruler className="w-3 h-3" />
              <span>Distance</span>
            </button>

            <button
              onClick={() => onSelectMode("HEIGHT")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                mode === "HEIGHT"
                  ? "bg-[#B56E48] text-[#F4F0E8] font-semibold"
                  : "text-[#6F7772] hover:text-[#D9D2C5]"
              }`}
              title="Measure vertical elevation delta (ΔZ)"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>Height Δ</span>
            </button>

            <button
              onClick={() => onSelectMode("AREA")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                mode === "AREA"
                  ? "bg-[#B56E48] text-[#F4F0E8] font-semibold"
                  : "text-[#6F7772] hover:text-[#D9D2C5]"
              }`}
              title="Measure polygon surface area"
            >
              <Square className="w-3 h-3" />
              <span>Area</span>
            </button>
          </div>

          {/* Actions: Clear & Close */}
          <div className="flex items-center gap-1 pl-1 border-l border-[rgba(244,240,232,0.08)]">
            <button
              onClick={onClear}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-[#1A201D] text-[#6F7772] hover:text-[#F4F0E8] transition-colors text-[10px] cursor-pointer"
              title="Clear current measurement points"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-[#1A201D] text-[#6F7772] hover:text-[#F4F0E8] transition-colors cursor-pointer"
              title="Exit measurement mode [Esc]"
              aria-label="Close measurement tool"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Instruction & Result Card */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F1210]/90 backdrop-blur-sm border border-[rgba(244,240,232,0.10)] text-[10px] font-mono text-[#D9D2C5] shadow-sm">
            <HelpCircle className="w-3 h-3 text-[#C47B50] shrink-0" />
            <span>{getInstruction()}</span>
          </div>

          {result && result.isComplete && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#0F1210]/95 backdrop-blur-sm border border-[#B56E48]/40 shadow-lg animate-in fade-in zoom-in-95 duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-[10px] uppercase tracking-wider text-[#6F7772]">
                  Computed {result.mode}:
                </span>
                <span className="text-base font-extrabold text-[#C47B50] tracking-tight">
                  {result.formattedValue}
                </span>
                {result.horizontalDistance !== undefined && result.mode === "DISTANCE" && (
                  <span className="text-[10px] text-[#77867C]">
                    (Horiz: {result.horizontalDistance.toFixed(2)}m, ΔZ: {result.heightDelta?.toFixed(2)}m)
                  </span>
                )}
                {result.perimeter !== undefined && result.mode === "AREA" && (
                  <span className="text-[10px] text-[#77867C]">
                    (Perimeter: {result.perimeter.toFixed(2)}m)
                  </span>
                )}
              </div>
              <span className="px-1.5 py-0.5 rounded-[4px] bg-[#1A201D] border border-[rgba(244,240,232,0.10)] text-[9px] font-mono text-[#D9D2C5]">
                COMPUTED GEOMETRY
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
