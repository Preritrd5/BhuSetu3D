"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Server,
  Database,
  Sliders,
  FileText,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ArrowRight,
  Activity,
  Layers,
  MapPin,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function AdminDashboard() {
  const { user } = useAuth();

  const SERVICES = [
    {
      name: "PostGIS 3D Spatial Engine",
      status: "OPERATIONAL",
      latency: "1.2 ms",
      detail: "4,892 registered parcels in UTM Zone 43N",
      icon: Database,
    },
    {
      name: "Cesium 3D Tile Streamer",
      status: "OPERATIONAL",
      latency: "8.4 ms",
      detail: "LoD2 volumetric building cutaways active",
      icon: Building2,
    },
    {
      name: "Gemini Spatial Intelligence",
      status: "CONNECTED",
      latency: "142 ms",
      detail: "Grounded natural language intent model",
      icon: Layers,
    },
    {
      name: "Cryptographic Audit Ledger",
      status: "VERIFIED",
      latency: "0.8 ms",
      detail: "492 chained SHA-256 block signatures",
      icon: ShieldCheck,
    },
  ];

  const ACTIVE_EVALUATORS = [
    {
      name: "Vikram Sen",
      role: "ADMIN",
      department: "Land Revenue Directorate",
      email: "admin.official@bhusetu3d.gov.in",
      status: "Current Session",
      badgeColor: "bg-[#B56E48]/20 text-[#E09F67] border-[#B56E48]/40",
    },
    {
      name: "Kavita Sharma",
      role: "GOVERNMENT_OFFICER",
      department: "Urban Town Planning",
      email: "officer.kavita@bhusetu3d.gov.in",
      status: "Active Clearance",
      badgeColor: "bg-[#176C68]/20 text-[#2EB8B0] border-[#176C68]/40",
    },
    {
      name: "Sunil Rao",
      role: "SURVEYOR",
      department: "Cadastral Survey Branch",
      email: "surveyor.rao@bhusetu3d.gov.in",
      status: "Active Clearance",
      badgeColor: "bg-[#2A443B]/30 text-[#4ADE80] border-[#2A443B]/60",
    },
    {
      name: "Priya Nair",
      role: "ANALYST",
      department: "Geospatial Intelligence",
      email: "analyst.priya@bhusetu3d.gov.in",
      status: "Active Clearance",
      badgeColor: "bg-[#253248]/30 text-[#60A5FA] border-[#253248]/60",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Platform Telemetry Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.08)]">
          <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider font-semibold">Total Cadastral Parcels</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#F4F0E8] mt-1">4,892</div>
          <div className="text-xs text-[#2EB8B0] font-mono mt-1.5 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            100% Conformal UTM 43N
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.08)]">
          <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider font-semibold">3D Volumetric Units</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#F4F0E8] mt-1">12,450</div>
          <div className="text-xs text-[#CBD5E1] font-mono mt-1.5 font-medium">
            LoD2 Architectural Slices
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#171310] border border-[#B56E48]/40">
          <div className="text-xs font-mono text-[#E09F67] uppercase tracking-wider font-semibold">Active Discrepancies</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#E09F67] mt-1">5 Open</div>
          <div className="text-xs text-[#CBD5E1] font-mono mt-1.5 font-medium">
            Aura Horizon +14.2m² Eastward
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.08)]">
          <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider font-semibold">System Security Level</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#2EB8B0] mt-1">Level 4</div>
          <div className="text-xs text-[#94A3B8] font-mono mt-1.5 font-medium">
            Full RBAC Isolation Active
          </div>
        </div>
      </div>

      {/* 2. Microservice Health & System Architecture */}
      <div className="p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.08)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(244,240,232,0.08)]">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#B56E48]" />
            <h2 className="text-sm font-bold font-mono text-[#F4F0E8] uppercase tracking-wide">
              Microservice Architecture & Spatial Engine Health
            </h2>
          </div>
          <span className="text-xs font-mono text-[#2EB8B0] flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#176C68] animate-pulse" />
            ALL SYSTEMS NORMAL (99.98%)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SERVICES.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.name}
                className="p-3.5 rounded-[8px] bg-[#0E1210] border border-[rgba(244,240,232,0.08)] flex items-start justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-[#161B18] text-[#2EB8B0] shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold font-mono text-[#F4F0E8]">{srv.name}</div>
                    <div className="text-xs font-mono text-[#94A3B8] mt-0.5">{srv.detail}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#176C68]/20 border border-[#176C68]/40 text-[#2EB8B0] font-semibold">
                    {srv.status}
                  </span>
                  <div className="text-xs font-mono text-[#CBD5E1] mt-1">{srv.latency}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Active Evaluator Persona Directory */}
      <div className="p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.08)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(244,240,232,0.08)]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2EB8B0]" />
            <h2 className="text-sm font-bold font-mono text-[#F4F0E8] uppercase tracking-wide">
              Institutional Evaluator Personas (BhuSetu 3D RBAC)
            </h2>
          </div>
          <Link
            href="/admin/users"
            className="text-xs font-mono text-[#2EB8B0] hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Manage Access</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {ACTIVE_EVALUATORS.map((evaluator) => (
            <div
              key={evaluator.email}
              className={`p-3.5 rounded-[8px] border ${
                evaluator.email === user?.email
                  ? "bg-[#181D1A] border-[#23847D]/50 ring-1 ring-[#23847D]/30"
                  : "bg-[#0E1210] border-[rgba(244,240,232,0.08)]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold uppercase ${evaluator.badgeColor}`}>
                  {evaluator.role}
                </span>
                {evaluator.email === user?.email && (
                  <span className="text-xs font-mono text-[#2EB8B0] font-bold">● YOU</span>
                )}
              </div>
              <div className="text-sm font-semibold font-mono text-[#F4F0E8]">{evaluator.name}</div>
              <div className="text-xs font-mono text-[#94A3B8] truncate mt-0.5">{evaluator.department}</div>
              <div className="text-xs font-mono text-[#CBD5E1] truncate mt-1">{evaluator.email}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Quick Platform Administrative Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/users"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <Users className="w-5 h-5 text-[#2EB8B0]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">User Access Control</div>
          <div className="text-xs text-[#94A3B8] mt-1">Review evaluator accounts and active platform tokens.</div>
        </Link>

        <Link
          href="/admin/roles"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <Shield className="w-5 h-5 text-[#B56E48]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">Role Capability Matrix</div>
          <div className="text-xs text-[#94A3B8] mt-1">Inspect permission grants across all 4 personas.</div>
        </Link>

        <Link
          href="/admin/audit"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <FileText className="w-5 h-5 text-[#2EB8B0]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">Security Audit Trail</div>
          <div className="text-xs text-[#94A3B8] mt-1">Verify SHA-256 cryptographic hashes and access logs.</div>
        </Link>

        <Link
          href="/admin/settings"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <Sliders className="w-5 h-5 text-[#B56E48]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">GIS Engine Settings</div>
          <div className="text-xs text-[#94A3B8] mt-1">Configure datum origins, EPSG:32643, and tolerance.</div>
        </Link>
      </div>
    </div>
  );
}
