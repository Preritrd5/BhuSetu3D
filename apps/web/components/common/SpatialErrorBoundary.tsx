"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  compact?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * SpatialErrorBoundary
 * Gracefully isolates component render failures (e.g., inspector, intelligence panels, tools)
 * without crashing the full Cesium 3D canvas or parent workspace shell.
 */
export class SpatialErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[SpatialErrorBoundary] Caught unhandled component error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.compact) {
        return (
          <div className="p-3 rounded-[14px] bg-slate-950/90 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="truncate">{this.props.fallbackTitle || "Component temporarily unavailable"}</span>
            </div>
            <button
              onClick={this.handleReset}
              className="px-2 py-1 rounded-[8px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-[10px] flex items-center gap-1 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        );
      }

      return (
        <div className="p-6 rounded-[24px] bg-slate-950/90 backdrop-blur-xl border border-amber-500/30 text-slate-200 shadow-2xl flex flex-col items-center text-center space-y-4 font-sans">
          <div className="w-12 h-12 rounded-[16px] bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_2px_12px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold font-mono text-slate-100">
              {this.props.fallbackTitle || "Spatial Module Unavailable"}
            </h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              {this.props.fallbackMessage ||
                "This spatial inspection component encountered a temporary state error. The 3D world remains operational."}
            </p>
          </div>

          <button
            onClick={this.handleReset}
            className="btn-secondary !px-4 !py-2 !text-xs !font-mono flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-primary" />
            <span>Reload Module</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
