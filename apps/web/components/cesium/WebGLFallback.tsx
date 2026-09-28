"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, Map, RefreshCw, Layers, ShieldCheck, ExternalLink } from "lucide-react";

interface WebGLFallbackProps {
  onRetry?: () => void;
  reason?: string;
  selectedParcelId?: string | null;
}

export function WebGLFallback({
  onRetry,
  reason = "WebGL hardware acceleration is not active or unavailable in this browser session.",
  selectedParcelId,
}: WebGLFallbackProps) {
  const parcelQuery = selectedParcelId ? `?parcel=${selectedParcelId}` : "";

  return (
    <div className="w-full h-full min-h-[400px] bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 select-none relative overflow-hidden font-sans">
      {/* Subtle Spatial Mesh Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#64748B_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 rounded-[32px] p-8 shadow-2xl text-center space-y-6 relative z-10">
        <div className="w-16 h-16 rounded-[22px] bg-amber-950/70 border border-amber-500/50 flex items-center justify-center text-amber-400 mx-auto shadow-[0_2px_16px_rgba(245,158,11,0.25)]">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40">
            HARDWARE COMPATIBILITY NOTICE
          </span>
          <h3 className="text-xl font-bold font-mono text-slate-100">
            3D Visualization Unavailable
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {reason}
          </p>
        </div>

        {/* Advisory Context */}
        <div className="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-3.5 rounded-[16px] border border-slate-800 text-left space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-secondary" />
            <span>Cadastral Data Remains 100% Accessible</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            You can continue inspecting parcel boundaries, ownership records, and spatial discrepancies using the 2D Cadastral Registry.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <Link
            href={`/properties${parcelQuery}`}
            className="btn-primary !w-full sm:!w-auto !py-2.5 !px-5 !text-xs !font-mono flex items-center justify-center gap-2"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Switch to 2D Cadastre</span>
          </Link>

          {onRetry && (
            <button
              onClick={onRetry}
              className="btn-secondary !w-full sm:!w-auto !py-2.5 !px-5 !text-xs !font-mono flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brand-primary" />
              <span>Retry 3D Engine</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
