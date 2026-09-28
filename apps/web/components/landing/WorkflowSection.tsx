"use client";

import React from "react";
import {
  DownloadCloud,
  Layers,
  Eye,
  Cpu,
  Search,
  UserCheck,
  ChevronRight,
} from "lucide-react";

export function WorkflowSection() {
  const STAGES = [
    {
      step: "01",
      station: "STA 01",
      name: "INGEST",
      title: "Data Acquisition",
      desc: "Ingest cadastral boundary shapefiles, drone reality meshes, LiDAR point clouds, and municipal zoning orders.",
      icon: DownloadCloud,
    },
    {
      step: "02",
      station: "STA 02",
      name: "STRUCTURE",
      title: "LADM 3D Normalization",
      desc: "Project spatial coordinates into UTM Zone 43N, generating topological parcel lots, volumetric building shafts, and floor slabs.",
      icon: Layers,
    },
    {
      step: "03",
      station: "STA 03",
      name: "VISUALIZE",
      title: "Cesium Digital Twin",
      desc: "Render authenticated 3D city matrix with real-time solar shadows, atmospheric fog, and underground utilities.",
      icon: Eye,
    },
    {
      step: "04",
      station: "STA 04",
      name: "ANALYZE",
      title: "Spatial Rule Evaluation",
      desc: "Execute automated PostGIS topological algorithms detecting setback overlap, boundary proximity, and vertical height deviations.",
      icon: Cpu,
    },
    {
      step: "05",
      station: "STA 05",
      name: "INVESTIGATE",
      title: "Grounded AI Inquiries",
      desc: "Perform natural-language spatial queries with 1-click 3D viewport binding, measurement tools, and spatial object comparison.",
      icon: Search,
    },
    {
      step: "06",
      station: "STA 06",
      name: "VERIFY",
      title: "Statutory Field Truthing",
      desc: "Assign discrepancy findings to municipal officers and licensed surveyors with immutable SHA-256 audit ledger records.",
      icon: UserCheck,
      isTerminal: true,
    },
  ];

  return (
    <section
      id="workflow"
      className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210] relative overflow-hidden"
    >
      {/* Geodetic Grid Background */}
      <div className="absolute inset-0 bg-geodetic-grid opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#23847D] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
            <span>OPERATIONAL PROTOCOL</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F0E8] font-mono leading-tight">
            Structured 6-Stage Operational Workflow
          </h2>
          <p className="text-sm sm:text-base text-[#D9D2C5] leading-relaxed font-sans max-w-2xl mx-auto">
            A transparent pipeline ensuring every property insight transitions from raw data
            to statutory field determination without black-box assumptions.
          </p>
        </div>

        {/* 6 Stage Operational Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {STAGES.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-[14px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.22)] transition-all duration-200 space-y-4 text-left flex flex-col justify-between group shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[rgba(244,240,232,0.08)]">
                    <span className="text-xs font-mono font-bold text-[#6F7772]">
                      {s.station}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] border ${
                        s.isTerminal
                          ? "bg-[#B56E48]/15 text-[#C47B50] border-[#B56E48]/40"
                          : "bg-[#176C68]/15 text-[#23847D] border-[#176C68]/40"
                      }`}
                    >
                      {s.name}
                    </span>
                  </div>

                  <div
                    className={`w-10 h-10 rounded-[6px] border border-[rgba(244,240,232,0.12)] flex items-center justify-center ${
                      s.isTerminal
                        ? "bg-[#B56E48]/10 text-[#C47B50]"
                        : "bg-[#1A201D] text-[#D9D2C5] group-hover:text-[#23847D]"
                    } transition-colors`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-base font-bold font-mono text-[#F4F0E8]">{s.title}</h3>
                  <p className="text-xs text-[#D9D2C5] font-sans leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-[rgba(244,240,232,0.08)] flex items-center justify-between text-[10px] font-mono text-[#6F7772]">
                  <span>PIPELINE CONTINUITY</span>
                  <div className="flex items-center gap-1 group-hover:text-[#23847D] transition-colors">
                    <span>STAGE {s.step}</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
