"use client";

import React from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  Shield,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Info,
  Lock,
} from "lucide-react";

export default function AdminRolesPage() {
  const MATRIX = [
    {
      feature: "Workspace Overview & Telemetry",
      admin: true,
      officer: true,
      surveyor: true,
      analyst: true,
      notes: "Customized role-specific dashboard rendered for each persona",
    },
    {
      feature: "3D City Digital Twin (Cesium WebGL)",
      admin: true,
      officer: true,
      surveyor: true,
      analyst: true,
      notes: "Inspect 3D building models, floor cutaways, and parcel bounds",
    },
    {
      feature: "Cadastral Property Registry",
      admin: true,
      officer: true,
      surveyor: true,
      analyst: true,
      notes: "2D parcels, 3D ULPIN units, and spatial strata demarcation",
    },
    {
      feature: "Statutory Verification Queue",
      admin: true,
      officer: true,
      surveyor: true,
      analyst: false,
      notes: "Surveyors submit field notes; Officers and Admin approve",
    },
    {
      feature: "Statutory Approval & Legal Sign-off",
      admin: true,
      officer: true,
      surveyor: false,
      analyst: false,
      notes: "Legally seal verification decisions with cryptographic signature",
    },
    {
      feature: "Discrepancy Engine (Setbacks & Height)",
      admin: true,
      officer: true,
      surveyor: false,
      analyst: true,
      notes: "Automated spatial conflict detection and violation auditing",
    },
    {
      feature: "AI Spatial Investigator (Gemini 2.5)",
      admin: true,
      officer: false,
      surveyor: false,
      analyst: true,
      notes: "Natural language query engine grounded in PostGIS database",
    },
    {
      feature: "Spatial Analysis & Topology Engine",
      admin: true,
      officer: false,
      surveyor: false,
      analyst: true,
      notes: "Topological buffering, proximity calculations, and 3D intersection",
    },
    {
      feature: "Cryptographic Evidence Vault",
      admin: true,
      officer: true,
      surveyor: true,
      analyst: true,
      notes: "View sensor datasets, flight IDs, and SHA-256 hashes",
    },
    {
      feature: "Upload Sensor Datasets & LiDAR",
      admin: true,
      officer: false,
      surveyor: true,
      analyst: false,
      notes: "Ingest field drone photogrammetry and terrestrial scans",
    },
    {
      feature: "4D History Scrubber (2024–2026)",
      admin: true,
      officer: true,
      surveyor: false,
      analyst: true,
      notes: "Multi-epoch temporal change detection and historical scrub",
    },
    {
      feature: "Analytics & Quality Intelligence",
      admin: true,
      officer: true,
      surveyor: false,
      analyst: true,
      notes: "7-dimension explainable data quality radar and conformance",
    },
    {
      feature: "Platform Administration (Users, Audit, Config)",
      admin: true,
      officer: false,
      surveyor: false,
      analyst: false,
      notes: "Full administrative controls and security parameter configuration",
    },
  ];

  return (
    <ProtectedRoute requiredRole="ADMIN" moduleName="Role Capability Matrix">
      <div className="flex-1 flex overflow-hidden select-none bg-[#0F1210]">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 bg-[#0F1210]">
          <div className="border-b border-[rgba(244,240,232,0.06)] pb-5">
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
                ROLE CAPABILITY MATRIX
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0E8] font-mono">
              Role-Based Access Control (RBAC) Capability Matrix
            </h1>
            <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1 font-sans">
              Authoritative capability mappings enforced across client routing, sidebar navigation, FastAPI endpoints, and PostgreSQL Row-Level Security.
            </p>
          </div>

          <div className="rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.06)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[rgba(244,240,232,0.08)] bg-[#0E1210] text-[#94A3B8]">
                    <th className="p-4 font-semibold uppercase">Platform Capability / Module</th>
                    <th className="p-4 font-semibold uppercase text-center text-[#E09F67]">ADMIN</th>
                    <th className="p-4 font-semibold uppercase text-center text-[#2EB8B0]">OFFICER</th>
                    <th className="p-4 font-semibold uppercase text-center text-[#4ADE80]">SURVEYOR</th>
                    <th className="p-4 font-semibold uppercase text-center text-[#60A5FA]">ANALYST</th>
                    <th className="p-4 font-semibold uppercase">Governance Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(244,240,232,0.04)]">
                  {MATRIX.map((row) => (
                    <tr key={row.feature} className="hover:bg-[#161B18]/70 transition-colors">
                      <td className="p-4 font-semibold text-[#F4F0E8]">{row.feature}</td>
                      <td className="p-4 text-center">
                        {row.admin ? (
                          <CheckCircle2 className="w-4 h-4 text-[#2EB8B0] inline-block" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#6F7772] inline-block" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.officer ? (
                          <CheckCircle2 className="w-4 h-4 text-[#2EB8B0] inline-block" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#6F7772] inline-block" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.surveyor ? (
                          <CheckCircle2 className="w-4 h-4 text-[#4ADE80] inline-block" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#6F7772] inline-block" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.analyst ? (
                          <CheckCircle2 className="w-4 h-4 text-[#60A5FA] inline-block" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#6F7772] inline-block" />
                        )}
                      </td>
                      <td className="p-4 text-[#94A3B8] font-sans text-xs">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
