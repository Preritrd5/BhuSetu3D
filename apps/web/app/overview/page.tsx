"use client";

import React from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { SystemStatus } from "@/components/status/SystemStatus";
import { useAuth } from "@/hooks/useAuth";
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
} from "lucide-react";

export default function OverviewPage() {
  const { user } = useAuth();
  const primaryRole = user?.roles?.[0] || "PUBLIC_USER";

  const MODULES = [
    {
      title: "3D City Workspace",
      desc: "3D building extrusions, roof elevations, and LoD2 volumetric envelopes.",
      icon: Building2,
      href: "/3d-city",
      badge: "3D Cadastre",
      badgeColor: "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/40",
    },
    {
      title: "Cadastral Parcels",
      desc: "2D Survey boundaries, ULPIN registry, and multi-tier property hierarchy.",
      icon: MapPin,
      href: "/properties",
      badge: "Land Layer",
      badgeColor: "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/40",
    },
    {
      title: "Spatial Conflicts",
      desc: "Automated setback overlap and vertical height deviation analysis.",
      icon: AlertTriangle,
      href: "/conflicts",
      badge: "Discrepancies",
      badgeColor: "bg-[#B56E48]/20 text-[#C47B50] border-[#B56E48]/40",
    },
    {
      title: "AI Investigator",
      desc: "Grounded spatial queries powered by Gemini with database verification.",
      icon: Sparkles,
      href: "/spatial-investigator",
      badge: "Grounded AI",
      badgeColor: "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/40",
    },
    {
      title: "Evidence & Lineage",
      desc: "Multi-source sensor fusion with confidence tracking and flight IDs.",
      icon: FileCheck2,
      href: "/evidence",
      badge: "Authoritative",
      badgeColor: "bg-[#1A201D] text-[#D9D2C5] border-[rgba(244,240,232,0.15)]",
    },
    {
      title: "4D History",
      desc: "Multi-epoch property evolution (2024–2026) and change detection.",
      icon: History,
      href: "/history",
      badge: "Temporal",
      badgeColor: "bg-[#1A201D] text-[#D9D2C5] border-[rgba(244,240,232,0.15)]",
    },
    {
      title: "Subsurface Utilities",
      desc: "Proximity buffers for storm drains, potable water lines, and roadways.",
      icon: Layers,
      href: "/spatial-analysis",
      badge: "Infrastructure",
      badgeColor: "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/40",
    },
    {
      title: "Quality Intelligence",
      desc: "7-dimension explainable data quality scoring and completeness snapshots.",
      icon: BarChart3,
      href: "/analytics",
      badge: "Explainable",
      badgeColor: "bg-[#1A201D] text-[#D9D2C5] border-[rgba(244,240,232,0.15)]",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="flex-1 flex overflow-hidden select-none bg-[#0F1210]">
        {/* Structural Left Navigation Rail */}
        <Sidebar />

        {/* Main Workspace Canvas */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 bg-[#0F1210]">
          {/* Header Banner */}
          <div className="border-b border-[rgba(244,240,232,0.08)] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-[4px] bg-[#141816] text-[#23847D] border border-[#176C68]/40 uppercase font-bold">
                  ENTERPRISE GIS PLATFORM
                </span>
                <span className="text-xs font-mono text-[#6F7772]">
                  PostGIS 3D Engine · Live Spatial Database
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#F4F0E8] font-mono">
                BhuSetu 3D
              </h1>
              <p className="text-sm text-[#D9D2C5] mt-1 max-w-3xl leading-relaxed font-sans">
                Evidence-Backed 3D Property Intelligence Platform. Vertically
                governed spatial hierarchy:{" "}
                <span className="text-[#23847D] font-mono text-xs font-semibold">
                  PARCEL → BUILDING → FLOOR → UNIT → INFRASTRUCTURE
                </span>
                .
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-[10px] bg-[#141816] border border-[rgba(244,240,232,0.08)] text-right">
                <div className="text-[10px] font-mono text-[#6F7772] uppercase font-semibold">
                  System Architecture
                </div>
                <div className="text-sm font-semibold font-mono text-[#C47B50] flex items-center gap-1.5 justify-end mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-[#B56E48]" />
                  <span>3D CADASTRE v2.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Authenticated Identity & Role Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-[14px] bg-[#141816] border border-[rgba(244,240,232,0.08)] md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-[#6F7772] tracking-wider flex items-center gap-1.5 font-semibold">
                    <UserCheck className="w-4 h-4 text-[#23847D]" />
                    Verified User Identity
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-[4px] bg-[#176C68]/20 text-[#23847D] border border-[#176C68]/40 font-bold">
                    AUTHORITATIVE SESSION
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[#F4F0E8] font-mono">
                    {user?.name || "Departmental Officer"}
                  </h2>
                  <p className="text-xs text-[#6F7772] font-mono">
                    {user?.email}
                  </p>
                  {user?.department && (
                    <p className="text-xs text-[#6F7772] mt-1 font-sans">
                      Department:{" "}
                      <span className="text-[#D9D2C5] font-medium">
                        {user.department}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[rgba(244,240,232,0.08)] flex items-center justify-between text-xs font-mono">
                <span className="text-[#6F7772]">Database User ID:</span>
                <span className="text-[#D9D2C5] truncate max-w-[200px] md:max-w-none">
                  {user?.id}
                </span>
              </div>
            </div>

            {/* Role Assignment Card */}
            <div className="p-6 rounded-[14px] bg-[#141816] border border-[rgba(244,240,232,0.08)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-[#6F7772] tracking-wider flex items-center gap-1.5 font-semibold">
                    <KeyRound className="w-4 h-4 text-[#C47B50]" />
                    Assigned Role
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#1A201D] text-[#D9D2C5] border border-[rgba(244,240,232,0.12)]">
                    RBAC ENFORCED
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="inline-block px-3 py-1.5 rounded-[6px] bg-[#B56E48]/20 border border-[#B56E48]/40 text-[#C47B50] font-mono font-bold text-sm tracking-wider shadow-sm">
                    {primaryRole}
                  </div>
                  <p className="text-xs text-[#6F7772] leading-relaxed font-sans">
                    Granular permissions enforced via PostgreSQL Row-Level Security
                    and FastAPI dependency injection.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[rgba(244,240,232,0.08)] text-[11px] text-[#6F7772] font-mono">
                Governance: <strong className="text-[#23847D]">SHA-256 Audit Chained</strong>
              </div>
            </div>
          </div>

          {/* Flagship 3D Digital Twin Workspace Hero Banner */}
          <div className="rounded-[14px] bg-[#141816] border border-[rgba(244,240,232,0.08)] p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
            <div className="space-y-2 z-10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-[4px] bg-[#1A201D] text-[#D9D2C5] border border-[rgba(244,240,232,0.12)] text-[10px] font-mono font-bold uppercase tracking-wider">
                  Flagship Interface
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#23847D]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
                  CesiumJS 3D WebGL Active
                </span>
              </div>
              <h2 className="text-xl font-bold font-mono text-[#F4F0E8] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#C47B50]" />
                <span>3D-First Digital Property Intelligence Workspace</span>
              </h2>
              <p className="text-xs text-[#D9D2C5] max-w-2xl leading-relaxed font-sans">
                Full-screen immersive 3D digital twin of Bengaluru cadastre. Inspect LoD2 building envelopes, stratified floor slabs, registered unit centroids, and subsurface utility buffers in real time.
              </p>
            </div>

            <Link
              href="/3d-city"
              className="px-5 py-2.5 rounded-[6px] bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] text-xs font-mono font-bold flex items-center gap-2 flex-shrink-0 z-10 transition-all shadow-sm"
            >
              <span>Launch 3D Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Platform Workspaces Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-[#F4F0E8] uppercase font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B56E48] inline-block" />
                Active Platform Workspaces
              </h2>
              <span className="text-xs text-[#6F7772] font-mono">
                8 Integrated Functional Modules
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {MODULES.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.title}
                    href={m.href}
                    className="p-5 rounded-[12px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.22)] transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] group-hover:border-[#B56E48] flex items-center justify-center text-[#D9D2C5] group-hover:text-[#C47B50] transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-[4px] border font-bold ${m.badgeColor}`}
                        >
                          {m.badge}
                        </span>
                      </div>

                      <h3 className="font-bold text-[#F4F0E8] text-sm font-mono group-hover:text-white transition-colors">
                        {m.title}
                      </h3>
                      <p className="text-xs text-[#6F7772] mt-1 leading-relaxed font-sans">
                        {m.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[rgba(244,240,232,0.08)] flex items-center justify-between text-[11px] font-mono text-[#6F7772] group-hover:text-[#D9D2C5] transition-colors">
                      <span>Open Module</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* System Health & Microservices Telemetry */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-[#F4F0E8] uppercase font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#176C68] inline-block" />
              Infrastructure & Microservices Telemetry
            </h2>
            <div className="p-5 rounded-[12px] bg-[#141816] border border-[rgba(244,240,232,0.08)]">
              <SystemStatus />
            </div>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
