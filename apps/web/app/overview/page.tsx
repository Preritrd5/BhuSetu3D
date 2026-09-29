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

  return (
    <ProtectedRoute>
      <div className="flex-1 flex overflow-hidden select-none bg-[#0F1210]">
        {/* Structural Left Navigation Rail */}
        <Sidebar />

        {/* Main Workspace Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 bg-[#0F1210]">
          
          {/* Header Banner */}
          <div className="border-b border-[rgba(244,240,232,0.06)] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-[4px] bg-[#141816] text-[#2EB8B0] border border-[#176C68]/40 uppercase font-bold tracking-wider">
                  ENTERPRISE GIS PLATFORM
                </span>
                <span className="text-xs font-mono text-[#94A3B8]">
                  PostGIS 3D Engine · Live Spatial Database
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0E8] font-mono">
                BhuSetu 3D
              </h1>
              <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1 max-w-3xl leading-relaxed font-sans">
                Evidence-Backed 3D Property Intelligence Platform. Vertically
                governed spatial hierarchy:{" "}
                <span className="text-[#2EB8B0] font-mono text-xs font-semibold">
                  PARCEL → BUILDING → FLOOR → UNIT → INFRASTRUCTURE
                </span>
                .
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-[8px] bg-[#141816] border border-[rgba(244,240,232,0.06)] text-left sm:text-right">
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase font-semibold">
                  Active Mission Scope
                </div>
                <div className="text-xs sm:text-sm font-semibold font-mono text-[#E09F67] flex items-center gap-1.5 justify-start sm:justify-end mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-[#B56E48]" />
                  <span>
                    {primaryRole === "ADMIN"
                      ? "SYSTEM ADMINISTRATION"
                      : primaryRole === "GOVERNMENT_OFFICER"
                      ? "STATUTORY REVIEW"
                      : primaryRole === "SURVEYOR"
                      ? "FIELD CADASTRE"
                      : "SPATIAL INTELLIGENCE"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Authenticated Identity & Institutional Role Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.06)] md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-mono uppercase text-[#94A3B8] tracking-wider flex items-center gap-1.5 font-semibold">
                    <UserCheck className="w-4 h-4 text-[#2EB8B0]" />
                    Authenticated Evaluator Identity
                  </span>
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-[4px] bg-[#176C68]/20 text-[#2EB8B0] border border-[#176C68]/40 font-bold">
                    AUTHORITATIVE SESSION
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-bold text-[#F4F0E8] font-mono">
                    {user?.name || "Institutional Official"}
                  </h2>
                  <p className="text-xs text-[#94A3B8] font-mono truncate">
                    {user?.email}
                  </p>
                  {user?.department && (
                    <p className="text-xs text-[#CBD5E1] mt-1 font-sans">
                      Department:{" "}
                      <span className="text-[#F4F0E8] font-medium font-mono">
                        {user.department}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[rgba(244,240,232,0.04)] flex flex-wrap items-center justify-between text-xs font-mono text-[#94A3B8]">
                <span>Session ID: <strong className="text-[#CBD5E1] font-mono">{user?.id?.slice(0, 18)}...</strong></span>
                <span className="text-[#2EB8B0]">Institutional Single-Sign-On</span>
              </div>
            </div>

            {/* Role Assignment Card */}
            <div className="p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.06)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-mono uppercase text-[#94A3B8] tracking-wider flex items-center gap-1.5 font-semibold">
                    <KeyRound className="w-4 h-4 text-[#B56E48]" />
                    Assigned Role
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-[#1A201D] text-[#CBD5E1] border border-[rgba(244,240,232,0.08)]">
                    RBAC ENFORCED
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="inline-block px-3 py-1 rounded-[5px] bg-[#B56E48]/20 border border-[#B56E48]/40 text-[#E09F67] font-mono font-bold text-sm tracking-wider shadow-sm">
                    {primaryRole}
                  </div>
                  <p className="text-xs text-[#CBD5E1] leading-relaxed font-sans">
                    {primaryRole === "ADMIN" && "Full administrative control, audit log inspection, and system configuration."}
                    {primaryRole === "GOVERNMENT_OFFICER" && "Statutory verification review, conflict determination, and legal sign-offs."}
                    {primaryRole === "SURVEYOR" && "Field cadastral survey capture, drone photogrammetry, and measurement notes."}
                    {primaryRole === "ANALYST" && "Spatial anomaly detection, AI query investigation, and 4D temporal changes."}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[rgba(244,240,232,0.04)] text-[11px] text-[#94A3B8] font-mono">
                Governance: <strong className="text-[#2EB8B0]">Row-Level Security Active</strong>
              </div>
            </div>
          </div>

          {/* DYNAMIC ROLE-SPECIFIC WORKSPACE DASHBOARD */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(244,240,232,0.04)]">
              <h2 className="text-xs sm:text-sm font-semibold tracking-wide text-[#F4F0E8] uppercase font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B56E48] inline-block" />
                {primaryRole === "ADMIN" && "System Administration & Infrastructure Control"}
                {primaryRole === "GOVERNMENT_OFFICER" && "Statutory Review & Verification Command Center"}
                {primaryRole === "SURVEYOR" && "Cadastral Survey Operations & Field Assignment Queue"}
                {primaryRole === "ANALYST" && "Spatial Intelligence & Analytical Investigation Hub"}
              </h2>
              <span className="text-xs text-[#94A3B8] font-mono">
                Role-Tailored Information Architecture
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
            <h2 className="text-xs sm:text-sm font-semibold tracking-wide text-[#F4F0E8] uppercase font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#176C68] inline-block" />
              Live Infrastructure & PostGIS Telemetry
            </h2>
            <div className="p-4 sm:p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.06)]">
              <SystemStatus />
            </div>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
