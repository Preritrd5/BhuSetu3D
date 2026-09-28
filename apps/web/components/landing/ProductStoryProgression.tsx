"use client";

import React from "react";
import {
  Database,
  Box,
  Building2,
  FileCheck2,
  Brain,
  Search,
  UserCheck,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

interface LifecycleStep {
  step: string;
  name: string;
  title: string;
  desc: string;
  station: string;
  icon: React.ElementType;
  isTerminal?: boolean;
}

const LIFECYCLE_STEPS: LifecycleStep[] = [
  {
    step: "01",
    name: "DATA",
    title: "Multi-Source Sensor Ingestion",
    desc: "Raw cadastral survey vectorization, airborne LiDAR altimetry, satellite optical imagery, and municipal sanction orders.",
    station: "STA 0+000 · INGEST",
    icon: Database,
  },
  {
    step: "02",
    name: "SPATIAL MODEL",
    title: "Conformal Metric Projection",
    desc: "Topological normalization to EPSG:32643 UTM 43N with LoD2 volumetric geometry and boundary constraints.",
    station: "STA 0+150 · CONFORMAL",
    icon: Box,
  },
  {
    step: "03",
    name: "3D PROPERTY",
    title: "Vertical Hierarchy Slicing",
    desc: "Topological continuity spanning Parcel Lot → Building Envelope → Floor Slabs → Unit Centroids (Z-Point).",
    station: "STA 0+300 · TOPOLOGY",
    icon: Building2,
  },
  {
    step: "04",
    name: "EVIDENCE",
    title: "Verifiable Ingestion Vault",
    desc: "Capture timestamps, sensor classifications, authoritative vs. derived sources, and multi-factor confidence calculations.",
    station: "STA 0+450 · LINEAGE",
    icon: FileCheck2,
  },
  {
    step: "05",
    name: "INTELLIGENCE",
    title: "Deterministic Rule Analysis",
    desc: "Automated PostGIS topological evaluations for setback adherence, boundary proximity, and height ceilings.",
    station: "STA 0+600 · RULES",
    icon: Brain,
  },
  {
    step: "06",
    name: "INVESTIGATION",
    title: "Grounded AI Assistance",
    desc: "Natural-language spatial query engine generating structured findings with 1-click 3D viewport binding.",
    station: "STA 0+750 · REASONING",
    icon: Search,
  },
  {
    step: "07",
    name: "STATUTORY REVIEW",
    title: "Statutory Surveyor Queue",
    desc: "Statutory review queue for municipal surveyors, physical field verification, and immutable SHA-256 audit ledger.",
    station: "STA 1+000 · AUDIT",
    icon: UserCheck,
    isTerminal: true,
  },
];

function CardItem({ item, isLast }: { item: LifecycleStep; isLast?: boolean }) {
  const Icon = item.icon;

  return (
    <div
      className={`h-full p-6 sm:p-7 rounded-[14px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.22)] transition-all duration-200 flex flex-col justify-between select-none group relative overflow-hidden shadow-sm`}
    >
      {/* Top Header: Step Number & Uppercase Badge */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(244,240,232,0.08)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#6F7772] group-hover:text-[#D9D2C5] transition-colors">
              {item.step}
            </span>
            <span className="text-[10px] font-mono text-[#6F7772] tracking-wider">
              {item.station}
            </span>
          </div>
          <span
            className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] border ${
              item.isTerminal
                ? "bg-[#B56E48]/15 text-[#C47B50] border-[#B56E48]/40"
                : "bg-[#176C68]/15 text-[#23847D] border-[#176C68]/40"
            }`}
          >
            {item.name}
          </span>
        </div>

        {/* Middle Body: Icon, Title, Description */}
        <div className="pt-5 space-y-3.5">
          <div
            className={`w-10 h-10 rounded-[6px] border border-[rgba(244,240,232,0.12)] flex items-center justify-center ${
              item.isTerminal
                ? "bg-[#B56E48]/10 text-[#C47B50]"
                : "bg-[#1A201D] text-[#D9D2C5] group-hover:text-[#23847D]"
            } transition-colors duration-200`}
          >
            <Icon className="w-5 h-5" />
          </div>

          <h3 className="text-base font-bold font-mono text-[#F4F0E8] leading-snug group-hover:text-white transition-colors">
            {item.title}
          </h3>

          <p className="text-xs lg:text-[13px] text-[#D9D2C5] leading-relaxed font-sans">
            {item.desc}
          </p>
        </div>
      </div>

      {/* Engineering Datum Joint Cue */}
      <div className="pt-5 mt-5 border-t border-[rgba(244,240,232,0.08)] flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#6F7772]">
          STAGE {item.step}
        </span>
        {!isLast ? (
          <div className="flex items-center gap-1 text-[#6F7772] group-hover:text-[#23847D] transition-colors">
            <span className="text-[10px] font-mono">NEXT</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        ) : (
          <span className="text-[10px] font-mono uppercase text-[#C47B50] font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B56E48] animate-pulse" />
            FINAL AUDIT
          </span>
        )}
      </div>
    </div>
  );
}

export function ProductStoryProgression() {
  const row1 = LIFECYCLE_STEPS.slice(0, 4); // 01, 02, 03, 04
  const row2 = LIFECYCLE_STEPS.slice(4, 7); // 05, 06, 07

  return (
    <section
      id="platform"
      className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210] relative overflow-hidden"
    >
      {/* Geodetic Grid Background */}
      <div className="absolute inset-0 bg-geodetic-grid opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Centered Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#23847D] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
            <span>ARCHITECTURAL LIFECYCLE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F0E8] font-mono leading-tight">
            From Raw Spatial Sensor to Human Verification
          </h2>
          <p className="text-sm sm:text-base text-[#D9D2C5] leading-relaxed font-sans max-w-2xl mx-auto">
            BhuSetu 3D connects every physical building, boundary, and height measurement through
            an unbroken, explainable lifecycle progression.
          </p>
        </div>

        {/* 2-Row Architectural Lifecycle Cards */}
        <div className="space-y-6">
          {/* Row 1: 4 Cards (01 | 02 | 03 | 04) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {row1.map((item) => (
              <div key={item.step} className="h-full">
                <CardItem item={item} />
              </div>
            ))}
          </div>

          {/* Row 2: 3 Cards, Visually Centered (05 | 06 | 07) */}
          <div className="flex flex-wrap justify-center gap-6">
            {row2.map((item, idx) => (
              <div
                key={item.step}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc((100%-72px)/4)] h-full"
              >
                <CardItem item={item} isLast={idx === row2.length - 1} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
