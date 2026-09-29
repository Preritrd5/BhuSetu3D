"use client";

import React, { useState } from "react";
import {
  Layers,
  Compass,
  AlertTriangle,
  Spline,
  CheckCircle2,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Ruler,
  MapPin,
  ExternalLink,
  ChevronRight,
  Info,
  Maximize2,
} from "lucide-react";

interface FloorLayer {
  id: number;
  code: string;
  name: string;
  space: string;
  unit: string;
  height: string;
  elev: string;
  datumOffset: string;
  use: string;
  area: string;
  isDeviation: boolean;
  deviationLabel?: string;
  setbackDeviation?: string;
  auditId?: string;
  badge: string;
  sanctionedHeight: string;
  fsiImpact: string;
}

const FLOORS: FloorLayer[] = [
  {
    id: 3,
    code: "FL-03",
    name: "Third Floor",
    space: "Corporate Suites",
    unit: "KA-BLR-2026-P102-B1-F3-U04",
    height: "4.0m",
    elev: "931.0m – 935.0m MSL",
    datumOffset: "+12.0m",
    use: "Commercial Office",
    area: "240.0 m²",
    isDeviation: true,
    deviationLabel: "Sanction Limit Exceeded (+1 Physical Floor)",
    setbackDeviation: "Facade Setback Deviation: +14.20 m² Eastward projection",
    auditId: "Airborne LiDAR Audit #4092",
    badge: "Height Deviation",
    sanctionedHeight: "3.0m (Deviation: +1.0m)",
    fsiImpact: "+0.46 FSI Overhang",
  },
  {
    id: 2,
    code: "FL-02",
    name: "Second Floor",
    space: "Tech Workspace",
    unit: "KA-BLR-2026-P102-B1-F2-U03",
    height: "3.5m",
    elev: "927.5m – 931.0m MSL",
    datumOffset: "+8.5m",
    use: "IT & Innovation Space",
    area: "240.0 m²",
    isDeviation: false,
    badge: "Compliant",
    sanctionedHeight: "3.5m (Approved)",
    fsiImpact: "Within Sanctioned Quota",
  },
  {
    id: 1,
    code: "FL-01",
    name: "First Floor",
    space: "Diagnostic Center",
    unit: "KA-BLR-2026-P102-B1-F1-U02",
    height: "3.5m",
    elev: "924.0m – 927.5m MSL",
    datumOffset: "+5.0m",
    use: "Healthcare & Clinic",
    area: "240.0 m²",
    isDeviation: false,
    badge: "Compliant",
    sanctionedHeight: "3.5m (Approved)",
    fsiImpact: "Within Sanctioned Quota",
  },
  {
    id: 0,
    code: "FL-00",
    name: "Ground Floor",
    space: "Banking Concourse",
    unit: "KA-BLR-2026-P102-B1-F0-U01",
    height: "3.5m",
    elev: "920.5m – 924.0m MSL",
    datumOffset: "+1.5m",
    use: "Retail Banking Branch",
    area: "240.0 m²",
    isDeviation: false,
    badge: "Compliant",
    sanctionedHeight: "3.5m (Approved)",
    fsiImpact: "Within Sanctioned Quota",
  },
];

export function Hero3DPropertyVisual() {
  const [exploded, setExploded] = useState(true);
  const [selectedLayerId, setSelectedLayerId] = useState<number | string>(3); // Default to FL-03 to highlight violation immediately

  const isFloorSelected = typeof selectedLayerId === "number";
  const activeFloor = isFloorSelected ? FLOORS.find((f) => f.id === selectedLayerId) : null;
  const isParcelSelected = selectedLayerId === "parcel";
  const isUtilitiesSelected = selectedLayerId === "utilities";

  return (
    <div className="w-full relative rounded-[14px] bg-[#101412]/90 border border-[rgba(244,240,232,0.06)] p-5 sm:p-7 lg:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.65)] overflow-hidden">
      {/* Precision Crosshairs in Corners - Restrained technical cues */}
      <span className="absolute top-2.5 left-2.5 font-mono text-[10px] text-[#4A554F] select-none pointer-events-none">+</span>
      <span className="absolute top-2.5 right-2.5 font-mono text-[10px] text-[#4A554F] select-none pointer-events-none">+</span>
      <span className="absolute bottom-2.5 left-2.5 font-mono text-[10px] text-[#4A554F] select-none pointer-events-none">+</span>
      <span className="absolute bottom-2.5 right-2.5 font-mono text-[10px] text-[#4A554F] select-none pointer-events-none">+</span>

      {/* ============================================================ */}
      {/* 1. VIEWPORT CONTROL & ASSET METADATA BAR                      */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[rgba(244,240,232,0.06)] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#176C68] shadow-[0_0_8px_rgba(23,108,104,0.6)] shrink-0" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs sm:text-sm font-bold text-[#F4F0E8] tracking-wider">
                BLD-KA-BLR-102
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-[3px] bg-[#161B18] border border-[rgba(244,240,232,0.06)] text-[#A7B3AB] font-medium tracking-wide">
                LOD2 VOLUMETRIC EXTENSION
              </span>
            </div>
            <div className="text-xs font-mono text-[#CBD5E1] truncate mt-0.5">
              Aura Horizon Commercial Complex · Malleshwaram W-101
            </div>
          </div>
        </div>

        {/* View Controls & Action Mode Toggle */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setExploded(!exploded)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[5px] bg-[#171C19] border border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.18)] hover:bg-[#1E2420] text-xs font-mono text-[#F4F0E8] transition-all cursor-pointer"
            title="Toggle between assembled vertical section and exploded strata slices"
          >
            <Layers className="w-3.5 h-3.5 text-[#B56E48]" />
            <span>{exploded ? "Assembled Section" : "Explode 3D Slices"}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. MAIN BALANCED WORKSPACE: DUAL-COLUMN GEOSPATIAL LAYOUT    */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 pt-6 pb-4 items-start relative z-10">
        
        {/* ========================================================== */}
        {/* LEFT COLUMN: INTERACTIVE VERTICAL STRATA SECTION (Col 7/12)*/}
        {/* ========================================================== */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col w-full">
          
          {/* Section Sub-header / Architectural Strata Label */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[rgba(244,240,232,0.04)] text-xs font-mono text-[#94A3B8]">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B56E48]" />
              <span className="tracking-wider uppercase text-[#CBD5E1] font-semibold">
                Vertical Cadastral Strata
              </span>
              <span>·</span>
              <span className="text-[#94A3B8]">Click layer to inspect telemetry</span>
            </span>
            <span className="hidden sm:inline text-[#94A3B8]">
              {exploded ? "Exploded Elevation View" : "Assembled Profile"}
            </span>
          </div>

          {/* Interactive Strata Stack with Elevation Guide Axis */}
          <div className="relative flex flex-col w-full pl-0 sm:pl-7">
            
            {/* Left Elevation Datum Guide Axis (Visible on sm+ screens) */}
            <div className="hidden sm:block absolute left-2 top-2 bottom-8 w-[1px] bg-[rgba(244,240,232,0.06)]">
              {/* Elevation Axis Markers */}
              <div className="absolute top-0 -left-1.5 w-3 h-[1px] bg-[#B56E48]/60" />
              <div className="absolute top-[25%] -left-1.5 w-3 h-[1px] bg-[rgba(244,240,232,0.12)]" />
              <div className="absolute top-[50%] -left-1.5 w-3 h-[1px] bg-[rgba(244,240,232,0.12)]" />
              <div className="absolute top-[75%] -left-1.5 w-3 h-[1px] bg-[rgba(244,240,232,0.12)]" />
              <div className="absolute bottom-6 -left-1.5 w-3 h-[1px] bg-[#176C68]/60" />
              <div className="absolute bottom-0 -left-1.5 w-3 h-[1px] bg-[rgba(244,240,232,0.12)]" />
            </div>

            {/* A. SUPERSTRUCTURE FLOORS (FL-03 DOWN TO FL-00) */}
            <div className={`w-full flex flex-col transition-all duration-300 ${exploded ? "space-y-3" : "space-y-1.5"}`}>
              {FLOORS.map((f, idx) => {
                const isSelected = selectedLayerId === f.id;

                return (
                  <div key={f.id} className="relative group w-full">
                    {/* Layer Card Container */}
                    <div
                      onClick={() => setSelectedLayerId(f.id)}
                      className={`w-full rounded-[8px] p-3.5 sm:p-4 transition-all duration-200 cursor-pointer border text-left ${
                        f.isDeviation
                          ? isSelected
                            ? "bg-[#1A1512] border-[#B56E48]/60 ring-1 ring-[#B56E48]/30 shadow-[0_4px_20px_rgba(181,110,72,0.12)]"
                            : "bg-[#161311] border-[#B56E48]/35 hover:border-[#B56E48]/55 hover:bg-[#1A1512]"
                          : isSelected
                            ? "bg-[#141B18] border-[#23847D]/60 ring-1 ring-[#23847D]/30 shadow-[0_4px_20px_rgba(35,132,125,0.1)]"
                            : "bg-[#121614] border-[rgba(244,240,232,0.06)] hover:border-[rgba(244,240,232,0.14)] hover:bg-[#151A18]"
                      }`}
                    >
                      {/* Primary Floor Content Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        
                        {/* Left: Code Box + Level Identity */}
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          {/* Floor Level Box */}
                          <div
                            className={`w-10 h-10 rounded-[5px] flex flex-col items-center justify-center shrink-0 font-mono border ${
                              f.isDeviation
                                ? "bg-[#211915] border-[#B56E48]/40 text-[#E09F67]"
                                : "bg-[#0E1210] border-[rgba(244,240,232,0.08)] text-[#CBD5E1]"
                            }`}
                          >
                            <span className="text-xs font-bold leading-tight">{f.code}</span>
                            <span className="text-[9px] text-[#94A3B8] font-normal leading-tight">{f.datumOffset}</span>
                          </div>

                          {/* Space & Demarcation Metadata */}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-[#F4F0E8] tracking-wide">
                                {f.space}
                              </span>
                              {f.isDeviation && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-[#B56E48]/15 text-[#E09F67] border border-[#B56E48]/35 font-bold uppercase tracking-wider">
                                  UNSANCTIONED
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-[#CBD5E1] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              <span className="text-[#2EB8B0] font-semibold">{f.unit}</span>
                              <span className="text-[#6F7772]">·</span>
                              <span>{f.elev}</span>
                              <span className="text-[#6F7772]">·</span>
                              <span className="text-[#94A3B8]">{f.use}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Status Badge & Dimension Metrics */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[rgba(244,240,232,0.04)]">
                          <span
                            className={`text-[11px] font-mono px-2.5 py-0.5 rounded-[3px] border font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                              f.isDeviation
                                ? "bg-[#B56E48]/15 text-[#E09F67] border-[#B56E48]/35"
                                : "bg-[#176C68]/15 text-[#2EB8B0] border-[#176C68]/30"
                            }`}
                          >
                            {!f.isDeviation && <CheckCircle2 className="w-3 h-3 text-[#2EB8B0]" />}
                            {f.badge}
                          </span>
                          <div className="text-xs font-mono text-[#CBD5E1] mt-0.5">
                            {f.area} · H: {f.height}
                          </div>
                        </div>
                      </div>

                      {/* Explicit Linked Warning Drawer for FL-03 (Problem 1 & 9 Fix: Zero Overlap) */}
                      {f.isDeviation && (
                        <div className="mt-3 pt-2.5 border-t border-[#B56E48]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono bg-[#B56E48]/8 -mx-3.5 sm:-mx-4 -mb-3.5 sm:-mb-4 px-3.5 sm:px-4 py-2 rounded-b-[7px]">
                          <div className="flex items-center gap-2 text-[#E09F67]">
                            <AlertTriangle className="w-4 h-4 text-[#B56E48] shrink-0" />
                            <span className="font-semibold text-[#F4F0E8]">
                              Facade Setback Deviation:
                            </span>
                            <span className="text-[#E09F67]">+14.20 m² Eastward</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#A7B3AB]">
                            <span className="px-1.5 py-0.5 rounded bg-[#161B18] border border-[#B56E48]/30 text-[#E09F67] font-semibold">
                              LiDAR Audit #4092
                            </span>
                            <span className="hidden md:inline text-[#94A3B8]">· Sanction Exceeded</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Structural Vertical Connector between floors */}
                    {exploded && idx < FLOORS.length - 1 && (
                      <div className="hidden sm:block absolute left-5 -bottom-3 w-[1px] h-3 bg-[rgba(244,240,232,0.1)]" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* B. GROUND CADASTRAL PARCEL PLANE (SURFACE CADASTRE) */}
            <div className={`w-full transition-all duration-300 ${exploded ? "mt-3.5" : "mt-2"}`}>
              <div
                onClick={() => setSelectedLayerId("parcel")}
                className={`w-full rounded-[8px] p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer text-left ${
                  isParcelSelected
                    ? "bg-[#111A17] border-[#176C68]/60 ring-1 ring-[#176C68]/30 shadow-[0_4px_20px_rgba(23,108,104,0.15)]"
                    : "bg-[#0F1714] border-[#176C68]/30 hover:border-[#176C68]/50 hover:bg-[#121B17]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[5px] bg-[#176C68]/20 border border-[#176C68]/35 flex flex-col items-center justify-center shrink-0 font-mono text-[#2EB8B0]">
                      <span className="text-xs font-bold leading-tight">2D</span>
                      <span className="text-[9px] text-[#2EB8B0]/70 font-normal leading-tight">0.0m</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold font-mono text-[#2EB8B0] tracking-wide">
                          SURVEY PARCEL 102/3B
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-[#176C68]/15 border border-[#176C68]/35 text-[#2EB8B0] font-semibold uppercase">
                          REGISTERED CADASTRE
                        </span>
                      </div>
                      <div className="text-xs font-mono text-[#CBD5E1] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="text-[#A7B3AB] font-medium">KA-BLR-2026-P102</span>
                        <span className="text-[#6F7772]">·</span>
                        <span>Area: 520.00 m²</span>
                        <span className="text-[#6F7772]">·</span>
                        <span className="text-[#94A3B8]">Base Datum: 920.50m MSL</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[rgba(244,240,232,0.04)]">
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-[3px] bg-[#176C68]/15 border border-[#176C68]/30 text-[#2EB8B0] font-bold uppercase tracking-wide">
                      GROUND BOUNDARY
                    </span>
                    <div className="text-xs font-mono text-[#CBD5E1] mt-0.5">
                      FSI: 1.50 Max Permitted
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* C. SUBSURFACE MUNICIPAL UTILITY INFRASTRUCTURE CUTAWAY */}
            {/* Generous bottom spacing ensures zero clipping (Problem 2 Fix) */}
            <div className={`w-full transition-all duration-300 ${exploded ? "mt-3.5" : "mt-2"}`}>
              <div
                onClick={() => setSelectedLayerId("utilities")}
                className={`w-full rounded-[8px] p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer text-left ${
                  isUtilitiesSelected
                    ? "bg-[#151816] border-[rgba(244,240,232,0.18)] ring-1 ring-[rgba(244,240,232,0.1)] shadow-md"
                    : "bg-[#111412] border-[rgba(244,240,232,0.06)] hover:border-[rgba(244,240,232,0.14)] hover:bg-[#141816]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[5px] bg-[#0E1210] border border-[rgba(244,240,232,0.08)] flex items-center justify-center shrink-0 text-[#176C68]">
                      <Spline className="w-5 h-5 text-[#2EB8B0]" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-semibold font-mono text-[#F4F0E8] tracking-wide">
                        Subsurface Utilities Infrastructure
                      </div>
                      <div className="text-xs font-mono text-[#CBD5E1] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="text-[#A7B3AB]">SWD Drain (-1.8m) · Water Feeder (-1.2m)</span>
                        <span className="text-[#6F7772]">·</span>
                        <span className="text-[#94A3B8]">0.6m Buffer Maintained</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[rgba(244,240,232,0.04)]">
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-[3px] bg-[#176C68]/15 border border-[#176C68]/30 text-[#2EB8B0] font-bold uppercase tracking-wide">
                      DEPTH CLEARANCE OK
                    </span>
                    <div className="text-xs font-mono text-[#CBD5E1] mt-0.5">
                      Subterranean Zone (-2.0m)
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================== */}
        {/* RIGHT COLUMN: CADASTRAL INTELLIGENCE TELEMETRY (Col 5/12)   */}
        {/* Solves Problem 10: Eliminates dead empty space with live   */}
        {/* geospatial evidence panel for the selected strata layer    */}
        {/* ========================================================== */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 w-full">
          
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(244,240,232,0.04)] text-xs font-mono">
            <span className="flex items-center gap-2 text-[#CBD5E1] font-semibold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-[#B56E48]" />
              Strata Telemetry Inspector
            </span>
            <span className="text-[11px] text-[#A7B3AB]">
              {isFloorSelected ? activeFloor?.code : isParcelSelected ? "PARCEL 102/3B" : "SUBTERRANEAN"}
            </span>
          </div>

          {/* DYNAMIC DOSSIER BASED ON SELECTION */}
          {isFloorSelected && activeFloor?.isDeviation && (
            /* A. FL-03 VIOLATION DOSSIER */
            <div className="rounded-[8px] bg-[#171310] border border-[#B56E48]/35 p-4 flex flex-col gap-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[#E09F67] flex items-center gap-1.5 uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4 text-[#B56E48]" />
                  Enforcement Dossier
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#B56E48]/20 border border-[#B56E48]/40 text-[#E09F67] font-bold">
                  HIGH SEVERITY
                </span>
              </div>

              <div className="text-xs font-mono text-[#CBD5E1] leading-relaxed">
                Physical floor detected beyond approved building sanction plan. Airborne LiDAR reveals eastward setback deviation.
              </div>

              {/* Metric Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#B56E48]/20 font-mono text-xs">
                <div className="p-2 rounded bg-[#100D0B] border border-[#B56E48]/20">
                  <div className="text-[10px] text-[#94A3B8] uppercase">Setback Deviation</div>
                  <div className="text-sm font-bold text-[#E09F67] mt-0.5">+14.20 m²</div>
                  <div className="text-[10px] text-[#A7B3AB] mt-0.5">Eastward Projection</div>
                </div>

                <div className="p-2 rounded bg-[#100D0B] border border-[#B56E48]/20">
                  <div className="text-[10px] text-[#94A3B8] uppercase">Vertical Delta</div>
                  <div className="text-sm font-bold text-[#E09F67] mt-0.5">+4.00 m</div>
                  <div className="text-[10px] text-[#A7B3AB] mt-0.5">Approved: G+2 Only</div>
                </div>
              </div>

              {/* Evidence & Regulatory Trail */}
              <div className="space-y-1.5 pt-2 border-t border-[#B56E48]/20 text-[11px] font-mono text-[#CBD5E1]">
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Audit Source:</span>
                  <span className="text-[#F4F0E8] font-medium">LiDAR Altimetry #4092</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Audit Confidence:</span>
                  <span className="text-[#2EB8B0] font-semibold">99.4% (PostGIS PPK)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Notice Reference:</span>
                  <span className="text-[#E09F67]">KMC Act Sec 321(1)</span>
                </div>
              </div>
            </div>
          )}

          {isFloorSelected && !activeFloor?.isDeviation && (
            /* B. COMPLIANT FLOOR DOSSIER (FL-02, FL-01, FL-00) */
            <div className="rounded-[8px] bg-[#121614] border border-[rgba(244,240,232,0.06)] p-4 flex flex-col gap-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[#2EB8B0] flex items-center gap-1.5 uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-[#2EB8B0]" />
                  Cadastral Conformance
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#176C68]/15 border border-[#176C68]/30 text-[#2EB8B0] font-bold">
                  VERIFIED COMPLIANT
                </span>
              </div>

              <div className="text-xs font-mono text-[#CBD5E1] leading-relaxed">
                Volumetric strata boundaries coincide with sanctioned architectural drawings within legal ±2cm tolerance.
              </div>

              {/* Metric Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[rgba(244,240,232,0.04)] font-mono text-xs">
                <div className="p-2 rounded bg-[#0D100E] border border-[rgba(244,240,232,0.06)]">
                  <div className="text-[10px] text-[#94A3B8] uppercase">Clear Height</div>
                  <div className="text-sm font-bold text-[#F4F0E8] mt-0.5">{activeFloor?.height}</div>
                  <div className="text-[10px] text-[#2EB8B0] mt-0.5">Approved Sanction</div>
                </div>

                <div className="p-2 rounded bg-[#0D100E] border border-[rgba(244,240,232,0.06)]">
                  <div className="text-[10px] text-[#94A3B8] uppercase">Carpet + Slab Area</div>
                  <div className="text-sm font-bold text-[#F4F0E8] mt-0.5">{activeFloor?.area}</div>
                  <div className="text-[10px] text-[#A7B3AB] mt-0.5">Demarcated Unit</div>
                </div>
              </div>

              {/* Geometric Integrity */}
              <div className="space-y-1.5 pt-2 border-t border-[rgba(244,240,232,0.04)] text-[11px] font-mono text-[#CBD5E1]">
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Unit Demarcation:</span>
                  <span className="text-[#F4F0E8] truncate max-w-[180px]">{activeFloor?.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Elevation Range:</span>
                  <span className="text-[#F4F0E8]">{activeFloor?.elev}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Deviation Delta:</span>
                  <span className="text-[#2EB8B0] font-semibold">0.00 m² (None)</span>
                </div>
              </div>
            </div>
          )}

          {isParcelSelected && (
            /* C. GROUND CADASTRE DOSSIER */
            <div className="rounded-[8px] bg-[#111A17] border border-[#176C68]/30 p-4 flex flex-col gap-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[#2EB8B0] flex items-center gap-1.5 uppercase tracking-wide">
                  <Building2 className="w-4 h-4 text-[#2EB8B0]" />
                  Base Cadastre Demarcation
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#176C68]/15 border border-[#176C68]/35 text-[#2EB8B0] font-bold">
                  2D TITLED
                </span>
              </div>

              <div className="text-xs font-mono text-[#CBD5E1] leading-relaxed">
                Registered land parcel boundary surveyed under Karnataka Land Revenue Cadastre with geodetic datum anchor.
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#176C68]/20 font-mono text-xs">
                <div className="p-2 rounded bg-[#0B1310] border border-[#176C68]/20">
                  <div className="text-[10px] text-[#94A3B8] uppercase">Plot Area</div>
                  <div className="text-sm font-bold text-[#2EB8B0] mt-0.5">520.00 m²</div>
                  <div className="text-[10px] text-[#A7B3AB] mt-0.5">Cadastral Boundary</div>
                </div>

                <div className="p-2 rounded bg-[#0B1310] border border-[#176C68]/20">
                  <div className="text-[10px] text-[#94A3B8] uppercase">Ground Coverage</div>
                  <div className="text-sm font-bold text-[#F4F0E8] mt-0.5">46.15%</div>
                  <div className="text-[10px] text-[#2EB8B0] mt-0.5">240.0 m² Footprint</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#176C68]/20 text-[11px] font-mono text-[#CBD5E1]">
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Cadastral Parcel ID:</span>
                  <span className="text-[#F4F0E8]">KA-BLR-2026-P102</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Base MSL Datum:</span>
                  <span className="text-[#F4F0E8]">920.50m (UTM 43N)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Measured FSI:</span>
                  <span className="text-[#E09F67] font-semibold">1.84 (Sanction: 1.50)</span>
                </div>
              </div>
            </div>
          )}

          {isUtilitiesSelected && (
            /* D. SUBSURFACE UTILITIES DOSSIER */
            <div className="rounded-[8px] bg-[#121614] border border-[rgba(244,240,232,0.06)] p-4 flex flex-col gap-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[#2EB8B0] flex items-center gap-1.5 uppercase tracking-wide">
                  <Spline className="w-4 h-4 text-[#2EB8B0]" />
                  Subsurface Municipal Corridors
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#176C68]/15 border border-[#176C68]/30 text-[#2EB8B0] font-bold">
                  BUFFER CLEAR
                </span>
              </div>

              <div className="text-xs font-mono text-[#CBD5E1] leading-relaxed">
                Municipal utility rights-of-way intersecting the parcel buffer zone analyzed for structural foundation clearance.
              </div>

              <div className="space-y-2 pt-2 border-t border-[rgba(244,240,232,0.04)] text-xs font-mono">
                <div className="p-2 rounded bg-[#0E1210] border border-[rgba(244,240,232,0.06)] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#F4F0E8]">Storm Water Drain (SWD)</div>
                    <div className="text-[10px] text-[#94A3B8]">Invert Depth: -1.80m MSL</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#176C68]/20 text-[#2EB8B0] font-semibold">
                    0.6m Buffer OK
                  </span>
                </div>

                <div className="p-2 rounded bg-[#0E1210] border border-[rgba(244,240,232,0.06)] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#F4F0E8]">BESCOM Water Feeder Trunk</div>
                    <div className="text-[10px] text-[#94A3B8]">Invert Depth: -1.20m MSL</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#176C68]/20 text-[#2EB8B0] font-semibold">
                    Cleared
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Strata Inspector Instructions */}
          <div className="p-3 rounded-[6px] bg-[#0E1210] border border-[rgba(244,240,232,0.04)] text-[11px] font-mono text-[#94A3B8] flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-[#176C68] shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              3D property units are demarcated under PostGIS 3D volumetric polygons. Toggle between Assembled and Exploded views above to inspect inter-slab spatial clearances.
            </span>
          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. BOTTOM LIVE SPATIAL TELEMETRY FOOTER                      */}
      {/* Clean separation, standard font sizes, no clipping           */}
      {/* ============================================================ */}
      <div className="pt-4 mt-2 border-t border-[rgba(244,240,232,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-[#CBD5E1] z-10 gap-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5 text-[#F4F0E8] font-medium">
            <Compass className="w-3.5 h-3.5 text-[#B56E48]" />
            EPSG:32643 UTM Zone 43N
          </span>
          <span className="text-[#6F7772]">·</span>
          <span>Lat 12.9991° N, Lon 77.5722° E</span>
          <span className="text-[#6F7772]">·</span>
          <span className="text-[#A7B3AB]">Base Datum: 920.50m MSL</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#2EB8B0] font-semibold">
            4 Vertical Stories · 1 Cadastral Parcel · 2 Infrastructure Lines
          </span>
        </div>
      </div>

    </div>
  );
}
