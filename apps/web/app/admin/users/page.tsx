"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  Users,
  Shield,
  CheckCircle2,
  Mail,
  Building,
  KeyRound,
  ArrowLeft,
  UserCheck,
  Search,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const PERSONAS = [
    {
      id: "33333333-3333-4000-8000-000000000001",
      name: "Vikram Sen",
      email: "admin.official@bhusetu3d.gov.in",
      role: "ADMIN",
      department: "Land Revenue Directorate",
      clearance: "Level 4 (Super Admin)",
      status: "Active Institutional",
      badgeColor: "bg-[#B56E48]/20 text-[#E09F67] border-[#B56E48]/40",
      capabilities: "Full system administration, user management, audit trails, GIS parameters, and all module access.",
    },
    {
      id: "33333333-3333-4000-8000-000000000002",
      name: "Kavita Sharma",
      email: "officer.kavita@bhusetu3d.gov.in",
      role: "GOVERNMENT_OFFICER",
      department: "Urban Town Planning",
      clearance: "Level 3 (Review & Seal)",
      status: "Active Institutional",
      badgeColor: "bg-[#176C68]/20 text-[#2EB8B0] border-[#176C68]/40",
      capabilities: "Statutory verification review, KMC Section 321 enforcement notices, evidence review, and legal sign-offs.",
    },
    {
      id: "33333333-3333-4000-8000-000000000003",
      name: "Sunil Rao",
      email: "surveyor.rao@bhusetu3d.gov.in",
      role: "SURVEYOR",
      department: "Cadastral Survey Branch",
      clearance: "Level 2 (Field Operations)",
      status: "Active Institutional",
      badgeColor: "bg-[#2A443B]/30 text-[#4ADE80] border-[#2A443B]/60",
      capabilities: "Cadastral field survey capture, terrestrial laser scanning, drone photogrammetry upload, and field verification notes.",
    },
    {
      id: "33333333-3333-4000-8000-000000000004",
      name: "Priya Nair",
      email: "analyst.priya@bhusetu3d.gov.in",
      role: "ANALYST",
      department: "Geospatial Intelligence",
      clearance: "Level 2 (Spatial Analytics)",
      status: "Active Institutional",
      badgeColor: "bg-[#253248]/30 text-[#60A5FA] border-[#253248]/60",
      capabilities: "Topological conflict analysis, AI spatial investigator, 4D temporal changes, and explainable quality scoring.",
    },
  ];

  const filteredPersonas = PERSONAS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute requiredRole="ADMIN" moduleName="User Directory">
      <div className="flex-1 flex overflow-hidden select-none bg-[#0F1210]">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-[#0F1210]">
          <div className="border-b border-[rgba(244,240,232,0.06)] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Link
                  href="/admin"
                  className="text-xs font-mono text-[#94A3B8] hover:text-[#F4F0E8] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Admin Hub</span>
                </Link>
                <span className="text-xs font-mono text-[#6F7772]">/</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-[3px] bg-[#1C1613] text-[#E09F67] border border-[#B56E48]/35 font-bold uppercase">
                  USER DIRECTORY
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0E8] font-mono">
                User Access & Evaluator Directory
              </h1>
              <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1 font-sans">
                Authoritative institutional profiles, active role assignments, and permission clearance levels.
              </p>
            </div>

            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user, email, or role..."
                className="pl-9 pr-4 py-2 rounded-[6px] bg-[#141816] border border-[rgba(244,240,232,0.08)] text-xs font-mono text-[#F4F0E8] placeholder:text-[#6F7772] outline-none w-full sm:w-64"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredPersonas.map((persona) => (
              <div
                key={persona.id}
                className="p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.06)] hover:border-[rgba(244,240,232,0.12)] transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-base font-bold font-mono text-[#F4F0E8]">{persona.name}</h3>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${persona.badgeColor}`}>
                      {persona.role}
                    </span>
                    <span className="text-xs font-mono text-[#94A3B8]">
                      Clearance: <strong className="text-[#CBD5E1]">{persona.clearance}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#CBD5E1]">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {persona.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {persona.department}
                    </span>
                    <span className="text-[#94A3B8]">UUID: {persona.id}</span>
                  </div>

                  <p className="text-xs text-[#94A3B8] font-sans leading-relaxed pt-1">
                    {persona.capabilities}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded bg-[#161B18] border border-[rgba(244,240,232,0.08)] text-[11px] font-mono text-[#2EB8B0] flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2EB8B0]" />
                    {persona.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
