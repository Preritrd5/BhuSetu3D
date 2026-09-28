"use client";

/**
 * BhuSetu 3D 403 Access Restricted Component
 */
import React from "react";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface AccessRestrictedProps {
  requiredRole?: string;
}

export function AccessRestricted({ requiredRole }: AccessRestrictedProps) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-950/40 border border-amber-500/30 text-amber-400 text-xs font-mono mb-4">
        <span>HTTP 403 · FORBIDDEN</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-[#F4F0E8] font-sans mb-2">
        Access Restricted
      </h1>

      <p className="text-sm text-[#77867C] max-w-md mb-6 leading-relaxed font-sans">
        You are authenticated as{" "}
        <strong className="text-[#F4F0E8] font-mono">{user?.name || user?.email}</strong>{" "}
        with role{" "}
        <span className="font-mono text-[#23847D] font-semibold">
          [{user?.roles.join(", ") || "UNASSIGNED"}]
        </span>
        , but your current authorization level does not permit access to this module
        {requiredRole ? ` (requires '${requiredRole}')` : ""}.
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#B56E48] hover:bg-[#A35E39] text-[#F4F0E8] font-semibold text-xs tracking-wide transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return to Overview</span>
        </Link>
      </div>
    </div>
  );
}
