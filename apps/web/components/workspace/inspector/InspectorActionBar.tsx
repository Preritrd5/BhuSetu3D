"use client";

import React from "react";
import { Sparkles, Eye } from "lucide-react";

interface InspectorActionBarProps {
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    active?: boolean;
  };
  secondaryActions?: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    tooltip?: string;
  }>;
  onOpenAI?: () => void;
  className?: string;
}

export const InspectorActionBar: React.FC<InspectorActionBarProps> = ({
  primaryAction,
  secondaryActions = [],
  onOpenAI,
  className = "",
}) => {
  return (
    <div className={`p-4 border-t border-[rgba(244,240,232,0.08)] bg-[#141816] flex flex-col gap-2.5 ${className}`}>
      {/* Primary Dominant Action */}
      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          className={`w-full py-3 px-4 rounded-[8px] text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
            primaryAction.active
              ? "bg-[#1A201D] text-[#C47B50] border border-[#B56E48]/50"
              : "bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] active:scale-[0.98]"
          }`}
        >
          {primaryAction.icon || <Eye className="w-4 h-4" />}
          <span>{primaryAction.label}</span>
        </button>
      )}

      {/* Secondary Working Action Buttons */}
      {(secondaryActions.length > 0 || onOpenAI) && (
        <div className="grid grid-cols-2 gap-2">
          {secondaryActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`py-2.5 px-3 rounded-[8px] text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 border cursor-pointer min-w-0 ${
                action.active
                  ? "bg-[#1A201D] text-[#C47B50] border-[#B56E48]/50"
                  : "bg-[#1A201D] hover:bg-[#222A26] text-[#F4F0E8] border-[rgba(244,240,232,0.12)] hover:border-[#B56E48]/40"
              } ${action.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              title={action.tooltip || action.label}
            >
              {action.icon}
              <span className="truncate">{action.label}</span>
            </button>
          ))}

          {onOpenAI && (
            <button
              onClick={onOpenAI}
              className={`py-2.5 px-3 rounded-[8px] text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 bg-[#1A201D] hover:bg-[#222A26] text-[#F4F0E8] border border-[rgba(244,240,232,0.12)] hover:border-[#B56E48]/50 cursor-pointer shadow-sm min-w-0 ${
                secondaryActions.length % 2 === 0 ? "col-span-2" : ""
              }`}
              title="Query AI Spatial Investigator about this entity"
            >
              <Sparkles className="w-4 h-4 text-[#C47B50]" />
              <span>Ask BhuSetu</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
