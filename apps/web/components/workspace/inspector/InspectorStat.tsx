"use client";

import React from "react";

interface InspectorStatProps {
  label: string;
  value: string | number;
  unit?: string;
  badge?: string;
  badgeType?: "authoritative" | "computed" | "warning" | "neutral";
  subtext?: string;
  className?: string;
}

export const InspectorStat: React.FC<InspectorStatProps> = ({
  label,
  value,
  unit,
  badge,
  badgeType = "neutral",
  subtext,
  className = "",
}) => {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case "authoritative":
        return "bg-[#176C68]/15 text-[#23847D] border-[#176C68]/30";
      case "computed":
        return "bg-[#1A201D] text-[#D9D2C5] border-[rgba(244,240,232,0.12)]";
      case "warning":
        return "bg-rose-950/30 text-rose-300 border-rose-800/40";
      default:
        return "bg-[#1A201D] text-[#77867C] border-[rgba(244,240,232,0.08)]";
    }
  };

  return (
    <div
      className={`p-3 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.16)] transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="text-xs text-[#94A3B8] font-mono uppercase tracking-wider block truncate font-medium">
          {label}
        </span>
        {badge && (
          <span
            className={`px-1.5 py-0.5 rounded-[4px] border text-xs font-mono font-bold shrink-0 ${getBadgeStyle()}`}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-base font-extrabold text-[#F4F0E8] font-mono tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs text-[#A7B3AB] font-mono">{unit}</span>}
      </div>

      {subtext && (
        <span className="text-xs text-[#94A3B8] font-mono block mt-1 leading-snug">
          {subtext}
        </span>
      )}
    </div>
  );
};
