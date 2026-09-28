"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, Compass } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[BhuSetu 3D] Unhandled route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#141816] text-[#F4F0E8] flex flex-col items-center justify-center p-6 select-none relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(#64748B_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      <div className="max-w-md w-full bg-[#0F1210]/90 backdrop-blur-2xl border border-[#6F7772]/80 rounded-[32px] p-8 shadow-2xl text-center space-y-6 relative z-10">
        <div className="w-16 h-16 rounded-[20px] bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-[0_2px_16px_rgba(245,158,11,0.2)]">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/30">
            SYSTEM NOTICE
          </span>
          <h2 className="text-xl font-bold font-mono text-[#F4F0E8]">
            Spatial View Temporarily Unavailable
          </h2>
          <p className="text-xs text-[#6F7772] leading-relaxed">
            The requested workspace view encountered an unexpected rendering condition. The underlying cadastral registry remains secure.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="btn-primary !w-full sm:!w-auto !py-2.5 !px-5 !text-xs !font-mono flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/overview"
            className="btn-secondary !w-full sm:!w-auto !py-2.5 !px-5 !text-xs !font-mono flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5 text-brand-primary" />
            <span>Overview</span>
          </Link>
        </div>

        <div className="text-[10px] font-mono text-[#6F7772] pt-2 border-t border-[rgba(244,240,232,0.08)]">
          Error Digest: {error.digest || "SYS-ERR-SPATIAL-RUNTIME"}
        </div>
      </div>
    </div>
  );
}
