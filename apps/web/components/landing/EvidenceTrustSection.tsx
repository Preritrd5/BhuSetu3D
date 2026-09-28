"use client";

import React from "react";
import {
  FileCheck2,
  Scale,
  Database,
} from "lucide-react";

export function EvidenceTrustSection() {
  const EVIDENCE_SOURCES = [
    {
      source: "Bengaluru Digital Cadastral Boundary Layer v2.1",
      classification: "AUTHORITATIVE",
      method: "Total Station & DGPS Ground Survey Vectorization",
      captureEpoch: "2024-Q1 · Baseline Deed",
      precision: "96.5% Precision",
      role: "Official statutory baseline for parcel lot boundaries.",
      isAuthoritative: true,
    },
    {
      source: "High-Resolution Drone Photogrammetry 3D Mesh",
      classification: "AUTHORITATIVE",
      method: "Structure-from-Motion (SfM) + Multi-View Stereo (MVS)",
      captureEpoch: "2026-Q1 · DJI M300 UAV",
      precision: "94.2% Precision",
      role: "Physical architectural envelope and facade reality mesh.",
      isAuthoritative: true,
    },
    {
      source: "Airborne LiDAR Dense Elevation Point Cloud",
      classification: "DERIVED",
      method: "High-Density Laser Altimetry (DSM minus DEM)",
      captureEpoch: "2025-Q2 · Airborne Laser",
      precision: "95.0% Precision",
      role: "Absolute ground and roof peak elevation measurements.",
      isAuthoritative: false,
    },
    {
      source: "Approved Municipal Building Sanction Order",
      classification: "AUTHORITATIVE",
      method: "Architectural Drawing Digitization & Height Ceiling",
      captureEpoch: "2022-Q3 · Municipal Record",
      precision: "98.0% Precision",
      role: "Statutory permitted floors and municipal setback rules.",
      isAuthoritative: true,
    },
  ];

  return (
    <section
      id="evidence"
      className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210] relative overflow-hidden"
    >
      {/* Geodetic Grid Background */}
      <div className="absolute inset-0 bg-geodetic-grid opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#23847D] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
            <span>TRUST & VERIFIABILITY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F0E8] font-mono leading-tight">
            Evidence-Backed Spatial Verifiability
          </h2>
          <p className="text-sm sm:text-base text-[#D9D2C5] leading-relaxed font-sans max-w-2xl mx-auto">
            Every 3D coordinate, boundary segment, and building height measurement in BhuSetu 3D
            is traceable to verifiable sensor captures, flight manifests, and official statutory records.
          </p>
        </div>

        {/* The Mandatory Decoupling Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Card 1: Confidence vs Verification */}
          <div className="p-8 rounded-[14px] bg-[#141816] border border-[rgba(244,240,232,0.08)] space-y-5 text-left relative overflow-hidden group shadow-sm">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C47B50]">
              <Scale className="w-4 h-4 text-[#B56E48]" />
              <span>CORE ARCHITECTURAL PRINCIPLE 01</span>
            </div>
            <h3 className="text-xl font-bold font-mono text-[#F4F0E8]">
              Technical Confidence ≠ Statutory Verification
            </h3>
            <p className="text-xs sm:text-sm text-[#D9D2C5] font-sans leading-relaxed">
              <strong>Technical Confidence</strong> reflects sensor resolution and algorithmic certainty (e.g. 94.2% LiDAR precision).
              <strong> Statutory Verification</strong> reflects human and institutional legal confirmation (e.g. UNDER_REVIEW or VERIFIED).
              BhuSetu never collapses technical certainty into legal status.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(244,240,232,0.08)] text-xs font-mono">
              <div className="p-3.5 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                <span className="text-[10px] text-[#6F7772] uppercase block">Technical Score</span>
                <span className="text-sm font-bold text-[#23847D] mt-0.5 block">93.4% Composite</span>
              </div>
              <div className="p-3.5 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                <span className="text-[10px] text-[#6F7772] uppercase block">Workflow State</span>
                <span className="text-sm font-bold text-[#C47B50] mt-0.5 block">UNDER_REVIEW</span>
              </div>
            </div>
          </div>

          {/* Card 2: Derived vs Authoritative */}
          <div className="p-8 rounded-[14px] bg-[#141816] border border-[rgba(244,240,232,0.08)] space-y-5 text-left relative overflow-hidden group shadow-sm">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#23847D]">
              <FileCheck2 className="w-4 h-4 text-[#176C68]" />
              <span>CORE ARCHITECTURAL PRINCIPLE 02</span>
            </div>
            <h3 className="text-xl font-bold font-mono text-[#F4F0E8]">
              Derived Geometry ≠ Authoritative Records
            </h3>
            <p className="text-xs sm:text-sm text-[#D9D2C5] font-sans leading-relaxed">
              <strong>Authoritative Datasets</strong> originate from verified government cadastral registries and gazetted survey orders.
              <strong> Derived Datasets</strong> are calculated from machine-learning extrusions, point-cloud subtractions, or reality meshes.
              BhuSetu clearly distinguishes both with persistent classification tags.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(244,240,232,0.08)] text-xs font-mono">
              <div className="p-3.5 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                <span className="text-[10px] text-[#6F7772] uppercase block">Registered Deed</span>
                <span className="text-sm font-bold text-[#F4F0E8] mt-0.5 block">AUTHORITATIVE</span>
              </div>
              <div className="p-3.5 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                <span className="text-[10px] text-[#6F7772] uppercase block">AI Mesh Extrusion</span>
                <span className="text-sm font-bold text-[#6F7772] mt-0.5 block">DERIVED MODEL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Source Sensor Vault Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {EVIDENCE_SOURCES.map((ev, idx) => (
            <div
              key={idx}
              className="p-5 rounded-[10px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.22)] transition-all duration-200 space-y-3 text-left flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-[4px] border ${
                      ev.isAuthoritative
                        ? "bg-[#176C68]/15 text-[#23847D] border-[#176C68]/40"
                        : "bg-[#1A201D] text-[#6F7772] border-[rgba(244,240,232,0.12)]"
                    }`}
                  >
                    {ev.classification}
                  </span>
                  <span className="text-[10px] font-mono text-[#6F7772]">
                    {ev.precision}
                  </span>
                </div>
                <h4 className="text-xs font-bold font-mono text-[#F4F0E8] leading-snug">
                  {ev.source}
                </h4>
                <p className="text-[11px] text-[#D9D2C5] font-sans leading-relaxed">
                  {ev.role}
                </p>
              </div>

              <div className="pt-2 border-t border-[rgba(244,240,232,0.08)] text-[10px] font-mono text-[#6F7772] space-y-0.5">
                <div>Method: {ev.method}</div>
                <div>Capture: {ev.captureEpoch}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
