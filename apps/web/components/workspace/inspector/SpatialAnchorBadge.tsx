"use client";

import React from "react";
import { Building2, MapPin, Layers, LayoutGrid, DoorOpen, Eye, X } from "lucide-react";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";

interface SpatialAnchorBadgeProps {
  selection: ActiveSpatialSelection;
  isMinimized: boolean;
  onRestoreInspector: () => void;
  onClearSelection?: () => void;
  className?: string;
}

export const SpatialAnchorBadge: React.FC<SpatialAnchorBadgeProps> = ({
  selection,
  isMinimized,
  onRestoreInspector,
  onClearSelection,
  className = "",
}) => {
  // At City level, no specific entity is selected to restore inspector for
  if (selection.entityType === "CITY") return null;

  const renderIcon = (level: SpatialLevel) => {
    switch (level) {
      case "PARCEL":
        return <MapPin className="w-3.5 h-3.5 text-[#23847D]" />;
      case "BUILDING":
        return <Building2 className="w-3.5 h-3.5 text-[#C47B50]" />;
      case "FLOOR":
        return <Layers className="w-3.5 h-3.5 text-[#23847D]" />;
      case "UNIT":
        return <LayoutGrid className="w-3.5 h-3.5 text-[#C47B50]" />;
      default:
        return <DoorOpen className="w-3.5 h-3.5 text-[#23847D]" />;
    }
  };

  return (
    <div
      className={`fixed z-20 pointer-events-auto select-none transition-all duration-200 animate-in fade-in slide-in-from-right-4 max-w-[calc(100vw-120px)] ${className}`}
      style={{ top: "64px", right: "16px" }}
    >

      <div className="flex items-center gap-1.5 p-1.5 pl-3 rounded-[8px] bg-[#141816]/98 backdrop-blur-md border border-[rgba(244,240,232,0.12)] shadow-xl text-xs font-mono">
        <div className="flex items-center gap-2">
          {renderIcon(selection.entityType)}
          <span className="text-[11px] font-bold text-[#A7B3AB] uppercase tracking-wider">
            {selection.entityType}
          </span>
          <span className="text-[#6F7772]/40">•</span>
          <span className="text-[#F4F0E8] font-medium max-w-[180px] truncate" title={selection.title}>
            {selection.title}
          </span>
        </div>

        <button
          onClick={onRestoreInspector}
          className="ml-2 px-2.5 py-1 rounded-[4px] bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
          title="Open Contextual Inspector"
        >
          <Eye className="w-3 h-3" />
          <span>Inspect</span>
        </button>

        {onClearSelection && (
          <button
            onClick={onClearSelection}
            className="p-1 rounded-[4px] hover:bg-[#1A201D] text-[#6F7772] hover:text-[#F4F0E8] transition-colors cursor-pointer"
            title="Deselect object"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
