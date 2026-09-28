"use client";

import React, { useState } from "react";
import {
  FileText,
  AlertTriangle,
  FileCheck2,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";

export function IntelligenceSection() {
  const [selectedPromptIdx, setSelectedPromptIdx] = useState<number>(0);

  const CASES = [
    {
      caseId: "CASE-2026-KA-BLR-102A",
      label: "Encroachment & Ceiling Deviation",
      targetEntity: "BLD-KA-BLR-102 (Aura Horizon Commercial Complex)",
      inquiry: "Evaluate geometric boundary overlap and vertical ceiling compliance against sanctioned municipal master plan.",
      evaluationEngine: "PostGIS 3.4 ST_3DIntersects & ST_Difference",
      executionLatency: "64ms",
      findings: [
        {
          rule: "RULE-SETBACK-01 · Cadastral Setback Overlap",
          deviation: "14.20 m² Boundary Encroachment",
          details: "Building eastern facade footprint extends approximately 1.8m beyond registered parcel boundary.",
          severity: "HIGH",
          confidence: "96.5% Precision",
          source: "2026 Drone Photogrammetry (GSD 1.2cm)",
        },
        {
          rule: "RULE-HEIGHT-01 · Sanctioned Height Ceiling",
          deviation: "+3.00m Sanction Ceiling Exceeded (FL-03)",
          details: "LiDAR laser altimetry detected 4 physical stories (14.5m) exceeding the sanctioned limit of 3 floors (11.5m).",
          severity: "MEDIUM",
          confidence: "94.2% Precision",
          source: "Airborne LiDAR Point Cloud Altimetry",
        },
      ],
      notice:
        "Advisory Spatial Notice: Geometric findings indicate physical footprint or boundary misalignment for surveyor verification. They do not constitute statutory legal violations or judicial determinations.",
    },
    {
      caseId: "CASE-2026-KA-BLR-102B",
      label: "Infrastructure Safety Proximity Buffer",
      targetEntity: "PARCEL-KA-BLR-102 (Survey 102/3B)",
      inquiry: "Calculate 50-meter topological buffer radius against gazetted municipal transportation and utility conduits.",
      evaluationEngine: "PostGIS 3.4 ST_DWithin & ST_Buffer",
      executionLatency: "48ms",
      findings: [
        {
          rule: "RULE-INFR-01 · Roadway Setback Buffer",
          deviation: "4.8m Clearance (10m Required)",
          details: "Property boundary is situated within safety proximity buffer of 8th Main Arterial Road corridor.",
          severity: "MEDIUM",
          confidence: "98.0% Precision",
          source: "Municipal Arterial Right-of-Way Registry",
        },
        {
          rule: "RULE-UTIL-02 · Subsurface Storm Drain Clearance",
          deviation: "12.4m Distance (Compliant)",
          details: "Subsurface storm water conduit runs parallel along western edge with adequate structural buffer.",
          severity: "LOW",
          confidence: "95.0% Precision",
          source: "Urban Utilities GIS Geodatabase",
        },
      ],
      notice:
        "Advisory Spatial Notice: Proximity buffers are derived from municipal utility geodatabases and require field alignment check prior to deep excavation.",
    },
  ];

  const current = CASES[selectedPromptIdx];

  return (
    <section
      id="intelligence"
      className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210] relative overflow-hidden"
    >
      {/* Geodetic Grid Background */}
      <div className="absolute inset-0 bg-geodetic-grid opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#23847D] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
            <span>GROUNDED SPATIAL INTELLIGENCE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F0E8] font-mono leading-tight">
            Forensic Surveyor Case File Dossier
          </h2>
          <p className="text-sm sm:text-base text-[#D9D2C5] leading-relaxed font-sans max-w-2xl mx-auto">
            BhuSetu 3D leverages grounded spatial reasoning to query PostGIS database facts.
            Zero generative hallucinations, fully cited sensor flight manifests, and deterministic rule explanations.
          </p>
        </div>

        {/* Forensic Case File Container */}
        <div className="max-w-5xl mx-auto rounded-[14px] bg-[#141816] border border-[rgba(244,240,232,0.08)] shadow-sm relative overflow-hidden">
          {/* Dossier Header Bar */}
          <div className="h-12 bg-[#1A201D] border-b border-[rgba(244,240,232,0.08)] px-6 flex items-center justify-between text-xs font-mono text-[#D9D2C5]">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#C47B50]" />
              <span className="font-bold text-[#F4F0E8]">{current.caseId}</span>
              <span className="text-[#6F7772]">| DOSSIER RECORD</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-[#6F7772]">
              <span>{current.evaluationEngine}</span>
              <span className="text-[#23847D] font-bold">LATENCY: {current.executionLatency}</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Case Selector Tabs */}
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[rgba(244,240,232,0.08)]">
              <span className="text-[11px] font-mono text-[#6F7772] mr-2">SELECT CASE FILE:</span>
              {CASES.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPromptIdx(idx)}
                  className={`px-3.5 py-1.5 rounded-[6px] text-xs font-mono transition-all ${
                    selectedPromptIdx === idx
                      ? "bg-[#B56E48] text-[#F4F0E8] font-bold shadow-sm"
                      : "bg-[#1A201D] text-[#6F7772] hover:text-[#D9D2C5] border border-[rgba(244,240,232,0.08)]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Target & Investigation Inquiry */}
            <div className="p-4 rounded-[8px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] space-y-2 text-left">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#6F7772]">
                <span>TARGET OBJECT:</span>
                <span className="text-[#F4F0E8] font-bold">{current.targetEntity}</span>
              </div>
              <div className="text-xs text-[#D9D2C5] font-sans leading-relaxed">
                <span className="font-mono text-[10px] text-[#6F7772] block mb-1">INQUIRY SPECIFICATION:</span>
                {current.inquiry}
              </div>
            </div>

            {/* Deterministic Spatial Findings */}
            <div className="space-y-3 text-left">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#23847D] font-bold">
                EVALUATION FINDINGS (DETERMINISTIC SPATIAL RULES)
              </div>

              <div className="space-y-3">
                {current.findings.map((f, fIdx) => (
                  <div
                    key={fIdx}
                    className="p-4 rounded-[8px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#F4F0E8]">{f.rule}</span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-[4px] font-bold shrink-0 border ${
                          f.severity === "HIGH"
                            ? "bg-[#B56E48]/20 text-[#C47B50] border-[#B56E48]/40"
                            : "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/40"
                        }`}
                      >
                        {f.severity} SEVERITY
                      </span>
                    </div>

                    <p className="text-xs text-[#D9D2C5] font-sans leading-relaxed">
                      {f.details}
                    </p>

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[rgba(244,240,232,0.06)] text-[11px] font-mono text-[#6F7772] gap-2">
                      <span className="text-[#C47B50] font-bold">Deviation: {f.deviation}</span>
                      <span>Precision: {f.confidence}</span>
                      <span>Lineage: {f.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mandatory Surveyor Legal Notice */}
            <div className="p-3.5 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] flex items-start gap-3 text-[11px] font-mono text-[#6F7772] leading-relaxed text-left">
              <ShieldAlert className="w-4 h-4 text-[#C47B50] shrink-0 mt-0.5" />
              <span>{current.notice}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
