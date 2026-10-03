/**
 * MobileBottomNav — Dedicated touch-friendly bottom navigation for mobile viewports.
 *
 * Implements the 4-tab primary hierarchy specified in Section 32:
 *   [ Inspect ]   [ Layers ]   [ Measure ]   [ More ]
 *
 * Width: 100% of usable viewport with equal distribution (25% each).
 * Touch targets: minimum 56px height, comfortable tap areas.
 * Safe area: respects env(safe-area-inset-bottom).
 * Gestures: touch propagation stopped so taps do not orbit Cesium map.
 */
"use client";

import React, { useState } from "react";
import {
  ScanSearch,
  Layers,
  Ruler,
  MoreHorizontal,
  Sparkles,
  GitCompare,
  Clock,
  Map,
  RotateCcw,
  X,
} from "lucide-react";
import { SpatialToolType } from "@/types/tools";

interface MobileBottomNavProps {
  activeTool: SpatialToolType;
  onSelectTool: (tool: SpatialToolType) => void;
  isLeftPanelOpen: boolean;
  onToggleLayers: () => void;
  isInspectorOpen?: boolean;
  onToggleInspector?: () => void;
  onOpenAI: () => void;
  onNavigate2D: () => void;
  onResetCamera: () => void;
  onOpenTimeline: () => void;
  onOpenCompare: () => void;
}

type NavTab = "INSPECT" | "LAYERS" | "MEASURE" | "MORE";

export function MobileBottomNav({
  activeTool,
  onSelectTool,
  isLeftPanelOpen,
  onToggleLayers,
  isInspectorOpen = false,
  onToggleInspector,
  onOpenAI,
  onNavigate2D,
  onResetCamera,
  onOpenTimeline,
  onOpenCompare,
}: MobileBottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const handleTab = (tab: NavTab) => {
    setMoreOpen(false);

    switch (tab) {
      case "INSPECT":
        if (onToggleInspector) {
          onToggleInspector();
        } else {
          onSelectTool("SELECT");
        }
        break;
      case "LAYERS":
        onToggleLayers();
        break;
      case "MEASURE":
        onSelectTool(activeTool === "MEASURE" ? "SELECT" : "MEASURE");
        break;
      case "MORE":
        setMoreOpen((prev) => !prev);
        break;
    }
  };

  const isMeasureActive = activeTool === "MEASURE";

  const TABS: { id: NavTab; icon: React.ReactNode; label: string; isActive: boolean }[] = [
    {
      id: "INSPECT",
      icon: <ScanSearch className="w-5 h-5" />,
      label: "Inspect",
      isActive: isInspectorOpen && activeTool !== "MEASURE",
    },
    {
      id: "LAYERS",
      icon: <Layers className="w-5 h-5" />,
      label: "Layers",
      isActive: isLeftPanelOpen,
    },
    {
      id: "MEASURE",
      icon: <Ruler className="w-5 h-5" />,
      label: "Measure",
      isActive: isMeasureActive,
    },
    {
      id: "MORE",
      icon: <MoreHorizontal className="w-5 h-5" />,
      label: "More",
      isActive: moreOpen,
    },
  ];

  return (
    <>
      {/* ── More menu sheet (slides up above bottom nav) ────────────────── */}
      {moreOpen && (
        <>
          {/* Scrim */}
          <div
            className="fixed inset-0 z-[48] bg-black/50 backdrop-blur-xs"
            onClick={() => setMoreOpen(false)}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-[56px] inset-x-0 z-[49] bg-[#141816]/98 backdrop-blur-md border-t border-[rgba(244,240,232,0.12)] rounded-t-[14px] shadow-2xl animate-in slide-in-from-bottom-2"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(244,240,232,0.08)]">
              <span className="text-xs font-mono font-bold text-[#A2B3A8] uppercase tracking-wider">
                Secondary Spatial Tools
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-[6px] hover:bg-[#1A201D] text-[#A2B3A8] cursor-pointer"
                aria-label="Close tools menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-0">
              {[
                {
                  icon: <Sparkles className="w-5 h-5" />,
                  label: "Ask BhuSetu",
                  color: "text-[#2EB8B0]",
                  onClick: () => { setMoreOpen(false); onOpenAI(); },
                },
                {
                  icon: <GitCompare className="w-5 h-5" />,
                  label: "Compare",
                  color: "text-[#C47B50]",
                  onClick: () => { setMoreOpen(false); onOpenCompare(); },
                },
                {
                  icon: <Clock className="w-5 h-5" />,
                  label: "4D Timeline",
                  color: "text-[#A2B3A8]",
                  onClick: () => { setMoreOpen(false); onOpenTimeline(); },
                },
                {
                  icon: <Map className="w-5 h-5" />,
                  label: "2D Cadastre",
                  color: "text-[#A2B3A8]",
                  onClick: () => { setMoreOpen(false); onNavigate2D(); },
                },
                {
                  icon: <RotateCcw className="w-5 h-5" />,
                  label: "Reset Camera",
                  color: "text-[#A2B3A8]",
                  onClick: () => { setMoreOpen(false); onResetCamera(); },
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center gap-1.5 py-4 hover:bg-[#1A201D] active:bg-[#1A201D] transition-all cursor-pointer border-b border-[rgba(244,240,232,0.05)]"
                >
                  <span className={item.color}>{item.icon}</span>
                  <span className="text-[11px] font-sans font-medium text-[#A2B3A8] text-center leading-tight px-1">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Safe area spacer */}
            <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
          </div>
        </>
      )}

      {/* ── Primary Bottom Navigation Bar (4-tab layout, 100% width) ───── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 bg-[#0F1210]/98 backdrop-blur-md border-t border-[rgba(244,240,232,0.10)] flex items-stretch select-none"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-all cursor-pointer ${
              tab.isActive ? "text-[#C47B50]" : "text-[#6F7772] hover:text-[#A2B3A8]"
            }`}
            aria-label={tab.label}
          >
            {tab.icon}
            <span className="text-[11px] font-sans font-medium leading-none">{tab.label}</span>
            {tab.isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#C47B50] -mt-0.5" />
            )}
          </button>
        ))}
      </nav>
    </>
  );
}
