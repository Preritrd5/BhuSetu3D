"use client";

import React from "react";
import {
  Globe2,
  MapPin,
  Building2,
  Layers,
  LayoutGrid,
  DoorOpen,
  Activity,
  X,
  Minimize2,
} from "lucide-react";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import { TrustSource, VerificationState } from "@/types/selection";
import { DataTrustIndicator } from "./DataTrustIndicator";

interface InspectorHeaderProps {
  entityType: SpatialLevel;
  title: string;
  subtitle?: string;
  code?: string;
  source: TrustSource;
  verificationState: VerificationState;
  confidence?: number | null;
  onClose: () => void;
  onMinimize?: () => void;
}

export const InspectorHeader: React.FC<InspectorHeaderProps> = ({
  entityType,
  title,
  subtitle,
  code,
  source,
  verificationState,
  confidence,
  onClose,
  onMinimize,
}) => {
  // Resolve icon per entity type
  const renderIcon = () => {
    switch (entityType) {
      case "CITY":
      case "REGION":
        return <Globe2 className="w-4 h-4 text-[#23847D]" />;
      case "PARCEL":
        return <MapPin className="w-4 h-4 text-[#23847D]" />;
      case "BUILDING":
        return <Building2 className="w-4 h-4 text-[#C47B50]" />;
      case "FLOOR":
        return <Layers className="w-4 h-4 text-[#C47B50]" />;
      case "UNIT":
        return <LayoutGrid className="w-4 h-4 text-[#F4F0E8]" />;
      case "ROOM":
      case "HALL":
        return <LayoutGrid className="w-4 h-4 text-[#D9D2C5]" />;
      case "CORRIDOR":
        return <LayoutGrid className="w-4 h-4 text-[#77867C]" />;
      case "DOOR":
        return <DoorOpen className="w-4 h-4 text-[#C47B50]" />;
      case "WINDOW":
        return <LayoutGrid className="w-4 h-4 text-[#77867C]" />;
      case "INFRASTRUCTURE":
        return <Activity className="w-4 h-4 text-[#23847D]" />;
      default:
        return <Building2 className="w-4 h-4 text-[#77867C]" />;
    }
  };

  // Resolve level pill styling
  const getLevelBadge = () => {
    switch (entityType) {
      case "CITY":
      case "REGION":
        return "bg-[#176C68]/15 text-[#23847D] border-[#176C68]/30";
      case "PARCEL":
        return "bg-[#176C68]/15 text-[#23847D] border-[#176C68]/30";
      case "BUILDING":
        return "bg-[#B56E48]/15 text-[#C47B50] border-[#B56E48]/30";
      case "FLOOR":
        return "bg-[#1A201D] text-[#D9D2C5] border-[rgba(244,240,232,0.12)]";
      case "UNIT":
        return "bg-[#1A201D] text-[#F4F0E8] border-[rgba(244,240,232,0.12)]";
      case "INFRASTRUCTURE":
        return "bg-[#176C68]/15 text-[#23847D] border-[#176C68]/30";
      default:
        return "bg-[#1A201D] text-[#77867C] border-[rgba(244,240,232,0.08)]";
    }
  };

  return (
    <div className="p-3.5 border-b border-[rgba(244,240,232,0.08)] bg-[#141816] flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.12)] flex items-center justify-center shrink-0 mt-0.5">
            {renderIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`px-2 py-0.5 rounded-[4px] border text-[9px] font-mono font-bold uppercase tracking-widest ${getLevelBadge()}`}
              >
                {entityType}
              </span>
              {code && (
                <span className="text-[10px] text-[#6F7772] font-mono truncate" title={code}>
                  {code}
                </span>
              )}
            </div>
            <h3
              className="font-bold text-[#F4F0E8] text-sm tracking-tight truncate leading-tight"
              title={title}
            >
              {title}
            </h3>
            {subtitle && (
              <span className="text-[11px] text-[#77867C] block truncate mt-0.5">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls: Minimize & Close */}
        <div className="flex items-center gap-1 shrink-0">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1.5 rounded-[5px] hover:bg-[#1A201D] text-[#6F7772] hover:text-[#F4F0E8] transition-colors cursor-pointer"
              title="Minimize Inspector"
              aria-label="Minimize Inspector"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-[5px] hover:bg-[#1A201D] text-[#6F7772] hover:text-[#F4F0E8] transition-colors cursor-pointer"
            title="Close Inspector"
            aria-label="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trust & Verification Status Chip Bar */}
      <DataTrustIndicator
        source={source}
        verificationState={verificationState}
        confidence={confidence}
        className="pt-1.5 border-t border-[rgba(244,240,232,0.06)]"
      />
    </div>
  );
};
