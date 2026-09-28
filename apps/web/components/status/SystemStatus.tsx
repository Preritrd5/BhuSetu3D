"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Server,
  Database,
  Layers,
  Monitor
} from "lucide-react";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { ConnectionStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  label: string;
  status: ConnectionStatus;
  subtext?: string | null;
  detail?: string | null;
  icon: React.ElementType;
}

function StatusCard({ label, status, subtext, detail, icon: Icon }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "connected":
        return {
          bg: "bg-emerald-950/20 border-emerald-500/30 text-emerald-400",
          badgeBg: "bg-emerald-900/40 text-emerald-400 border-emerald-500/40",
          icon: CheckCircle2,
          text: "CONNECTED",
        };
      case "loading":
        return {
          bg: "bg-cyan-950/20 border-cyan-500/30 text-cyan-400",
          badgeBg: "bg-cyan-900/40 text-cyan-400 border-cyan-500/40",
          icon: Loader2,
          text: "PROBING...",
        };
      case "unavailable":
        return {
          bg: "bg-amber-950/20 border-amber-500/30 text-amber-400",
          badgeBg: "bg-amber-900/40 text-amber-400 border-amber-500/40",
          icon: AlertCircle,
          text: "UNAVAILABLE",
        };
      case "error":
      default:
        return {
          bg: "bg-rose-950/20 border-rose-500/30 text-rose-400",
          badgeBg: "bg-rose-900/40 text-rose-400 border-rose-500/40",
          icon: XCircle,
          text: "ERROR",
        };
    }
  };

  const style = getStatusStyles();
  const StatusIcon = style.icon;

  return (
    <div className={cn("p-4 rounded-lg border flex flex-col justify-between transition-all", style.bg)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-surface border border-border-subtle text-slate-200">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wide font-mono">
              {label}
            </div>
            {subtext && (
              <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                {subtext}
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border font-semibold",
            style.badgeBg
          )}
        >
          <StatusIcon className={cn("w-3 h-3", status === "loading" && "animate-spin")} />
          <span>{style.text}</span>
        </div>
      </div>

      {detail && (
        <div className="mt-3 pt-2 border-t border-border-subtle/50 text-[10px] font-mono text-slate-400 truncate">
          {detail}
        </div>
      )}
    </div>
  );
}

export function SystemStatus() {
  const { data, isLoading, error, refetch } = useSystemHealth();

  // Compute real statuses derived from backend telemetry
  const frontendStatus: ConnectionStatus = "connected";

  let backendStatus: ConnectionStatus = "loading";
  let databaseStatus: ConnectionStatus = "loading";
  let postgisStatus: ConnectionStatus = "loading";

  if (isLoading && !data) {
    backendStatus = "loading";
    databaseStatus = "loading";
    postgisStatus = "loading";
  } else if (error && !data) {
    backendStatus = "unavailable";
    databaseStatus = "unavailable";
    postgisStatus = "unavailable";
  } else if (data) {
    backendStatus = data.api_status === "error" ? "error" : "connected";
    databaseStatus = data.database.connected ? "connected" : "unavailable";
    postgisStatus = data.database.postgis_enabled ? "connected" : "unavailable";
  }

  return (
    <div className="space-y-4">
      {/* Header and Refresh Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide font-mono flex items-center gap-2">
            <span>System Telemetry & Health Probe</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time health verified through live FastAPI probes against PostGIS.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface border border-border-subtle hover:bg-surface-elevated text-xs font-mono text-slate-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 text-cyan-400", isLoading && "animate-spin")} />
          <span>Probe Now</span>
        </button>
      </div>

      {/* Grid of 4 Core Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Frontend */}
        <StatusCard
          label="Frontend"
          status={frontendStatus}
          subtext="Next.js 14 App Router"
          detail="HTTP 200 · Web Client Active"
          icon={Monitor}
        />

        {/* 2. Backend */}
        <StatusCard
          label="Backend API"
          status={backendStatus}
          subtext={data ? `${data.service} v${data.version}` : "FastAPI / Uvicorn"}
          detail={data ? `Env: ${data.environment} · /api/v1/health` : error || "Probing /api/v1/health..."}
          icon={Server}
        />

        {/* 3. Database */}
        <StatusCard
          label="Database"
          status={databaseStatus}
          subtext={data?.database?.database_version || data?.database?.database_type || "PostgreSQL 16"}
          detail={
            data?.database?.connected
              ? "Connection Pool Verified"
              : data?.database?.error || (error ? "Backend offline" : "Database probe failed")
          }
          icon={Database}
        />

        {/* 4. PostGIS */}
        <StatusCard
          label="PostGIS Engine"
          status={postgisStatus}
          subtext={
            data?.database?.postgis_enabled
              ? `Version ${data.database.postgis_version || "3.4"}`
              : "Spatial Extension"
          }
          detail={
            data?.database?.postgis_enabled
              ? "Spatial GIST & Polyhedra Enabled"
              : "Extension not activated on target database"
          }
          icon={Layers}
        />
      </div>

      {/* Connection Guidance Card (if database or backend is not connected) */}
      {(!data || !data.database.connected) && (
        <div className="p-3.5 rounded bg-surface border border-amber-500/20 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-semibold font-mono text-[11px]">
            <AlertCircle className="w-4 h-4" />
            <span>REAL-TIME SYSTEM DIAGNOSTIC</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            The frontend successfully communicates with this status panel. To connect PostgreSQL + PostGIS, ensure your database is running and configured in <code className="text-cyan-400 bg-canvas px-1 py-0.5 rounded font-mono">.env</code> via <code className="text-cyan-400 bg-canvas px-1 py-0.5 rounded font-mono">DATABASE_URL</code> (e.g. via Docker Compose <code className="text-slate-200">docker compose up -d</code> or Supabase).
          </p>
        </div>
      )}
    </div>
  );
}
