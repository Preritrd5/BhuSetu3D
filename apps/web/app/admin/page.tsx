"use client";

import React from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  Users,
  Shield,
  FileText,
  Sliders,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Server,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredRole="ADMIN" moduleName="Platform Administration">
      <div className="flex-1 flex overflow-hidden select-none bg-[#0F1210]">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 bg-[#0F1210]">
          <div className="border-b border-[rgba(244,240,232,0.06)] pb-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-[4px] bg-[#1C1613] text-[#E09F67] border border-[#B56E48]/35 font-bold uppercase tracking-wider">
                ADMINISTRATION CONSOLE
              </span>
              <span className="text-xs font-mono text-[#94A3B8]">
                Restricted to Platform Administrators
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0E8] font-mono">
              BhuSetu 3D Administration
            </h1>
            <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1 max-w-2xl font-sans">
              Manage evaluator accounts, inspect role capability matrices, verify cryptographic security audit chains, and tune PostGIS/Cesium GIS parameters.
            </p>
          </div>

          {/* Admin Navigation Hub Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/users"
              className="p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.06)] hover:border-[#2EB8B0]/50 hover:bg-[#151B18] transition-all group shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-[6px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] flex items-center justify-center text-[#2EB8B0]">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#176C68]/20 border border-[#176C68]/35 text-[#2EB8B0] font-bold uppercase">
                    4 Personas
                  </span>
                </div>
                <h3 className="text-base font-bold font-mono text-[#F4F0E8] group-hover:text-white">
                  User Access & Evaluator Directory
                </h3>
                <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed font-sans">
                  Inspect institutional evaluator profiles (Vikram Sen, Kavita Sharma, Sunil Rao, Priya Nair), active authentication sessions, and department mappings.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[rgba(244,240,232,0.04)] flex items-center justify-between text-xs font-mono text-[#2EB8B0]">
                <span>Manage Evaluators</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/admin/roles"
              className="p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.06)] hover:border-[#B56E48]/50 hover:bg-[#181411] transition-all group shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-[6px] bg-[#1C1613] border border-[#B56E48]/30 flex items-center justify-center text-[#E09F67]">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#B56E48]/20 border border-[#B56E48]/35 text-[#E09F67] font-bold uppercase">
                    4 Roles
                  </span>
                </div>
                <h3 className="text-base font-bold font-mono text-[#F4F0E8] group-hover:text-white">
                  Role Capability Matrix & RBAC
                </h3>
                <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed font-sans">
                  Inspect granular permissions across ADMIN, GOVERNMENT_OFFICER, SURVEYOR, and ANALYST for properties, verification, conflicts, and evidence.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[rgba(244,240,232,0.04)] flex items-center justify-between text-xs font-mono text-[#E09F67]">
                <span>View Capability Matrix</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/admin/audit"
              className="p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.06)] hover:border-[#2EB8B0]/50 hover:bg-[#151B18] transition-all group shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-[6px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] flex items-center justify-center text-[#2EB8B0]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#176C68]/20 border border-[#176C68]/35 text-[#2EB8B0] font-bold uppercase">
                    Chained Hashes
                  </span>
                </div>
                <h3 className="text-base font-bold font-mono text-[#F4F0E8] group-hover:text-white">
                  Cryptographic Security Audit Trail
                </h3>
                <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed font-sans">
                  Full append-only audit trail logging logins, role verifications, statutory review sign-offs, and boundary mutations with SHA-256 integrity verification.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[rgba(244,240,232,0.04)] flex items-center justify-between text-xs font-mono text-[#2EB8B0]">
                <span>Inspect Audit Ledger</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/admin/settings"
              className="p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.06)] hover:border-[#B56E48]/50 hover:bg-[#181411] transition-all group shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-[6px] bg-[#1C1613] border border-[#B56E48]/30 flex items-center justify-center text-[#E09F67]">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A201D] border border-[rgba(244,240,232,0.08)] text-[#CBD5E1] font-bold uppercase">
                    EPSG:32643
                  </span>
                </div>
                <h3 className="text-base font-bold font-mono text-[#F4F0E8] group-hover:text-white">
                  GIS Engine & Spatial Parameters
                </h3>
                <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed font-sans">
                  Configure coordinate reference system projections (UTM Zone 43N), base datum levels (920.50m MSL), and setback tolerance limits.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[rgba(244,240,232,0.04)] flex items-center justify-between text-xs font-mono text-[#E09F67]">
                <span>Configure GIS Engine</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
