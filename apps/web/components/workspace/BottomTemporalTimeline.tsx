"use client";

import React from "react";
import { History, X } from "lucide-react";

interface BottomTemporalTimelineProps {
  selectedYear: number;
  onSelectYear: (year: number) => void;
  onClose: () => void;
}

export const BottomTemporalTimeline: React.FC<BottomTemporalTimelineProps> = ({
  selectedYear,
  onSelectYear,
  onClose,
}) => {
  const EPOCHS = [
    {
      year: 2024,
      label: "Baseline Cadastre (2024)",
      desc: "Sanctioned baseline: 3 Floors, 11.50m height, 420 m² footprint.",
      badge: "APPROVED BASELINE",
      badgeColor: "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/30",
      progress: "15%",
    },
    {
      year: 2025,
      label: "Interim Observation (2025)",
      desc: "Framework expansion and slab casting underway.",
      badge: "IN PROGRESS",
      badgeColor: "bg-[#1A201D] text-[#77867C] border-[rgba(244,240,232,0.12)]",
      progress: "50%",
    },
    {
      year: 2026,
      label: "Current Digital Twin (2026)",
      desc: "4 Floors detected (+1 unapproved level), 14.50m height, +60m² footprint diff.",
      badge: "DISCREPANCY ACTIVE",
      badgeColor: "bg-[#B56E48]/20 text-[#C47B50] border-[#B56E48]/30",
      progress: "100%",
    },
  ];

  const selectedEpoch = EPOCHS.find((e) => e.year === selectedYear) || EPOCHS[2];

  return (
    <div className="absolute bottom-20 inset-x-0 z-20 flex justify-center pointer-events-none select-none animate-in fade-in slide-in-from-bottom duration-200 px-4">
      <div className="pointer-events-auto w-full max-w-2xl bg-[#0F1210]/95 backdrop-blur-sm border border-[rgba(244,240,232,0.10)] p-3.5 rounded-[10px] shadow-lg font-mono text-xs space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[#C47B50] font-bold">
            <History className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest text-[#F4F0E8]">
              4D Temporal Evolution
            </span>
            <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider font-semibold">
              Multi-Epoch Detection
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close 4D Timeline"
            className="p-1.5 rounded-[5px] hover:bg-[#1A201D] text-[#8C988F] hover:text-[#F4F0E8] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Epoch Selector Buttons */}
        <div className="grid grid-cols-3 gap-2.5">
          {EPOCHS.map((epoch) => {
            const isSelected = selectedYear === epoch.year;
            return (
              <button
                key={epoch.year}
                onClick={() => onSelectYear(epoch.year)}
                className={`p-3 rounded-[8px] border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#1A201D] border-[#B56E48]/50 shadow-sm"
                    : "bg-[#141816] border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.18)] hover:bg-[#1A201D]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-base font-bold ${
                      isSelected ? "text-[#C47B50]" : "text-[#D9D2C5]"
                    }`}
                  >
                    {epoch.year}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-[4px] border ${epoch.badgeColor}`}>
                    {epoch.badge}
                  </span>
                </div>
                <div className="text-xs font-mono leading-relaxed line-clamp-2" style={{ color: isSelected ? "#D9D2C5" : "#8C988F" }}>
                  {epoch.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Temporal Progress Bar */}
        <div className="relative pt-0.5 px-0.5">
          <div className="h-1.5 w-full bg-[#1A201D] rounded-full overflow-hidden border border-[rgba(244,240,232,0.08)]">
            <div
              className="h-full bg-[#B56E48] transition-all duration-500 rounded-full"
              style={{ width: selectedEpoch.progress }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-[#94A3B8] mt-2 font-medium">
            <span>2024 · Photogrammetry</span>
            <span>2025 · Interim Pass</span>
            <span>2026 · Drone LiDAR</span>
          </div>
        </div>
      </div>
    </div>
  );
};
