"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  FileText,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
  Search,
} from "lucide-react";

export default function AdminAuditPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const AUDIT_EVENTS = [
    {
      id: "EVT-4092-01",
      timestamp: "2026-09-29 22:52:14 UTC",
      actor: "admin.official@bhusetu3d.gov.in (Vikram Sen)",
      role: "ADMIN",
      action: "PLATFORM_AUTH_VERIFIED",
      details: "SSO Bearer Token issued with Level 4 Administrative Clearance.",
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      chainVerified: true,
    },
    {
      id: "EVT-4092-02",
      timestamp: "2026-09-29 21:40:02 UTC",
      actor: "officer.kavita@bhusetu3d.gov.in (Kavita Sharma)",
      role: "GOVERNMENT_OFFICER",
      action: "STATUTORY_REVIEW_OPENED",
      details: "Initiated formal verification for Aura Horizon FL-03 setback discrepancy.",
      hash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
      chainVerified: true,
    },
    {
      id: "EVT-4092-03",
      timestamp: "2026-09-29 20:15:44 UTC",
      actor: "surveyor.rao@bhusetu3d.gov.in (Sunil Rao)",
      role: "SURVEYOR",
      action: "SENSOR_DATASET_INGESTED",
      details: "Uploaded LiDAR Point Cloud #4092 for Malleshwaram W-101 (240.0 m²).",
      hash: "5f4dcc3b5aa765d61d8327deb882cf992b96decac7e1279a0b0d346ff039be4f",
      chainVerified: true,
    },
    {
      id: "EVT-4092-04",
      timestamp: "2026-09-29 19:30:11 UTC",
      actor: "analyst.priya@bhusetu3d.gov.in (Priya Nair)",
      role: "ANALYST",
      action: "TOPOLOGICAL_CONFLICT_RUN",
      details: "Executed PostGIS 3D ST_3DIntersects buffer check across 142 parcels.",
      hash: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
      chainVerified: true,
    },
  ];

  const filteredEvents = AUDIT_EVENTS.filter(
    (e) =>
      e.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute requiredRole="ADMIN" moduleName="Security Audit Trail">
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
                  SECURITY AUDIT
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0E8] font-mono">
                Cryptographic Security Audit Trail
              </h1>
              <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1 font-sans">
                Immutable, append-only ledger tracking all authentication, authorization, and cadastral data mutations.
              </p>
            </div>

            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search audit action, actor..."
                className="pl-9 pr-4 py-2 rounded-[6px] bg-[#141816] border border-[rgba(244,240,232,0.08)] text-xs font-mono text-[#F4F0E8] placeholder:text-[#6F7772] outline-none w-full sm:w-64"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.06)] hover:border-[rgba(244,240,232,0.12)] transition-all space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#F4F0E8]">{evt.id}</span>
                    <span className="text-xs font-mono text-[#2EB8B0] font-semibold">{evt.action}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#161B18] text-[#E09F67] border border-[#B56E48]/30 font-bold uppercase">
                      {evt.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{evt.timestamp}</span>
                  </div>
                </div>

                <div className="text-xs font-mono text-[#CBD5E1]">{evt.details}</div>

                <div className="pt-2 border-t border-[rgba(244,240,232,0.04)] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#94A3B8]">
                  <span>Actor: <strong className="text-[#F4F0E8]">{evt.actor}</strong></span>
                  <div className="flex items-center gap-1.5 text-[#2EB8B0]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>SHA-256: {evt.hash.slice(0, 24)}... (Verified Chain)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
