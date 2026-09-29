"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  Sliders,
  Compass,
  ArrowLeft,
  CheckCircle2,
  Save,
  Globe2,
  Ruler,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [crs, setCrs] = useState("EPSG:32643");
  const [baseMSL, setBaseMSL] = useState("920.50");
  const [tolerance, setTolerance] = useState("0.05");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <ProtectedRoute requiredRole="ADMIN" moduleName="GIS Engine Settings">
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
                GIS ENGINE SETTINGS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0E8] font-mono">
              GIS Engine & Spatial Parameters
            </h1>
            <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1 font-sans">
              System-wide geodetic coordinate reference system (CRS), datum elevation offsets, and PostGIS geometric tolerances.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
            <div className="p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.06)] space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-[#F4F0E8] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#B56E48]" />
                  <span>Coordinate Reference System (CRS)</span>
                </label>
                <select
                  value={crs}
                  onChange={(e) => setCrs(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[6px] bg-[#0E1210] border border-[rgba(244,240,232,0.1)] text-xs font-mono text-[#F4F0E8] outline-none focus:border-[#2EB8B0]"
                >
                  <option value="EPSG:32643">EPSG:32643 — WGS 84 / UTM Zone 43N (Bengaluru Urban)</option>
                  <option value="EPSG:4326">EPSG:4326 — WGS 84 Geographic Latitude / Longitude</option>
                  <option value="EPSG:7761">EPSG:7761 — WGS 84 / UTM Zone 43N (Survey of India Conformal)</option>
                </select>
                <p className="text-[11px] text-[#94A3B8] font-sans">
                  Default cartographic projection used for all PostGIS ST_3DIntersects and area calculations.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-[#F4F0E8] flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-[#2EB8B0]" />
                  <span>Base Mean Sea Level (MSL) Datum (Meters)</span>
                </label>
                <input
                  type="text"
                  value={baseMSL}
                  onChange={(e) => setBaseMSL(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[6px] bg-[#0E1210] border border-[rgba(244,240,232,0.1)] text-xs font-mono text-[#F4F0E8] outline-none focus:border-[#2EB8B0]"
                />
                <p className="text-[11px] text-[#94A3B8] font-sans">
                  Bengaluru urban reference elevation benchmark (Survey of India Ground Truth: 920.50m MSL).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-[#F4F0E8] flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-[#B56E48]" />
                  <span>Setback Violation Tolerance Threshold (Meters)</span>
                </label>
                <input
                  type="text"
                  value={tolerance}
                  onChange={(e) => setTolerance(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[6px] bg-[#0E1210] border border-[rgba(244,240,232,0.1)] text-xs font-mono text-[#F4F0E8] outline-none focus:border-[#2EB8B0]"
                />
                <p className="text-[11px] text-[#94A3B8] font-sans">
                  Legal measurement tolerance buffer (0.05m = ±5cm) before flagging statutory deviation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-[6px] bg-[#176C68] hover:bg-[#1E827D] text-[#F4F0E8] font-semibold text-xs font-mono transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Parameters</span>
              </button>
              {saved && (
                <span className="text-xs font-mono text-[#2EB8B0] flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  Parameters updated successfully!
                </span>
              )}
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
