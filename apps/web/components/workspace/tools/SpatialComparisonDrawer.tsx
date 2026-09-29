"use client";

import React from "react";
import {
  GitCompare,
  X,
  CheckCircle2,
} from "lucide-react";
import { ComparisonState } from "@/types/tools";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";

interface SpatialComparisonDrawerProps {
  comparisonState: ComparisonState;
  onClose: () => void;
  onFocusEntityA?: () => void;
  onFocusEntityB?: () => void;
  onSelectEntityB?: (level: SpatialLevel, id: string) => void;
  className?: string;
}

export const SpatialComparisonDrawer: React.FC<SpatialComparisonDrawerProps> = ({
  comparisonState,
  onClose,
  onFocusEntityA,
  onFocusEntityB,
  onSelectEntityB,
  className = "",
}) => {
  const { entityA, entityB, status } = comparisonState;

  if (!comparisonState.isActive) return null;

  const metaA = entityA?.metadata || {};
  const metaB = entityB?.metadata || {};

  const isBothBuildings = entityA?.entityType === "BUILDING" && entityB?.entityType === "BUILDING";
  const heightDelta =
    isBothBuildings && metaA.observed_height !== undefined && metaB.observed_height !== undefined
      ? metaA.observed_height - metaB.observed_height
      : null;

  const floorDelta =
    isBothBuildings && metaA.detected_floors !== undefined && metaB.detected_floors !== undefined
      ? metaA.detected_floors - metaB.detected_floors
      : null;

  return (
    <div
      className={`fixed top-20 right-4 z-20 w-[400px] max-w-[calc(100vw-2rem)] select-none transition-all duration-200 animate-in fade-in slide-in-from-right-4 ${className}`}
    >
      <div className="bg-[#141816] border border-[rgba(244,240,232,0.10)] rounded-[10px] shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-6.5rem)] font-sans text-xs">
        {/* Header */}
        <div className="p-3.5 border-b border-[rgba(244,240,232,0.08)] bg-[#141816] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.12)] flex items-center justify-center text-[#C47B50]">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-[#F4F0E8] text-sm tracking-tight">
                  Spatial Comparison
                </h3>
                <span className="px-1.5 py-0.5 rounded-[4px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] text-[9px] font-mono text-[#6F7772]">
                  A vs B
                </span>
              </div>
              <span className="text-[11px] text-[#77867C] font-mono block">
                {status === "SELECTING_B"
                  ? "Select second object in 3D or Outliner"
                  : "Side-by-side metric comparison"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[5px] hover:bg-[#1A201D] text-[#6F7772] hover:text-[#F4F0E8] transition-colors cursor-pointer"
            title="Exit Comparison [Esc]"
            aria-label="Close comparison drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 overflow-y-auto space-y-3">
          {/* Object A & Object B Banner */}
          <div className="grid grid-cols-2 gap-2">
            {/* Object A Card */}
            <div className="p-3 rounded-[8px] bg-[#176C68]/10 border border-[#176C68]/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#176C68]/20 text-[#23847D] border border-[#176C68]/30 text-xs font-mono font-bold">
                    OBJECT A
                  </span>
                  {entityA && onFocusEntityA && (
                    <button
                      onClick={onFocusEntityA}
                      className="text-xs text-[#23847D] hover:underline font-mono cursor-pointer font-medium"
                    >
                      Focus
                    </button>
                  )}
                </div>
                <span className="font-bold text-[#F4F0E8] block text-xs truncate" title={entityA?.title}>
                  {entityA?.title || "No selection"}
                </span>
                <span className="text-xs text-[#94A3B8] font-mono block truncate mt-0.5">
                  {entityA?.code || entityA?.entityId || "—"}
                </span>
              </div>
            </div>

            {/* Object B Card */}
            <div className="p-3 rounded-[8px] bg-[#B56E48]/10 border border-[#B56E48]/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#B56E48]/20 text-[#C47B50] border border-[#B56E48]/30 text-xs font-mono font-bold">
                    OBJECT B
                  </span>
                  {entityB && onFocusEntityB && (
                    <button
                      onClick={onFocusEntityB}
                      className="text-xs text-[#C47B50] hover:underline font-mono cursor-pointer font-medium"
                    >
                      Focus
                    </button>
                  )}
                </div>
                <span className="font-bold text-[#F4F0E8] block text-xs truncate" title={entityB?.title}>
                  {entityB?.title || (
                    <span className="text-[#C47B50]/80 animate-pulse">Pick object in 3D...</span>
                  )}
                </span>
                <span className="text-xs text-[#94A3B8] font-mono block truncate mt-0.5">
                  {entityB?.code || entityB?.entityId || "Awaiting pick"}
                </span>
              </div>
            </div>
          </div>

          {/* Variance Highlight Bar */}
          {entityA && entityB && heightDelta !== null && (
            <div className="p-3 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.08)] flex items-center justify-between font-mono">
              <span className="text-[11px] text-[#6F7772]">Height Variance (A − B):</span>
              <span
                className={`text-xs font-bold ${
                  heightDelta > 0 ? "text-[#C47B50]" : heightDelta < 0 ? "text-[#23847D]" : "text-[#D9D2C5]"
                }`}
              >
                {heightDelta > 0 ? `+${heightDelta.toFixed(2)}m` : `${heightDelta.toFixed(2)}m`}
                {floorDelta !== null && floorDelta !== 0 && (
                  <span className="text-[10px] ml-1.5 text-[#6F7772]">
                    ({floorDelta > 0 ? `+${floorDelta}` : floorDelta} floors)
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Comparative Metrics Table */}
          {entityA && entityB ? (
            <div className="space-y-1 font-mono text-[11px]">
              <div className="text-[10px] font-semibold text-[#6F7772] uppercase tracking-widest px-1">
                Comparative Metrics
              </div>

              {[
                {
                  label: "Typology",
                  a: metaA.building_type || metaA.land_use || "Standard",
                  b: metaB.building_type || metaB.land_use || "Standard",
                  aColor: "text-[#23847D]",
                  bColor: "text-[#C47B50]",
                },
                ...(metaA.observed_height !== undefined || metaB.observed_height !== undefined
                  ? [{ label: "Observed Height", a: `${metaA.observed_height ?? "—"}m`, b: `${metaB.observed_height ?? "—"}m`, aColor: "text-[#23847D] font-bold", bColor: "text-[#C47B50] font-bold" }]
                  : []),
                ...(metaA.detected_floors !== undefined || metaB.detected_floors !== undefined
                  ? [{ label: "Floors Count", a: `${metaA.detected_floors ?? "—"} Floors`, b: `${metaB.detected_floors ?? "—"} Floors`, aColor: "text-[#F4F0E8]", bColor: "text-[#F4F0E8]" }]
                  : []),
                ...(metaA.recorded_area_sqm !== undefined || metaB.recorded_area_sqm !== undefined
                  ? [{ label: "Surface Area", a: `${metaA.recorded_area_sqm ?? metaA.carpet_area_sqm ?? "—"}m²`, b: `${metaB.recorded_area_sqm ?? metaB.carpet_area_sqm ?? "—"}m²`, aColor: "text-[#F4F0E8]", bColor: "text-[#F4F0E8]" }]
                  : []),
              ].map(({ label, a, b, aColor, bColor }) => (
                <div key={label} className="p-2.5 rounded-[7px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)] flex items-center justify-between">
                  <span className="text-[#6F7772]">{label}</span>
                  <div className="flex items-center gap-3">
                    <span className={aColor}>{a}</span>
                    <span className="text-[#6F7772]/50 text-[10px]">vs</span>
                    <span className={bColor}>{b}</span>
                  </div>
                </div>
              ))}

              <div className="p-2.5 rounded-[7px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)] flex items-center justify-between">
                <span className="text-[#6F7772]">Discrepancy</span>
                <div className="flex items-center gap-3">
                  <span className={metaA.has_discrepancy ? "text-rose-400 font-bold" : "text-emerald-400"}>
                    {metaA.has_discrepancy ? "Variance" : "Sanctioned"}
                  </span>
                  <span className="text-[#6F7772]/50 text-[10px]">vs</span>
                  <span className={metaB.has_discrepancy ? "text-rose-400 font-bold" : "text-emerald-400"}>
                    {metaB.has_discrepancy ? "Variance" : "Sanctioned"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-[8px] bg-[#0F1210] border border-dashed border-[rgba(244,240,232,0.10)] text-center space-y-3">
              <span className="text-[#D9D2C5] font-medium block">
                Click another building or parcel in the 3D scene
              </span>
              <span className="text-[#6F7772] font-mono text-[10px] block">
                The comparison drawer will automatically compute variances in height, footprint, and zoning.
              </span>
              {onSelectEntityB && (
                <div className="pt-2 border-t border-[rgba(244,240,232,0.06)]">
                  <span className="text-[10px] text-[#6F7772] font-mono block mb-2 uppercase tracking-wider">
                    Or Quick Compare With:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectEntityB("BUILDING", "77777777-7777-4000-8000-000000000101")}
                      className="w-full py-1.5 px-2.5 rounded-[6px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] text-[11px] font-mono text-[#23847D] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-semibold">Malleshwaram Residency</span>
                      <span className="text-[10px] text-[#6F7772]">Residential · 2 Fl</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectEntityB("BUILDING", "77777777-7777-4000-8000-000000000103")}
                      className="w-full py-1.5 px-2.5 rounded-[6px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] text-[11px] font-mono text-[#D9D2C5] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-semibold">Green Valley Arcade</span>
                      <span className="text-[10px] text-[#6F7772]">Mixed Use · 3 Fl</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[rgba(244,240,232,0.08)] bg-[#141816] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-[6px] bg-[#1A201D] hover:bg-[#243029] text-[#D9D2C5] text-[11px] font-mono transition-colors cursor-pointer"
          >
            Exit Compare [Esc]
          </button>

          {entityA && entityB && (
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Comparison Synchronized</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
