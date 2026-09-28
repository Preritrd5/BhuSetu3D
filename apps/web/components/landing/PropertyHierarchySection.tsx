"use client";

import React, { useState } from "react";
import {
  MapPin,
  Building2,
  Layers,
  Compass,
  DoorOpen,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

export function PropertyHierarchySection() {
  const [activeTier, setActiveTier] = useState<number>(1);

  const TIERS = [
    {
      id: 0,
      code: "TIER 1",
      level: "PARCEL",
      datum: "MSL 920.50m",
      offset: "BASE DATUM · 0.00m",
      name: "Cadastral Land Lot",
      example: "KA-BLR-2026-P102 (Survey 102/3B)",
      elevation: "920.5m Base Altitude MSL",
      dimensions: "480.0 m² Recorded Lot Area",
      metrics: "Conformal 2D Polygon Boundary · EPSG:32643",
      desc: "The authoritative cadastral foundation. Bounded by official geodetic boundary coordinates with computed vs. recorded area verification.",
      badge: "Base Registry",
      keyAttributes: [
        "Official Survey Number: 102/3B",
        "ULPIN 2D: KA-BLR-2026-P102",
        "Municipal Land Use: Commercial Zone C-2",
        "Adjoining Road Corridor: 8th Main Arterial",
      ],
    },
    {
      id: 1,
      code: "TIER 2",
      level: "BUILDING",
      datum: "MSL 935.00m",
      offset: "+14.50m ROOF PEAK",
      name: "3D Volumetric Massing",
      example: "Aura Horizon Commercial Complex",
      elevation: "0.0m to 14.5m Height Above Grade",
      dimensions: "320.0 m² Ground Footprint",
      metrics: "LoD2 Architectural Envelope · 3 Sanctioned Floors",
      desc: "Physical building structure extruded above the parcel pad. Enforces municipal height ceilings, setback buffer clearances, and podium massing.",
      badge: "Structure",
      keyAttributes: [
        "Building Code: BLD-KA-BLR-102",
        "Observed Height: 14.5m (LiDAR Measured)",
        "Sanctioned Ceiling: 11.5m (3 Floors Permitted)",
        "Discrepancy Status: Review Required (+3.0m)",
      ],
    },
    {
      id: 2,
      code: "TIER 3",
      level: "FLOOR",
      datum: "MSL 931.00m",
      offset: "+10.50m SLAB LEVEL",
      name: "Vertical Floor Slabs",
      example: "Floor 03 (Executive Suite)",
      elevation: "931.0m – 935.0m Z-Extrusion",
      dimensions: "240.0 m² Slab Plate Area",
      metrics: "Z-Bounded Floor Slab · 4.0m Story Height",
      desc: "Discrete vertical horizontal tier bounded by base and ceiling elevations. Allows independent floor isolation and exploded floor visualization in 3D.",
      badge: "Level Slice",
      keyAttributes: [
        "Floor Code: FL-03",
        "Physical Elevation Range: 10.5m to 14.5m",
        "Physical Use: Executive Corporate Suites",
        "Vertical Status: Detected 4th Physical Story",
      ],
    },
    {
      id: 3,
      code: "TIER 4",
      level: "UNIT",
      datum: "MSL 932.75m",
      offset: "+12.25m CENTROID",
      name: "3D ULPIN Real Estate Units",
      example: "Unit 302 (Executive Suite A)",
      elevation: "Z-Centroid: 932.75m Altitude MSL",
      dimensions: "115.0 m² Carpet Area",
      metrics: "PostGIS 3D Point Coordinate (X, Y, Z)",
      desc: "Independent property asset possessing its own unique 3D ULPIN. Enables true vertical title demarcation, property taxation, and utility routing.",
      badge: "3D Asset",
      keyAttributes: [
        "3D ULPIN: KA-BLR-2026-P102-B1-F3-U02",
        "3D Centroid: 77.57221, 12.99910, 932.75m",
        "Occupancy Classification: Commercial Office",
        "Deed Hash: SHA-256 Verified",
      ],
    },
    {
      id: 4,
      code: "TIER 5",
      level: "ELEMENT",
      datum: "MSL 931.00m",
      offset: "+0.00m MICRO-TIER",
      name: "Deep Spatial Elements",
      example: "Rooms, Corridors, Ingress Apertures",
      elevation: "Sub-Meter Architectural Demarcation",
      dimensions: "Sub-Meter Component Resolution",
      metrics: "Ingress Vectors · Egress Clearances",
      desc: "Granular internal spatial components supporting emergency egress planning, spatial clearances, and high-precision digital twin inspection.",
      badge: "Micro-Spatial",
      keyAttributes: [
        "Element Type: Room / Corridor / Doorway",
        "Accessibility & Clearances Verified",
        "Topological Containment in Parent Unit",
        "Inspection Drill-Down Supported",
      ],
    },
  ];

  const current = TIERS[activeTier];

  return (
    <section
      id="hierarchy"
      className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210] relative overflow-hidden"
    >
      {/* Geodetic Grid Background */}
      <div className="absolute inset-0 bg-geodetic-grid opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#23847D] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
            <span>TOPOLOGICAL HIERARCHY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F0E8] font-mono leading-tight">
            Vertical Architectural Elevation Section Cut
          </h2>
          <p className="text-sm sm:text-base text-[#D9D2C5] leading-relaxed font-sans max-w-2xl mx-auto">
            Explore how BhuSetu 3D structures real property from geodetic land lots down to independent
            3D ULPIN units with mathematical topological continuity.
          </p>
        </div>

        {/* Tier Selector Buttons Strip */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-[8px] bg-[#141816] border border-[rgba(244,240,232,0.08)] max-w-3xl mx-auto">
          {TIERS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTier(t.id)}
              className={`px-4 py-2 rounded-[6px] text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                activeTier === t.id
                  ? "bg-[#B56E48] text-[#F4F0E8] shadow-sm"
                  : "text-[#6F7772] hover:text-[#D9D2C5] hover:bg-[#1A201D]"
              }`}
            >
              <span className="text-[10px] opacity-75">{t.code}:</span>
              <span>{t.level}</span>
            </button>
          ))}
        </div>

        {/* Interactive Elevation Section Cut Container */}
        <div className="max-w-6xl mx-auto rounded-[14px] bg-[#141816] border border-[rgba(244,240,232,0.08)] p-6 sm:p-10 shadow-sm relative overflow-hidden">
          {/* Engineering Crosshairs */}
          <div className="absolute top-3 left-3 text-[10px] font-mono text-[#6F7772] select-none">+ SECTION A-A</div>
          <div className="absolute top-3 right-3 text-[10px] font-mono text-[#6F7772] select-none">SCALE 1:100</div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6">
            {/* Left: Vertical Elevation Axis & Slice Ladder */}
            <div className="lg:col-span-4 rounded-[10px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] p-4 space-y-3 font-mono text-xs">
              <div className="text-[10px] text-[#6F7772] uppercase tracking-widest pb-2 border-b border-[rgba(244,240,232,0.08)] font-bold flex items-center justify-between">
                <span>ELEVATION DATUM</span>
                <span>MSL (m)</span>
              </div>

              <div className="space-y-2">
                {TIERS.map((t) => {
                  const isSelected = activeTier === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTier(t.id)}
                      className={`w-full text-left p-3 rounded-[6px] border transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-[#141816] border-[#B56E48] text-[#F4F0E8]"
                          : "border-[rgba(244,240,232,0.06)] text-[#6F7772] hover:text-[#D9D2C5] hover:bg-[#141816]"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? "bg-[#B56E48]" : "bg-[#6F7772]"
                            }`}
                          />
                          <span className="font-bold text-xs">{t.level}</span>
                        </div>
                        <div className="text-[10px] text-[#6F7772]">{t.offset}</div>
                      </div>
                      <span className="text-[11px] font-mono text-[#D9D2C5]">{t.datum}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-2.5 rounded-[6px] bg-[#141816] border border-[rgba(244,240,232,0.08)] text-[10px] text-[#6F7772] flex items-center justify-between">
                <span>VERTICAL DATUM:</span>
                <span className="text-[#23847D] font-bold">WGS 84 / EGM2008</span>
              </div>
            </div>

            {/* Right: Technical Specification Panel */}
            <div className="lg:col-span-8 space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-[rgba(244,240,232,0.08)] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase border bg-[#1A201D] text-[#D9D2C5] border-[rgba(244,240,232,0.12)]">
                    {current.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase border bg-[#176C68]/15 text-[#23847D] border-[#176C68]/40">
                    {current.badge}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#6F7772]">
                  ACTIVE LEVEL INSPECTION
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold font-mono text-[#F4F0E8]">{current.name}</h3>
                <p className="text-sm font-mono text-[#C47B50] mt-1">{current.example}</p>
              </div>

              <p className="text-xs sm:text-sm text-[#D9D2C5] font-sans leading-relaxed">
                {current.desc}
              </p>

              {/* Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[rgba(244,240,232,0.08)]">
                {current.keyAttributes.map((attr, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#D9D2C5] font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#23847D] shrink-0" />
                    <span className="truncate">{attr}</span>
                  </div>
                ))}
              </div>

              {/* Technical Telemetry Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[rgba(244,240,232,0.08)] font-mono text-xs">
                <div className="p-3 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                  <span className="text-[10px] text-[#6F7772] uppercase block">Elevation Range</span>
                  <span className="font-bold text-[#F4F0E8] block text-xs mt-1 truncate">
                    {current.elevation}
                  </span>
                </div>
                <div className="p-3 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                  <span className="text-[10px] text-[#6F7772] uppercase block">Dimensions</span>
                  <span className="font-bold text-[#F4F0E8] block text-xs mt-1 truncate">
                    {current.dimensions}
                  </span>
                </div>
                <div className="p-3 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                  <span className="text-[10px] text-[#6F7772] uppercase block">Representation</span>
                  <span className="font-bold text-[#23847D] block text-xs mt-1 truncate">
                    {current.metrics}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
