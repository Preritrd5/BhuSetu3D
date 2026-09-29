"use client";

import React from "react";
import { ShieldCheck, AlertCircle, Sparkles, Database, CheckCircle2, HelpCircle } from "lucide-react";
import { TrustSource, VerificationState } from "@/types/selection";

interface DataTrustIndicatorProps {
  source: TrustSource;
  verificationState: VerificationState;
  confidence?: number | null;
  className?: string;
}

export const DataTrustIndicator: React.FC<DataTrustIndicatorProps> = ({
  source,
  verificationState,
  confidence,
  className = "",
}) => {
  // Format source chip
  const renderSourceChip = () => {
    switch (source) {
      case "AUTHORITATIVE":
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#176C68]/15 text-[#23847D] border border-[#176C68]/30 text-[10px] font-mono font-medium"
            title="Sourced directly from verified government land records / survey registry"
          >
            <Database className="w-2.5 h-2.5" />
            <span>AUTHORITATIVE</span>
          </span>
        );
      case "DERIVED":
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1A201D] text-[#D9D2C5] border border-[rgba(244,240,232,0.12)] text-[10px] font-mono font-medium"
            title="Computed algorithmically from 3D geometry / point cloud slicing"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#B56E48]" />
            <span>DERIVED</span>
          </span>
        );
      case "AI-DERIVED":
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#176C68]/10 text-[#23847D] border border-[#176C68]/25 text-[10px] font-mono font-medium"
            title="Extracted via AI computer vision & photogrammetric pipelines"
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>AI-DERIVED</span>
          </span>
        );
      case "ILLUSTRATIVE":
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#B56E48]/20 text-[#C47B50] border border-[#B56E48]/35 text-[10px] font-mono font-medium"
            title="Demonstration 3D Spatial Geometry (Illustrative — Not Authoritative Cadastral Data)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C47B50]" />
            <span>ILLUSTRATIVE (DEMO)</span>
          </span>
        );
      case "INFERRED":
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1A201D] text-[#77867C] border border-[rgba(244,240,232,0.08)] text-[10px] font-mono"
            title="Statistically inferred based on adjacent zoning / architectural heuristics"
          >
            <HelpCircle className="w-2.5 h-2.5" />
            <span>INFERRED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1A201D] text-[#77867C] border border-[rgba(244,240,232,0.08)] text-[10px] font-mono">
            <span>UNVERIFIED</span>
          </span>
        );
    }
  };

  // Format verification status chip
  const renderVerificationChip = () => {
    switch (verificationState) {
      case "VERIFIED":
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-950/30 text-emerald-300 border border-emerald-800/40 text-[10px] font-mono font-medium"
            title="Officially validated against municipal sanctions & land registry"
          >
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span>VERIFIED</span>
          </span>
        );
      case "DISCREPANCY_DETECTED":
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-rose-950/30 text-rose-300 border border-rose-800/40 text-[10px] font-mono font-semibold"
            title="Discrepancy detected between observed 3D twin and sanctioned ceiling / setback buffer"
          >
            <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
            <span>DISCREPANCY</span>
          </span>
        );
      case "REVIEW_REQUIRED":
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-amber-950/30 text-amber-300 border border-amber-800/40 text-[10px] font-mono font-medium"
            title="Spatial variance exceeds tolerance — manual inspection recommended"
          >
            <AlertCircle className="w-2.5 h-2.5 text-amber-400" />
            <span>REVIEW REQ</span>
          </span>
        );
      case "UNVERIFIED":
      default:
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1A201D] text-[#77867C] border border-[rgba(244,240,232,0.08)] text-[10px] font-mono"
            title="Awaiting field verification or authority endorsement"
          >
            <HelpCircle className="w-2.5 h-2.5" />
            <span>PENDING</span>
          </span>
        );
    }
  };

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {renderSourceChip()}
      {renderVerificationChip()}
      {confidence !== undefined && confidence !== null && (
        <span
          className="text-[10px] font-mono text-[#77867C] bg-[#0F1210] px-1.5 py-0.5 rounded-[4px] border border-[rgba(244,240,232,0.08)]"
          title="Statistical confidence score (independent from legal verification)"
        >
          {Math.round(confidence * 100)}% conf
        </span>
      )}
    </div>
  );
};
