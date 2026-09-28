"use client";

import React from "react";
import { Globe2, MapPin, Building2, Layers, LayoutGrid, DoorOpen } from "lucide-react";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import { HierarchyPathNode } from "@/types/selection";

interface InspectorRelationshipProps {
  hierarchyPath: HierarchyPathNode[];
  currentLevel: SpatialLevel;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  className?: string;
}

export const InspectorRelationship: React.FC<InspectorRelationshipProps> = ({
  hierarchyPath,
  currentLevel,
  onSelectLevel,
  className = "",
}) => {
  if (!hierarchyPath.length) {
    return (
      <div className="p-3 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)] text-[11px] text-[#6F7772] font-mono">
        Relationship unavailable
      </div>
    );
  }

  const renderIcon = (level: SpatialLevel) => {
    switch (level) {
      case "CITY":
      case "REGION":
        return <Globe2 className="w-3.5 h-3.5 text-[#23847D]" />;
      case "PARCEL":
        return <MapPin className="w-3.5 h-3.5 text-[#23847D]" />;
      case "BUILDING":
        return <Building2 className="w-3.5 h-3.5 text-[#C47B50]" />;
      case "FLOOR":
        return <Layers className="w-3.5 h-3.5 text-[#D9D2C5]" />;
      case "UNIT":
        return <LayoutGrid className="w-3.5 h-3.5 text-[#F4F0E8]" />;
      default:
        return <DoorOpen className="w-3.5 h-3.5 text-[#77867C]" />;
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex flex-col gap-1">
        {hierarchyPath.map((node, index) => {
          const isCurrent = node.level === currentLevel;

          return (
            <div key={`${node.level}-${node.id}-${index}`} className="flex items-center gap-1.5">
              <button
                onClick={() => onSelectLevel(node.level, node.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] w-full text-left transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-[#1A201D] text-[#F4F0E8] font-bold border border-[#B56E48]/30"
                    : "hover:bg-[#1A201D] text-[#77867C] hover:text-[#D9D2C5] border border-transparent"
                }`}
                title={`Focus ${node.level}: ${node.name}`}
              >
                <div className="shrink-0">{renderIcon(node.level)}</div>
                <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                  <span className="text-[11px] font-mono truncate">{node.name}</span>
                  <span className="text-[9px] font-mono text-[#6F7772] uppercase shrink-0">
                    {node.level}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
