"use client";

import React from "react";
import {
  Layers,
  Compass,
  FileCheck2,
  UserCheck,
  CheckCircle2,
} from "lucide-react";

export function ProductPillarsSection() {
  const PILLARS = [
    {
      code: "PILLAR 01",
      pillar: "MODEL",
      title: "3D Property Structure",
      subtitle: "Multi-tier topological continuity from land lot to unit",
      icon: Layers,
      capabilities: [
        "True 3D PostGIS geometry with coordinate reference system UTM Zone 43N",
        "LoD2 volumetric building massing with roof elevations and podiums",
        "Floor slab z-extrusions with carpet areas and floor codes",
        "Independent 3D ULPIN spatial unit points with 3D Z-centroids",
      ],
      tag: "EPSG:32643 CONFORMAL",
    },
    {
      code: "PILLAR 02",
      pillar: "UNDERSTAND",
      title: "Spatial Relationships",
      subtitle: "Topological validation and infrastructure proximity buffers",
      icon: Compass,
      capabilities: [
        "Automated setback clearance and parcel boundary overlap calculations",
        "Vertical floor ceiling sanction vs. physical LiDAR height comparisons",
        "50-meter safety buffer evaluations for transportation and utility corridors",
        "Multi-epoch 4D temporal change detection (2024–2026 expansions)",
      ],
      tag: "DETERMINISTIC TOPOLOGY",
    },
    {
      code: "PILLAR 03",
      pillar: "INVESTIGATE",
      title: "Evidence & Grounded AI",
      subtitle: "Explainable spatial intelligence with multi-sensor lineage",
      icon: FileCheck2,
      capabilities: [
        "Verifiable multi-source sensor vault (Airborne LiDAR, Drone SfM, DGPS)",
        "Strict decoupling of technical model confidence vs. statutory verification",
        "Grounded AI assistant executing deterministic PostGIS spatial functions",
        "1-click camera focus and candidate entity highlighting in 3D viewport",
      ],
      tag: "GROUNDED REASONING",
    },
    {
      code: "PILLAR 04",
      pillar: "VERIFY",
      title: "Human Statutory Review",
      subtitle: "Statutory governance and immutable audit trail",
      icon: UserCheck,
      capabilities: [
        "Role-tailored review queues for municipal officers, surveyors, and analysts",
        "On-site DGPS demarcation work orders for physical surveyor ground truthing",
        "Objective, non-judicial terminology (Spatial Discrepancy vs. illegal)",
        "SHA-256 cryptographic hash-chained immutable audit ledger",
      ],
      tag: "STATUTORY GOVERNANCE",
      highlight: true,
    },
  ];

  return (
    <section
      id="pillars"
      className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210] relative overflow-hidden"
    >
      {/* Geodetic Grid Background */}
      <div className="absolute inset-0 bg-geodetic-grid opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#23847D] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
            <span>CORE ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F0E8] font-mono leading-tight">
            Four Pillars of Spatial Property Intelligence
          </h2>
          <p className="text-sm sm:text-base text-[#D9D2C5] leading-relaxed font-sans max-w-2xl mx-auto">
            BhuSetu 3D replaces fragmented 2D survey sheets with a unified, four-stage structural
            framework engineered for municipal administration and legal land governance.
          </p>
        </div>

        {/* 4-Quadrant Architectural Structural Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {PILLARS.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={p.pillar}
                className="p-8 sm:p-10 rounded-[14px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.22)] transition-all duration-200 flex flex-col justify-between space-y-8 relative overflow-hidden group shadow-sm"
              >
                {/* Crosshair Accent in top-right */}
                <div className="absolute top-4 right-4 text-[10px] font-mono text-[#6F7772] select-none">
                  + Q{idx + 1}
                </div>

                <div className="space-y-6">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] bg-[#1A201D] border border-[rgba(244,240,232,0.12)] text-[#D9D2C5]">
                      {p.code}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6F7772]">
                      {p.tag}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-[6px] border border-[rgba(244,240,232,0.12)] flex items-center justify-center shrink-0 ${
                        p.highlight
                          ? "bg-[#B56E48]/10 text-[#C47B50]"
                          : "bg-[#1A201D] text-[#23847D]"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-mono text-[#F4F0E8] leading-tight">
                        {p.title}
                      </h3>
                      <p className="text-xs text-[#6F7772] font-mono mt-1">
                        {p.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Capabilities List */}
                  <div className="space-y-2.5 pt-2">
                    {p.capabilities.map((cap, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-2.5 text-xs text-[#D9D2C5]">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            p.highlight ? "text-[#C47B50]" : "text-[#23847D]"
                          }`}
                        />
                        <span className="leading-relaxed font-sans">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Technical Status Line */}
                <div className="pt-4 border-t border-[rgba(244,240,232,0.08)] flex items-center justify-between text-[10px] font-mono text-[#6F7772]">
                  <span>SUB-SYSTEM INTEGRITY</span>
                  <span
                    className={
                      p.highlight
                        ? "text-[#C47B50] font-bold"
                        : "text-[#23847D] font-bold"
                    }
                  >
                    100% OPERATIONAL
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
