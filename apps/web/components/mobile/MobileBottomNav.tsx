/**
 * MobileBottomNav — Compact touch-friendly bottom navigation for mobile/tablet.
 *
 * Replaces the dense desktop BottomSpatialToolStrip on small viewports.
 * Primary tabs: Inspect | Layers | Measure | Search | More
 *
 * "More" opens a slide-up menu containing secondary actions:
 *   Compare, 4D Timeline, 2D Cadastre, AI Ask BhuSetu, Camera Reset.
 */
"use client";

import React, { useState } from "react";
import {
  ScanSearch,
  Layers,
  Ruler,
  Search,
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
  onOpenAI: () => void;
  onNavigate2D: () => void;
  onResetCamera: () => void;
  onOpenTimeline: () => void;
  onOpenCompare: () => void;
}

type NavTab = "INSPECT" | "LAYERS" | "MEASURE" | "SEARCH" | "MORE";

export function MobileBottomNav({
  activeTool,
  onSelectTool,
  isLeftPanelOpen,
  onToggleLayers,
  onOpenAI,
  onNavigate2D,
  onResetCamera,
  onOpenTimeline,
  onOpenCompare,
}: MobileBottomNavProps) {
  const [activeTab, setActiveTab] = useState<NavTab>("INSPECT");
  const [moreOpen, setMoreOpen] = useState(false);

  const handleTab = (tab: NavTab) => {
    setMoreOpen(false);
    setActiveTab(tab);

    switch (tab) {
      case "INSPECT":
        onSelectTool("SELECT");
        break;
      case "LAYERS":
        onToggleLayers();
        break;
      case "MEASURE":
        onSelectTool(activeTool === "MEASURE" ? "SELECT" : "MEASURE");
        break;
      case "SEARCH":
        // Search is handled by the WorkspaceTopBar search; just ensure tool is SELECT
        onSelectTool("SELECT");
        break;
      case "MORE":
        setMoreOpen((prev) => !prev);
        return; // Don't change activeTab here
    }
  };

  const TABS: { id: NavTab; icon: React.ReactNode; label: string }[] = [
    { id: "INSPECT", icon: <ScanSearch className="w-5 h-5" />, label: "Inspect" },
    { id: "LAYERS", icon: <Layers className="w-5 h-5" />, label: "Layers" },
    { id: "MEASURE", icon: <Ruler className="w-5 h-5" />, label: "Measure" },
    { id: "SEARCH", icon: <Search className="w-5 h-5" />, label: "Search" },
    { id: "MORE", icon: <MoreHorizontal className="w-5 h-5" />, label: "More" },
  ];

  // Derive Inspect active state from tool
  const isInspectActive = activeTool === "SELECT" && activeTab === "INSPECT";
  const isMeasureActive = activeTool === "MEASURE";

  return (
    <>
      {/* ── More menu (slides up from bottom nav) ───────────────────────── */}
      {moreOpen && (
        <>
          {/* Scrim */}
          <div
            className="fixed inset-0 z-[38] bg-black/30"
            onClick={() => setMoreOpen(false)}
          />
          {/* Sheet */}
          <div className="fixed bottom-[57px] inset-x-0 z-[39] bg-[#141816]/98 backdrop-blur-md border-t border-[rgba(244,240,232,0.12)] rounded-t-[14px] shadow-2xl animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(244,240,232,0.07)]">
              <span className="text-xs font-mono font-bold text-[#A2B3A8] uppercase tracking-wider">
                More Tools
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-[6px] hover:bg-[#1A201D] text-[#A2B3A8] cursor-pointer"
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
                  className="flex flex-col items-center justify-center gap-1.5 py-4 hover:bg-[#1A201D] transition-all cursor-pointer border-b border-[rgba(244,240,232,0.05)]"
                >
                  <span className={item.color}>{item.icon}</span>
                  <span className="text-[11px] font-sans font-medium text-[#A2B3A8] text-center leading-tight px-1">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Safe area spacer */}
            <div className="h-safe-area-inset-bottom" />
          </div>
        </>
      )}

      {/* ── Bottom Navigation Bar ────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-[#0F1210]/98 backdrop-blur-md border-t border-[rgba(244,240,232,0.10)] flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {TABS.map((tab) => {
          const isActive =
            tab.id === "MORE"
              ? moreOpen
              : tab.id === "MEASURE"
              ? isMeasureActive
              : tab.id === "LAYERS"
              ? isLeftPanelOpen
              : activeTab === tab.id && !moreOpen;

          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] transition-all cursor-pointer ${
                isActive ? "text-[#C47B50]" : "text-[#6F7772] hover:text-[#A2B3A8]"
              }`}
              aria-label={tab.label}
            >
              {tab.icon}
              <span className="text-[10px] font-sans font-medium leading-none">{tab.label}</span>
              {/* Active indicator dot */}
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#C47B50] -mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
