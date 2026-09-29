"use client";

/**
 * BhuSetu 3D 403 Access Restricted Component
 * Professional Evidence-Backed Geospatial Workstation
 */
import React from "react";
import { ShieldAlert, ArrowLeft, Home, Lock, KeyRound } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface AccessRestrictedProps {
  requiredRole?: string;
  moduleName?: string;
}

export function AccessRestricted({ requiredRole, moduleName }: AccessRestrictedProps) {
  const { user } = useAuth();
  const userRole = user?.roles?.[0] || "UNASSIGNED";

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center select-none">
      {/* Precision Shield Icon */}
      <div className="w-16 h-16 rounded-[12px] bg-[#B56E48]/15 border border-[#B56E48]/35 flex items-center justify-center text-[#E09F67] mb-5 shadow-lg">
        <ShieldAlert className="w-8 h-8" />
      </div>

      {/* Status Pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#1A1512] border border-[#B56E48]/30 text-[#E09F67] text-xs font-mono mb-4 tracking-wider uppercase font-semibold">
        <Lock className="w-3.5 h-3.5" />
        <span>HTTP 403 · AUTHORIZATION RESTRICTED</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-[#F4F0E8] font-mono mb-2">
        Access Restricted: {moduleName || "Protected Module"}
      </h1>

      <p className="text-sm text-[#CBD5E1] max-w-lg mb-6 leading-relaxed font-sans">
        You are authenticated as{" "}
        <strong className="text-[#F4F0E8] font-mono">{user?.name || user?.email || "Current User"}</strong>{" "}
        with role{" "}
        <span className="font-mono text-[#2EB8B0] font-bold px-1.5 py-0.5 rounded bg-[#176C68]/20 border border-[#176C68]/40">
          [{userRole}]
        </span>
        . Your institutional role does not grant clearance for this resource
        {requiredRole ? (
          <>
            {" "}
            (authorized roles: <span className="font-mono text-[#E09F67] font-semibold">{requiredRole}</span>)
          </>
        ) : (
          "."
        )}
      </p>

      {/* Role Navigation Help */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/overview"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[6px] bg-[#176C68] hover:bg-[#1E827D] text-[#F4F0E8] font-semibold text-xs tracking-wide transition-all shadow-md font-mono"
        >
          <Home className="w-4 h-4" />
          <span>Return to Authorized Workspace</span>
        </Link>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[6px] bg-[#161B18] hover:bg-[#1D2320] border border-[rgba(244,240,232,0.12)] text-[#CBD5E1] font-semibold text-xs tracking-wide transition-all font-mono"
        >
          <KeyRound className="w-4 h-4 text-[#B56E48]" />
          <span>Switch Evaluator Persona</span>
        </Link>
      </div>

      <div className="mt-8 text-[11px] font-mono text-[#6F7772]">
        Security Policy: BhuSetu 3D Central RBAC · Karnataka Land Revenue Enforcement Act
      </div>
    </div>
  );
}
