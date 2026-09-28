"use client";

import React, { useState } from "react";
import {
  Layers,
  Compass,
  AlertTriangle,
  Spline,
  CheckCircle2,
  Maximize2,
} from "lucide-react";

export function Hero3DPropertyVisual() {
  const [exploded, setExploded] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  const FLOORS = [
    {
      id: 3,
      code: "FL-03",
      label: "Third Floor — Corporate Suites",
      unit: "KA-BLR-2026-P102-B1-F3-U04",
      height: "4.0m",
      elev: "931.0m – 935.0m MSL",
      use: "Commercial Office",
      area: "240.0 m²",
      isDeviation: true,
      deviationLabel: "Sanction Limit Exceeded (+1 Physical Floor)",
      color: "border-[#B56E48]/60 bg-[#1A201D] text-[#F4F0E8]",
      badge: "Height Deviation",
      badgeColor: "bg-[#B56E48]/15 text-[#B56E48] border-[#B56E48]/40",
    },
    {
      id: 2,
      code: "FL-02",
      label: "Second Floor — Tech Workspace",
      unit: "KA-BLR-2026-P102-B1-F2-U03",
      height: "3.5m",
      elev: "927.5m – 931.0m MSL",
      use: "IT & Innovation Space",
      area: "240.0 m²",
      isDeviation: false,
      color: "border-[rgba(244,240,232,0.12)] bg-[#141816] text-[#D9D2C5]",
      badge: "Compliant",
      badgeColor: "bg-[#176C68]/15 text-[#23847D] border-[#176C68]/40",
    },
    {
      id: 1,
      code: "FL-01",
      label: "First Floor — Diagnostic Center",
      unit: "KA-BLR-2026-P102-B1-F1-U02",
      height: "3.5m",
      elev: "924.0m – 927.5m MSL",
      use: "Healthcare & Clinic",
      area: "240.0 m²",
      isDeviation: false,
      color: "border-[rgba(244,240,232,0.12)] bg-[#141816] text-[#D9D2C5]",
      badge: "Compliant",
      badgeColor: "bg-[#176C68]/15 text-[#23847D] border-[#176C68]/40",
    },
    {
      id: 0,
      code: "FL-00",
      label: "Ground Floor — Banking Concourse",
      unit: "KA-BLR-2026-P102-B1-F0-U01",
      height: "3.5m",
      elev: "920.5m – 924.0m MSL",
      use: "Retail Banking Branch",
      area: "240.0 m²",
      isDeviation: false,
      color: "border-[rgba(244,240,232,0.12)] bg-[#141816] text-[#D9D2C5]",
      badge: "Compliant",
      badgeColor: "bg-[#176C68]/15 text-[#23847D] border-[#176C68]/40",
    },
  ];

  return (
    <div className="w-full relative rounded-[14px] bg-[#141816]/70 border border-[rgba(244,240,232,0.08)] p-6 lg:p-8 overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
      {/* Precision Crosshairs in Corners */}
      <span className="absolute top-2 left-2 font-mono text-[10px] text-[#6F7772] select-none">+</span>
      <span className="absolute top-2 right-2 font-mono text-[10px] text-[#6F7772] select-none">+</span>
      <span className="absolute bottom-2 left-2 font-mono text-[10px] text-[#6F7772] select-none">+</span>
      <span className="absolute bottom-2 right-2 font-mono text-[10px] text-[#6F7772] select-none">+</span>

      {/* Viewport Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(244,240,232,0.06)] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#176C68]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#F4F0E8] tracking-wider">
                BLD-KA-BLR-102
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] text-[#77867C] font-semibold">
                LOD2 VOLUMETRIC EXTENSION
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#77867C]">
              Aura Horizon Commercial Complex · Malleshwaram W-101
            </span>
          </div>
        </div>

        {/* View Mode Toggle Button */}
        <button
          onClick={() => setExploded(!exploded)}
          className="btn-secondary !py-1.5 !px-3 text-xs font-mono self-start sm:self-auto"
        >
          <Layers className="w-3.5 h-3.5 text-[#B56E48]" />
          <span>{exploded ? "Assembled Section" : "Explode 3D Slices"}</span>
        </button>
      </div>

      {/* Main Isometric 3D Exploded Representation */}
      <div className="relative flex flex-col justify-center items-center py-8 px-2 z-10">
        {/* Discrepancy Annotation Flag (Leader line) */}
        <div className="hidden md:flex items-center gap-2.5 absolute top-4 right-4 z-20 px-3 py-1.5 rounded-[4px] bg-[#1A201D] border border-[#B56E48]/50 text-[#B56E48] text-xs font-mono shadow-md">
          <AlertTriangle className="w-3.5 h-3.5 text-[#B56E48] shrink-0" />
          <span>Facade Setback Deviation: +14.20 m² Eastward</span>
        </div>

        {/* Isometric Building Stack */}
        <div className="w-full max-w-xl flex flex-col items-center justify-center transition-all duration-500">
          {FLOORS.map((f, idx) => {
            const isSelected = selectedFloor === f.id;
            return (
              <div
                key={f.id}
                onClick={() => setSelectedFloor(isSelected ? null : f.id)}
                className={`w-full group cursor-pointer transition-all duration-300 relative ${
                  exploded ? "my-2.5" : "-my-1.5"
                }`}
                style={{
                  transform: `perspective(1000px) rotateX(25deg) rotateZ(-12deg)`,
                }}
              >
                {/* 3D Slab Surface Plate */}
                <div
                  className={`w-full rounded-[8px] border p-4 transition-all duration-200 shadow-lg flex items-center justify-between ${
                    f.color
                  } ${
                    isSelected
                      ? "ring-1 ring-[#B56E48] bg-[#1E2522]"
                      : "hover:border-[#B56E48]/50 hover:bg-[#1A201D]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[4px] bg-[#0F1210] border border-[rgba(244,240,232,0.1)] flex items-center justify-center text-xs font-mono font-bold text-[#D9D2C5]">
                      {f.code}
                    </div>
                    <div>
                      <div className="text-xs font-bold font-mono tracking-wide text-[#F4F0E8] flex items-center gap-2">
                        <span>{f.label.split("—")[1]?.trim() || f.label}</span>
                        {f.isDeviation && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[2px] bg-[#B56E48]/20 text-[#B56E48] border border-[#B56E48]/40 font-bold">
                            UNSANCTIONED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-[#77867C] flex items-center gap-2 mt-0.5">
                        <span className="text-[#176C68] font-semibold">{f.unit}</span>
                        <span>·</span>
                        <span>{f.elev}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-[3px] border uppercase font-bold ${f.badgeColor}`}
                    >
                      {f.badge}
                    </span>
                    <div className="text-[10px] font-mono text-[#77867C] mt-1">
                      {f.area} · H: {f.height}
                    </div>
                  </div>
                </div>

                {/* Vertical Elevation Connector Line */}
                {exploded && idx < FLOORS.length - 1 && (
                  <div className="absolute left-7 -bottom-3 w-[1px] h-3 bg-[#B56E48]/40" />
                )}
              </div>
            );
          })}

          {/* Ground Cadastral Parcel Plane (Base Layer) */}
          <div
            className={`w-full transition-all duration-300 relative ${
              exploded ? "mt-4" : "mt-2"
            }`}
            style={{
              transform: `perspective(1000px) rotateX(25deg) rotateZ(-12deg)`,
            }}
          >
            <div className="w-full rounded-[8px] border border-[#176C68]/50 bg-[#176C68]/10 p-3.5 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[4px] bg-[#176C68]/20 border border-[#176C68]/40 flex items-center justify-center text-[#23847D] font-mono text-xs font-bold">
                  2D
                </div>
                <div>
                  <div className="text-xs font-bold font-mono text-[#23847D] flex items-center gap-2">
                    <span>SURVEY PARCEL 102/3B</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[2px] bg-[#176C68]/20 border border-[#176C68]/40 text-[#23847D] font-semibold">
                      REGISTERED CADASTRE
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-[#77867C] mt-0.5">
                    KA-BLR-2026-P102 · Area: 520.00 m² · Base Datum: 920.50m MSL
                  </div>
                </div>
              </div>

              <div className="text-right text-[10px] font-mono text-[#23847D] font-semibold">
                GROUND BOUNDARY
              </div>
            </div>
          </div>

          {/* Subsurface Municipal Infrastructure Cutaway */}
          <div
            className={`w-full transition-all duration-300 relative ${
              exploded ? "mt-3" : "mt-1.5"
            }`}
            style={{
              transform: `perspective(1000px) rotateX(25deg) rotateZ(-12deg)`,
            }}
          >
            <div className="w-full rounded-[8px] border border-[rgba(244,240,232,0.08)] bg-[#141816] p-2.5 shadow-md flex items-center justify-between text-xs font-mono text-[#D9D2C5]">
              <div className="flex items-center gap-2">
                <Spline className="w-4 h-4 text-[#176C68]" />
                <span className="text-[11px] font-medium">
                  Subsurface Utilities: SWD Drain (-1.8m) · Water Feeder (-1.2m)
                </span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-[3px] bg-[#176C68]/15 border border-[#176C68]/30 text-[#23847D] font-bold uppercase">
                DEPTH CLEARANCE OK
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Live Spatial Telemetry Footer */}
      <div className="pt-4 border-t border-[rgba(244,240,232,0.06)] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#77867C] z-10 gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#D9D2C5]">
            <Compass className="w-3.5 h-3.5 text-[#B56E48]" />
            EPSG:32643 UTM Zone 43N
          </span>
          <span>·</span>
          <span>Lat 12.9991° N, Lon 77.5722° E</span>
          <span>·</span>
          <span>Base MSL 920.50m</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#176C68] font-semibold">
            4 Vertical Stories · 4 Units Demarcated
          </span>
        </div>
      </div>
    </div>
  );
}
