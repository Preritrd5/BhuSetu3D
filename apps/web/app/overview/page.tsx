"use client";

import React from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { SystemStatus } from "@/components/status/SystemStatus";
import { useAuth } from "@/hooks/useAuth";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { OfficerDashboard } from "@/components/dashboard/OfficerDashboard";
import { SurveyorDashboard } from "@/components/dashboard/SurveyorDashboard";
import { AnalystDashboard } from "@/components/dashboard/AnalystDashboard";
import {
  ShieldCheck,
  UserCheck,
  Building2,
  KeyRound,
  Layers,
  MapPin,
  FileCheck2,
  AlertTriangle,
  History,
  Sparkles,
  BarChart3,
  ArrowRight,
  Shield,
} from "lucide-react";

export default function OverviewPage() {
  const { user } = useAuth();
  const primaryRole = user?.roles?.[0] || "PUBLIC_USER";
  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  return (
    <ProtectedRoute>
      <div className="flex-1 flex overflow-hidden select-none bg-[#0F1210] min-h-[calc(100vh-4rem)]">
        {/* Structural Left Navigation Rail */}
        <Sidebar />

        {/* Main Workspace Canvas */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 bg-[#0F1210]">
          {/* Header Banner */}
          <div className="border-b border-[rgba(244,240,232,0.08)] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-[4px] bg-[#141816] text-[#2EB8B0] border border-[#176C68]/40 uppercase font-bold tracking-wider">
                  ENTERPRISE SPATIAL PLATFORM
                </span>
                <span className="text-xs font-mono text-[#94A3B8]">
                  PostGIS 3D Engine · EPSG:32643 UTM 43N
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0E8] font-mono">
                Executive Mission Overview
              </h1>
              <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1 max-w-3xl leading-relaxed font-sans">
                Evidence-backed 3D property intelligence, strata hierarchy, and authoritative cadastral enforcement.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/3d-city"
                className="px-3.5 py-2 rounded-[6px] bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] text-xs font-mono font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                <span>Launch 3D City Twin</span>
              </Link>
            </div>
          </div>

          {/* Authority & Operational Mission Control Strip */}
          <div className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[6px] bg-[#171D1A] border border-[#23847D]/40 flex items-center justify-center text-[#2EB8B0] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono uppercase text-[#94A3B8] font-semibold">
                    Authorized Clearance:
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-[4px] bg-[#176C68]/20 text-[#2EB8B0] border border-[#176C68]/40 font-bold uppercase">
                    {primaryRole === "GOVERNMENT_OFFICER" ? "OFFICER" : primaryRole}
                  </span>
                  <span className="text-xs font-mono text-[#4ADE80] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#176C68] animate-pulse" />
                    Live PostGIS
                  </span>
                </div>
                <div className="text-xs text-[#CBD5E1] font-mono mt-0.5 truncate">
                  Operator: <strong className="text-[#F4F0E8]">{user?.name || "Evaluator"}</strong> · {user?.department || "Cadastral Directorate"}
                </div>
              </div>
            </div>

            {/* Quick Strategic Workflow Navigation */}
            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin && (
                <>
                  <Link
                    href="/admin/users"
                    className="px-3 py-1.5 rounded-[5px] bg-[#1A201D] hover:bg-[#232B27] border border-[rgba(244,240,232,0.10)] text-[#F4F0E8] text-xs font-mono font-medium transition-all"
                  >
                    User Directory
                  </Link>
                  <Link
                    href="/admin/audit"
                    className="px-3 py-1.5 rounded-[5px] bg-[#1A201D] hover:bg-[#232B27] border border-[rgba(244,240,232,0.10)] text-[#F4F0E8] text-xs font-mono font-medium transition-all"
                  >
                    Audit Ledger
                  </Link>
                </>
              )}
              {primaryRole === "GOVERNMENT_OFFICER" && (
                <>
                  <Link
                    href="/verification"
                    className="px-3 py-1.5 rounded-[5px] bg-[#176C68]/30 hover:bg-[#176C68]/50 border border-[#176C68]/50 text-[#2EB8B0] text-xs font-mono font-semibold transition-all"
                  >
                    Review Queue
                  </Link>
                  <Link
                    href="/conflicts"
                    className="px-3 py-1.5 rounded-[5px] bg-[#1A201D] hover:bg-[#232B27] border border-[rgba(244,240,232,0.10)] text-[#F4F0E8] text-xs font-mono font-medium transition-all"
                  >
                    Discrepancies
                  </Link>
                </>
              )}
              {primaryRole === "SURVEYOR" && (
                <>
                  <Link
                    href="/properties"
                    className="px-3 py-1.5 rounded-[5px] bg-[#176C68]/30 hover:bg-[#176C68]/50 border border-[#176C68]/50 text-[#2EB8B0] text-xs font-mono font-semibold transition-all"
                  >
                    Cadastral Registry
                  </Link>
                  <Link
                    href="/evidence"
                    className="px-3 py-1.5 rounded-[5px] bg-[#1A201D] hover:bg-[#232B27] border border-[rgba(244,240,232,0.10)] text-[#F4F0E8] text-xs font-mono font-medium transition-all"
                  >
                    Evidence Vault
                  </Link>
                </>
              )}
              {primaryRole === "ANALYST" && (
                <>
                  <Link
                    href="/spatial-investigator"
                    className="px-3 py-1.5 rounded-[5px] bg-[#176C68]/30 hover:bg-[#176C68]/50 border border-[#176C68]/50 text-[#2EB8B0] text-xs font-mono font-semibold transition-all"
                  >
                    AI Investigator
                  </Link>
                  <Link
                    href="/spatial-analysis"
                    className="px-3 py-1.5 rounded-[5px] bg-[#1A201D] hover:bg-[#232B27] border border-[rgba(244,240,232,0.10)] text-[#F4F0E8] text-xs font-mono font-medium transition-all"
                  >
                    Topology Engine
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* DYNAMIC ROLE-SPECIFIC WORKSPACE DASHBOARD */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(244,240,232,0.06)]">
              <h2 className="text-xs sm:text-sm font-bold tracking-wider text-[#F4F0E8] uppercase font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#B56E48] inline-block" />
                {primaryRole === "ADMIN" && "System Administration & Infrastructure Control"}
                {primaryRole === "GOVERNMENT_OFFICER" && "Statutory Review & Verification Command Center"}
                {primaryRole === "SURVEYOR" && "Cadastral Survey Operations & Field Assignment Queue"}
                {primaryRole === "ANALYST" && "Spatial Intelligence & Analytical Investigation Hub"}
              </h2>
              <span className="text-xs text-[#94A3B8] font-mono">
                Role-Tailored Architecture
              </span>
            </div>

            {primaryRole === "ADMIN" && <AdminDashboard />}
            {primaryRole === "GOVERNMENT_OFFICER" && <OfficerDashboard />}
            {primaryRole === "SURVEYOR" && <SurveyorDashboard />}
            {primaryRole === "ANALYST" && <AnalystDashboard />}
            {primaryRole !== "ADMIN" &&
              primaryRole !== "GOVERNMENT_OFFICER" &&
              primaryRole !== "SURVEYOR" &&
              primaryRole !== "ANALYST" && <OfficerDashboard />}
          </section>

          {/* System Health & Microservices Telemetry */}
          <section className="space-y-3 pt-2">
            <h2 className="text-xs sm:text-sm font-bold tracking-wider text-[#F4F0E8] uppercase font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#176C68] inline-block" />
              Live Infrastructure & PostGIS Telemetry
            </h2>
            <div className="p-4 sm:p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.08)]">
              <SystemStatus />
            </div>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
