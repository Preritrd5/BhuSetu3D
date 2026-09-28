import React from "react";
import Link from "next/link";
import { Compass, Globe2, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#141816] text-[#F4F0E8] flex flex-col items-center justify-center p-6 select-none relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(#64748B_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      <div className="max-w-md w-full bg-[#141816]/95 backdrop-blur-2xl border border-[rgba(244,240,232,0.1)] rounded-[20px] p-8 shadow-2xl text-center space-y-6 relative z-10">
        <div className="w-16 h-16 rounded-[14px] bg-[#B56E48]/15 border border-[#B56E48]/40 flex items-center justify-center text-[#B56E48] mx-auto shadow-[0_2px_16px_rgba(181,110,72,0.25)]">
          <Compass className="w-8 h-8 text-[#B56E48]" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#B56E48] font-bold px-2.5 py-0.5 rounded-full bg-[#B56E48]/10 border border-[#B56E48]/30">
            404 · SPATIAL ANCHOR NOT FOUND
          </span>
          <h2 className="text-2xl font-bold font-sans text-[#F4F0E8]">
            Coordinate Out of Bounds
          </h2>
          <p className="text-xs text-[#77867C] leading-relaxed">
            The requested property coordinate, view, or route does not exist within the current cadastral index.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/3d-city"
            className="btn-primary !w-full sm:!w-auto !py-2.5 !px-5 !text-xs !font-mono flex items-center justify-center gap-2"
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Return to 3D City</span>
          </Link>
          <Link
            href="/"
            className="btn-secondary !w-full sm:!w-auto !py-2.5 !px-5 !text-xs !font-mono flex items-center justify-center gap-2"
          >
            <span>Landing Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
