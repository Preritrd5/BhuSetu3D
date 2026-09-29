"use client";

import React from "react";
import Link from "next/link";
import {
  UserCheck,
  AlertTriangle,
  Building2,
  FileCheck2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileWarning,
  Scale,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function OfficerDashboard() {
  const { user } = useAuth();

  const PENDING_CASES = [
    {
      id: "case-01",
      title: "Aura Horizon Commercial Complex",
      ward: "Malleshwaram W-101",
      issue: "FL-03 Facade Setback Deviation: +14.20 m² Eastward projection",
      severity: "CRITICAL",
      severityColor: "bg-[#B56E48]/20 text-[#E09F67] border-[#B56E48]/40",
      source: "Airborne LiDAR Altimetry #4092",
      href: "/verification",
      actionText: "Issue KMC Sec 321 Notice",
    },
    {
      id: "case-02",
      title: "Metro Mall Phase 2 Volumetric Extension",
      ward: "Yeshwanthpur W-098",
      issue: "Sanction Limit Exceeded: +1 Physical Floor (Measured G+3 vs Sanctioned G+2)",
      severity: "HIGH",
      severityColor: "bg-[#B56E48]/20 text-[#E09F67] border-[#B56E48]/40",
      source: "Drone Photogrammetry 2026",
      href: "/verification",
      actionText: "Examine Volumetric Polygon",
    },
    {
      id: "case-03",
      title: "Green Glen Residency Tower B",
      ward: "Malleshwaram W-101",
      issue: "Subsurface Utility Clearance Buffer: 0.2m separation (0.5m required)",
      severity: "MEDIUM",
      severityColor: "bg-[#176C68]/20 text-[#2EB8B0] border-[#176C68]/40",
      source: "PostGIS 3D Buffer Intersection",
      href: "/verification",
      actionText: "Review Utility Separation",
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Officer Key Focus Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-[10px] bg-[#171310] border border-[#B56E48]/35">
          <div className="text-[11px] font-mono text-[#E09F67] uppercase">Pending Statutory Verifications</div>
          <div className="text-2xl font-bold font-mono text-[#E09F67] mt-1">3 Cases</div>
          <div className="text-xs text-[#CBD5E1] font-mono mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#B56E48]" />
            Awaiting Official Determination
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.06)]">
          <div className="text-[11px] font-mono text-[#94A3B8] uppercase">Setback & Height Violations</div>
          <div className="text-2xl font-bold font-mono text-[#F4F0E8] mt-1">5 Active</div>
          <div className="text-xs text-[#2EB8B0] font-mono mt-1">
            LiDAR Audited Discrepancies
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.06)]">
          <div className="text-[11px] font-mono text-[#94A3B8] uppercase">Legally Sealed This Month</div>
          <div className="text-2xl font-bold font-mono text-[#2EB8B0] mt-1">18 Cleared</div>
          <div className="text-xs text-[#94A3B8] font-mono mt-1">
            Chained Cryptographic Signatures
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.06)]">
          <div className="text-[11px] font-mono text-[#94A3B8] uppercase">Jurisdiction Scope</div>
          <div className="text-2xl font-bold font-mono text-[#F4F0E8] mt-1">Ward 101</div>
          <div className="text-xs text-[#CBD5E1] font-mono mt-1">
            142 Commercial & Mixed Parcels
          </div>
        </div>
      </div>

      {/* 2. Priority Statutory Review Queue (Immediate Focus) */}
      <div className="p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.06)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(244,240,232,0.06)]">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#B56E48]" />
            <h2 className="text-sm font-bold font-mono text-[#F4F0E8] uppercase tracking-wide">
              Priority Statutory Review Queue (Immediate Official Action Required)
            </h2>
          </div>
          <Link
            href="/verification"
            className="text-xs font-mono text-[#2EB8B0] hover:underline flex items-center gap-1"
          >
            <span>Open Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {PENDING_CASES.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-[8px] bg-[#0E1210] border border-[rgba(244,240,232,0.06)] hover:border-[rgba(244,240,232,0.14)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold font-mono text-[#F4F0E8]">{item.title}</span>
                  <span className="text-xs font-mono text-[#94A3B8]">· {item.ward}</span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${item.severityColor}`}>
                    {item.severity}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#CBD5E1]">{item.issue}</div>
                <div className="text-[11px] font-mono text-[#94A3B8]">
                  Evidence Source: <span className="text-[#2EB8B0]">{item.source}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={item.href}
                  className="px-3.5 py-2 rounded-[5px] bg-[#176C68] hover:bg-[#1E827D] text-[#F4F0E8] text-xs font-mono font-semibold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{item.actionText}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Officer Review Workflows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/verification"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <UserCheck className="w-5 h-5 text-[#2EB8B0]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">Statutory Review Queue</div>
          <div className="text-xs text-[#94A3B8] mt-1">Review evidence, confirm violations, and record legal sign-offs.</div>
        </Link>

        <Link
          href="/conflicts"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <AlertTriangle className="w-5 h-5 text-[#B56E48]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">Discrepancy Engine</div>
          <div className="text-xs text-[#94A3B8] mt-1">Audit setback overlaps and physical floor limit exceedances.</div>
        </Link>

        <Link
          href="/3d-city"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <Building2 className="w-5 h-5 text-[#2EB8B0]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">3D Building Inspector</div>
          <div className="text-xs text-[#94A3B8] mt-1">Inspect multi-floor building cutaways and parcel envelopes.</div>
        </Link>

        <Link
          href="/history"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <FileCheck2 className="w-5 h-5 text-[#B56E48]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">4D History Scrubber</div>
          <div className="text-xs text-[#94A3B8] mt-1">Examine multi-epoch temporal changes from 2024 to 2026.</div>
        </Link>
      </div>
    </div>
  );
}
