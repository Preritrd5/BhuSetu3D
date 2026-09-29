"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Layers,
  AlertTriangle,
  History,
  BarChart3,
  Building2,
  CheckCircle2,
  ArrowRight,
  Search,
  Compass,
  Cpu,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function AnalystDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [queryInput, setQueryInput] = useState("");

  const SAMPLE_QUERIES = [
    "Which commercial buildings exceed sanctioned height limits in Malleshwaram?",
    "Identify parcels overlapping with municipal storm water drain buffers",
    "Show 2024 to 2026 vertical roof additions along Market Road",
  ];

  const handleRunQuery = (q: string) => {
    router.push(`/spatial-investigator?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="space-y-8">
      {/* 1. Spatial Intelligence Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-[10px] bg-[#121614] border border-[#B56E48]/35 bg-[#171310]">
          <div className="text-[11px] font-mono text-[#E09F67] uppercase">Detected Spatial Anomalies</div>
          <div className="text-2xl font-bold font-mono text-[#E09F67] mt-1">8 Conflicts</div>
          <div className="text-xs text-[#CBD5E1] font-mono mt-1">
            Topological & Volumetric Overlaps
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.06)]">
          <div className="text-[11px] font-mono text-[#94A3B8] uppercase">Grounded AI Inquiries</div>
          <div className="text-2xl font-bold font-mono text-[#2EB8B0] mt-1">42 Executed</div>
          <div className="text-xs text-[#94A3B8] font-mono mt-1 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-[#2EB8B0]" />
            Gemini PostGIS Intent Engine
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.06)]">
          <div className="text-[11px] font-mono text-[#94A3B8] uppercase">Geometric Conformance</div>
          <div className="text-2xl font-bold font-mono text-[#F4F0E8] mt-1">94.2%</div>
          <div className="text-xs text-[#2EB8B0] font-mono mt-1">
            Explainable Data Quality Rating
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#121614] border border-[rgba(244,240,232,0.06)]">
          <div className="text-[11px] font-mono text-[#94A3B8] uppercase">4D Multi-Epoch Scans</div>
          <div className="text-2xl font-bold font-mono text-[#F4F0E8] mt-1">14 Shifts</div>
          <div className="text-xs text-[#CBD5E1] font-mono mt-1">
            2024 vs 2026 Altimetric Deltas
          </div>
        </div>
      </div>

      {/* 2. AI Spatial Investigation Workbench (Analyst Flagship Tool) */}
      <div className="p-5 rounded-[12px] bg-[#121614] border border-[rgba(244,240,232,0.06)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(244,240,232,0.06)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2EB8B0]" />
            <h2 className="text-sm font-bold font-mono text-[#F4F0E8] uppercase tracking-wide">
              Grounded AI Spatial Investigator (Analyst Workbench)
            </h2>
          </div>
          <Link
            href="/spatial-investigator"
            className="text-xs font-mono text-[#2EB8B0] hover:underline flex items-center gap-1"
          >
            <span>Open Investigator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (queryInput.trim()) handleRunQuery(queryInput);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask grounded spatial questions: 'Which parcels violate setback regulations in Malleshwaram?'"
                className="w-full pl-10 pr-4 py-2.5 rounded-[6px] bg-[#0E1210] border border-[rgba(244,240,232,0.1)] focus:border-[#2EB8B0] text-xs font-mono text-[#F4F0E8] placeholder:text-[#6F7772] outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-[6px] bg-[#176C68] hover:bg-[#1E827D] text-[#F4F0E8] text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Query AI</span>
            </button>
          </form>

          <div className="space-y-1.5 pt-2">
            <div className="text-[11px] font-mono text-[#94A3B8] uppercase">Pre-Seeded Spatial Investigation Queries:</div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleRunQuery(q)}
                  className="px-2.5 py-1.5 rounded-[4px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] text-left text-xs font-mono text-[#CBD5E1] transition-all cursor-pointer"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Analyst Core Tooling Center */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/spatial-analysis"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <Layers className="w-5 h-5 text-[#2EB8B0]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">Spatial Analysis Engine</div>
          <div className="text-xs text-[#94A3B8] mt-1">Run topological buffer queries, intersection tests, and volumetric delta checks.</div>
        </Link>

        <Link
          href="/conflicts"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <AlertTriangle className="w-5 h-5 text-[#B56E48]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">Discrepancy Engine</div>
          <div className="text-xs text-[#94A3B8] mt-1">Examine detected setback deviations and building height violations.</div>
        </Link>

        <Link
          href="/history"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <History className="w-5 h-5 text-[#2EB8B0]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">4D History Scrubber</div>
          <div className="text-xs text-[#94A3B8] mt-1">Perform multi-epoch comparison between 2024 and 2026 spatial models.</div>
        </Link>

        <Link
          href="/analytics"
          className="p-4 rounded-[10px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] hover:border-[#2EB8B0]/50 hover:bg-[#1A221E] transition-all group"
        >
          <div className="flex items-center justify-between">
            <BarChart3 className="w-5 h-5 text-[#B56E48]" />
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F4F0E8] transition-colors" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F4F0E8] mt-3">Analytics & Quality</div>
          <div className="text-xs text-[#94A3B8] mt-1">Inspect explainable quality scores, record completeness, and GIS radar.</div>
        </Link>
      </div>
    </div>
  );
}
