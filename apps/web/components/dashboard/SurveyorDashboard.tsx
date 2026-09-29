"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Building2,
  FileCheck2,
  UploadCloud,
  CheckCircle2,
  Clock,
  ArrowRight,
  Compass,
  Ruler,
  Layers,
  Camera,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function SurveyorDashboard() {
  const { user } = useAuth();

  const ASSIGNED_TASKS = [
    {
      id: "task-01",
      parcel: "Survey Parcel 102/3B",
      project: "Aura Horizon Commercial Complex",
      ward: "Malleshwaram W-101",
      objective: "Airborne LiDAR & Drone Photogrammetry of FL-03 Setback",
      status: "IN PROGRESS",
      statusColor: "bg-[#B56E48]/20 text-[#E09F67] border-[#B56E48]/40",
      targetElevation: "931.0m – 935.0m MSL",
      href: "/3d-city",
      actionText: "Inspect 3D Geometry",
    },
    {
      id: "task-02",
      parcel: "Survey Parcel 104/1A",
      project: "Market Road Widening Cadastre",
      ward: "Malleshwaram W-101",
      objective: "Terrestrial Laser Scan (TLS) of Frontage Boundary Pegs",
      status: "PENDING UPLOAD",
      statusColor: "bg-[#176C68]/20 text-[#2EB8B0] border-[#176C68]/40",
      targetElevation: "920.50m Base Datum",
      href: "/evidence",
      actionText: "Upload TLS Point Cloud",
    },
    {
      id: "task-03",
      parcel: "Utility Corridor SWD-W101",
      project: "Municipal Storm Water Drain Buffer",
      ward: "Malleshwaram W-101",
      objective: "Invert Depth Probe (-1.80m MSL) relative to Building Footprint",
      status: "READY FOR SUBMISSION",
      statusColor: "bg-[#2A443B]/30 text-[#4ADE80] border-[#2A443B]/60",
      targetElevation: "-1.80m Subterranean",
      href: "/verification",
      actionText: "Submit Field Note",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Surveyor Operational Field Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.08)]">
          <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider font-semibold">Assigned Field Surveys</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#2EB8B0] mt-1">4 Active</div>
          <div className="text-xs text-[#CBD5E1] font-mono mt-1.5 font-medium">
            Malleshwaram Cadastral Sector
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.08)]">
          <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider font-semibold">Sensor Datasets Pending</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#F4F0E8] mt-1">2 Datasets</div>
          <div className="text-xs text-[#E09F67] font-mono mt-1.5 flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#B56E48]" />
            LiDAR & Drone Mesh
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.08)]">
          <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider font-semibold">Field Verifications Logged</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#F4F0E8] mt-1">12 Submitted</div>
          <div className="text-xs text-[#94A3B8] font-mono mt-1.5 font-medium">
            Ready for Statutory Review
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.08)]">
          <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider font-semibold">RTK GPS Calibration</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#4ADE80] mt-1">±1.4 cm</div>
          <div className="text-xs text-[#CBD5E1] font-mono mt-1.5 font-medium">
            PPK Dual-Frequency Locked
          </div>
        </div>
      </div>

      {/* 2. Active Field Cadastre Assignments */}
      <div className="p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.08)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(244,240,232,0.08)]">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#2EB8B0]" />
            <h2 className="text-sm font-bold font-mono text-[#F4F0E8] uppercase tracking-wide">
              Active Field Cadastre Assignments & Surveys
            </h2>
          </div>
          <span className="text-xs font-mono text-[#CBD5E1] font-semibold">
            Survey Sector: Malleshwaram W-101
          </span>
        </div>

        <div className="space-y-3">
          {ASSIGNED_TASKS.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-[8px] bg-[#0E1210] border border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.16)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold font-mono text-[#F4F0E8]">{task.parcel}</span>
                  <span className="text-xs font-mono text-[#94A3B8]">· {task.project}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold uppercase ${task.statusColor}`}>
                    {task.status}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#CBD5E1]">{task.objective}</div>
                <div className="text-xs font-mono text-[#94A3B8]">
                  Datum Constraint: <span className="text-[#2EB8B0]">{task.targetElevation}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={task.href}
                  className="px-3.5 py-2 rounded-[5px] bg-[#176C68] hover:bg-[#1E827D] text-[#F4F0E8] text-xs font-mono font-semibold transition-all shadow-sm flex items-center gap-1.5 min-h-[38px]"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{task.actionText}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Field Capture & Tooling Center */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/3d-city"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <Building2 className="w-5 h-5 text-[#2EB8B0]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">3D Parcel Twin</div>
          <div className="text-xs text-[#94A3B8] mt-1">Examine extruded 3D buildings and floor cutaway models.</div>
        </Link>

        <Link
          href="/properties"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <MapPin className="w-5 h-5 text-[#2EB8B0]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">Cadastral Boundary Registry</div>
          <div className="text-xs text-[#94A3B8] mt-1">Query registered 2D survey parcels and legal boundary coordinates.</div>
        </Link>

        <Link
          href="/evidence"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <UploadCloud className="w-5 h-5 text-[#2EB8B0]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">Upload Sensor Evidence</div>
          <div className="text-xs text-[#94A3B8] mt-1">Ingest drone photogrammetry and LiDAR point clouds into the vault.</div>
        </Link>

        <Link
          href="/verification"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <FileCheck2 className="w-5 h-5 text-[#2EB8B0]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">Submit Field Verifications</div>
          <div className="text-xs text-[#94A3B8] mt-1">Send captured field notes to town planning officers for approval.</div>
        </Link>
      </div>
    </div>
  );
}
