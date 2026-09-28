"use client";

import React from "react";
import Link from "next/link";
import {
  Compass,
  Ruler,
  Layers,
  History,
  ShieldCheck,
  Building2,
} from "lucide-react";

export function ProductPreviewSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210] relative overflow-hidden">
      {/* Geodetic Grid Background */}
      <div className="absolute inset-0 bg-geodetic-grid opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#23847D] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
            <span>OPERATIONAL WORKSPACE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F0E8] font-mono leading-tight">
            Geospatial Command Console
          </h2>
          <p className="text-sm sm:text-base text-[#D9D2C5] leading-relaxed font-sans max-w-2xl mx-auto">
            A unified geospatial intelligence console combining full-screen WebGL 3D digital twins,
            contextual property inspectors, metric measurement tools, and grounded AI inquiry.
          </p>
        </div>

        {/* Console Frame Preview Container */}
        <div className="max-w-6xl mx-auto rounded-[14px] bg-[#141816] border border-[rgba(244,240,232,0.08)] shadow-sm overflow-hidden relative select-none">
          {/* Engineering Console Header Bar */}
          <div className="h-11 bg-[#1A201D] border-b border-[rgba(244,240,232,0.08)] px-5 flex items-center justify-between text-xs font-mono text-[#D9D2C5]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-[#F4F0E8] uppercase tracking-wider">
                BHUSETU CONSOLE · 3D DIGITAL TWIN
              </span>
              <span className="text-[#6F7772]">|</span>
              <span className="text-[11px] text-[#6F7772]">EPSG:32643 UTM 43N</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-[11px]">
              <span className="text-[#23847D] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#176C68]" />
                CESIUMJS 3D ENGINE ACTIVE
              </span>
              <span className="text-[#6F7772]">POSTGIS 3.4 CONFORMAL</span>
            </div>
          </div>

          {/* Inner Simulated Workspace Viewport */}
          <div className="relative h-[480px] sm:h-[540px] bg-[#0F1210] overflow-hidden flex flex-col justify-between p-6 select-none">
            {/* Perspective Ortho Grid */}
            <div className="absolute inset-0 bg-geodetic-grid opacity-40 pointer-events-none" />

            {/* Coordinate Border Rulers */}
            <div className="absolute top-0 left-0 right-0 h-5 border-b border-[rgba(244,240,232,0.06)] flex items-center justify-between px-6 text-[9px] font-mono text-[#6F7772] pointer-events-none">
              <span>77°34&apos;18&quot;E</span>
              <span>77°34&apos;20&quot;E</span>
              <span>77°34&apos;22&quot;E</span>
              <span>77°34&apos;24&quot;E</span>
              <span>77°34&apos;26&quot;E</span>
            </div>

            {/* Simulated 3D Scene Geometry Elements (Isometric Silhouette) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-[340px] sm:w-[460px] h-[300px]">
                {/* Cadastral Parcel Lot Boundary */}
                <div className="absolute bottom-12 left-8 w-[280px] sm:w-[380px] h-[140px] border border-dashed border-[#176C68] rounded-[6px] bg-[#141816]/70 transform -rotate-12 skew-x-12 shadow-sm flex items-end p-2.5">
                  <span className="text-[9px] font-mono text-[#23847D] bg-[#1A201D] px-2 py-0.5 rounded-[4px] border border-[#176C68]/40">
                    PARCEL 102/3B (480.0 m²)
                  </span>
                </div>

                {/* 3D Building Extrusion Volume */}
                <div className="absolute bottom-20 left-20 w-[180px] sm:w-[220px] h-[180px] bg-[#141816] border border-[#B56E48] rounded-[6px] transform -rotate-12 skew-x-12 shadow-md flex flex-col justify-between p-3.5">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-[#F4F0E8] font-bold">Aura Horizon Commercial</span>
                    <span className="text-[#C47B50] font-bold">14.5m</span>
                  </div>

                  {/* Internal Slabs */}
                  <div className="space-y-1.5 my-auto">
                    <div className="h-6 rounded-[4px] bg-[#B56E48]/20 border border-[#B56E48] flex items-center justify-between px-2 text-[8px] font-mono text-[#F4F0E8]">
                      <span>FL-03 (Unsanctioned)</span>
                      <span className="text-[#C47B50] font-bold">+3.0m</span>
                    </div>
                    <div className="h-6 rounded-[4px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] flex items-center justify-between px-2 text-[8px] font-mono text-[#D9D2C5]">
                      <span>FL-02 (Corporate)</span>
                      <span>3.5m</span>
                    </div>
                    <div className="h-6 rounded-[4px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] flex items-center justify-between px-2 text-[8px] font-mono text-[#D9D2C5]">
                      <span>FL-01 (Concourse)</span>
                      <span>3.5m</span>
                    </div>
                  </div>

                  <span className="text-[8px] font-mono text-[#6F7772]">
                    ULPIN: KA-BLR-2026-P102
                  </span>
                </div>
              </div>
            </div>

            {/* Top Breadcrumb Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 z-10 pt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#141816] border border-[rgba(244,240,232,0.08)] text-xs font-mono text-[#D9D2C5]">
                <span className="text-[#6F7772]">Bengaluru Urban</span>
                <span className="text-[#6F7772]">/</span>
                <span className="text-[#6F7772]">Parcel 102/3B</span>
                <span className="text-[#6F7772]">/</span>
                <span className="text-[#F4F0E8] font-bold">Aura Horizon Commercial</span>
                <span className="text-[#6F7772]">/</span>
                <span className="text-[#C47B50]">Floor 03</span>
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-[6px] bg-[#141816] border border-[rgba(244,240,232,0.08)] text-[#D9D2C5]">
                  Quality: <strong className="text-[#23847D]">94.2%</strong>
                </span>
                <span className="px-2.5 py-1 rounded-[6px] bg-[#141816] border border-[rgba(244,240,232,0.08)] text-[#D9D2C5]">
                  Discrepancies: <strong className="text-[#C47B50]">2 Active</strong>
                </span>
              </div>
            </div>

            {/* Contextual Inspector (Right) */}
            <div className="hidden lg:block absolute top-20 right-6 w-80 rounded-[10px] bg-[#141816] border border-[rgba(244,240,232,0.12)] p-4 space-y-3 z-10 shadow-sm text-left">
              <div className="flex items-center justify-between border-b border-[rgba(244,240,232,0.08)] pb-2.5">
                <span className="text-[10px] font-mono font-bold uppercase text-[#F4F0E8]">
                  BLD-KA-BLR-102
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-[4px] bg-[#B56E48]/15 text-[#C47B50] border border-[#B56E48]/40 font-bold">
                  REVIEW REQUIRED
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] space-y-1">
                  <span className="text-[9px] text-[#6F7772] uppercase block">1. WHAT & WHY</span>
                  <p className="text-[11px] text-[#D9D2C5] leading-snug">
                    Height exceeds sanctioned limit by 3.0m (4 detected stories vs. 3 permitted).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                    <span className="text-[#6F7772] block">Confidence</span>
                    <span className="text-[#23847D] font-bold">93.4% Composite</span>
                  </div>
                  <div className="p-2 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                    <span className="text-[#6F7772] block">Verification</span>
                    <span className="text-[#C47B50] font-bold">UNDER_REVIEW</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] space-y-1">
                  <span className="text-[9px] text-[#6F7772] uppercase block">3. Multi-Sensor Evidence</span>
                  <span className="text-[10px] text-[#D9D2C5] block">
                    LiDAR Altimetry · 2026 Drone SfM Mesh
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Floating Spatial Tool Strip */}
            <div className="flex items-center justify-between z-10 pt-4 border-t border-[rgba(244,240,232,0.08)]">
              <div className="flex items-center gap-1.5 p-1 rounded-[8px] bg-[#141816] border border-[rgba(244,240,232,0.08)] text-xs font-mono text-[#D9D2C5]">
                <span className="px-3 py-1.5 rounded-[6px] bg-[#B56E48] text-[#F4F0E8] font-bold flex items-center gap-1 shadow-sm">
                  <Compass className="w-3.5 h-3.5" />
                  Select
                </span>
                <span className="px-3 py-1.5 rounded-[6px] text-[#6F7772] hover:text-[#D9D2C5] flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5" />
                  Measure
                </span>
                <span className="px-3 py-1.5 rounded-[6px] text-[#6F7772] hover:text-[#D9D2C5] flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Compare
                </span>
                <span className="px-3 py-1.5 rounded-[6px] text-[#6F7772] hover:text-[#D9D2C5] flex items-center gap-1">
                  <History className="w-3.5 h-3.5" />
                  4D Time
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
