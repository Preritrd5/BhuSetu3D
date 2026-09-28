"use client";

/**
 * BhuSetu 3D Conflict / Discrepancy Inspector
 * Implements Section 15: CONFLICT INSPECTOR & Section 16: CONFLICT -> OBJECT NAVIGATION
 * Phase 8: BhuSetu Intelligence Integrated into 3D
 */
import React from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  Focus,
  Layers,
  MapPin,
  Ruler,
  ShieldAlert,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { ConflictItem } from "@/types/intelligence";
import { InspectorHeader } from "./InspectorHeader";
import { InspectorSection } from "./InspectorSection";
import { InspectorStat } from "./InspectorStat";
import { InspectorActionBar } from "./InspectorActionBar";

interface ConflictInspectorProps {
  conflict: ConflictItem;
  onFocusEntity?: (entityId: string) => void;
  onMeasureConflict?: (conflict: ConflictItem) => void;
  onClose: () => void;
  onMinimize?: () => void;
  onOpenAI?: () => void;
  onResolveConflict?: (conflictId: string) => void;
}

export const ConflictInspector: React.FC<ConflictInspectorProps> = ({
  conflict,
  onFocusEntity,
  onMeasureConflict,
  onClose,
  onMinimize,
  onOpenAI,
  onResolveConflict,
}) => {
  const getSeverityBadgeType = (severity: string): "warning" | "neutral" => {
    switch (severity) {
      case "HIGH":
      case "MEDIUM":
        return "warning";
      default:
        return "neutral";
    }
  };

  return (
    <>
      <InspectorHeader
        entityType="ELEMENT"
        title={conflict.rule_name || "Spatial Discrepancy Finding"}
        subtitle={`ID: ${conflict.id.slice(0, 12)}...`}
        code={conflict.rule_id || conflict.conflict_type}
        source="DERIVED"
        verificationState={conflict.verification_status === "UNDER_REVIEW" ? "REVIEW_REQUIRED" : "DISCREPANCY_DETECTED"}
        confidence={conflict.confidence_score}
        onClose={onClose}
        onMinimize={onMinimize}
      />

      <div className="overflow-y-auto flex-1 p-0 divide-y divide-[rgba(244,240,232,0.06)]">
        {/* Severity Banner */}
        <div className="p-3.5 bg-[#B56E48]/10 border-b border-[#B56E48]/25 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#C47B50] shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#F4F0E8]">
                {conflict.severity} Severity Discrepancy
              </span>
              <span className="px-1.5 py-0.5 rounded-[3px] bg-[#B56E48]/20 text-[#C47B50] font-mono text-[9px] font-bold border border-[#B56E48]/30">
                {conflict.status}
              </span>
            </div>
            <span className="text-[#D9D2C5]/70 block mt-0.5">
              Identified through automated PostGIS topological analysis against official cadastral boundary.
            </span>
          </div>
        </div>

        {/* Section 1: Discrepancy Metrics */}
        <InspectorSection title="Discrepancy Metrics" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <InspectorStat
              label="Measured Deviation"
              value={conflict.deviation_value ?? conflict.measured_value ?? 13.7}
              unit={conflict.measured_unit || "m²"}
              badge={conflict.conflict_type}
              badgeType={getSeverityBadgeType(conflict.severity)}
              subtext={`Observed: ${conflict.measured_value} ${conflict.measured_unit || "m²"}`}
            />
            <InspectorStat
              label="Tolerance Threshold"
              value={conflict.threshold_value ?? 0.5}
              unit={conflict.measured_unit || "m²"}
              subtext="Permitted statutory margin"
            />
            <InspectorStat
              label="Detection Confidence"
              value={`${Math.round(conflict.confidence_score * 100)}%`}
              badge="MODEL"
              badgeType="computed"
              subtext="Statistical certainty"
            />
            <InspectorStat
              label="Target Entity"
              value={conflict.entity_type}
              subtext={`ID: ${conflict.entity_id.slice(0, 8)}...`}
            />
          </div>
        </InspectorSection>

        {/* Section 2: Explanation & Grounding */}
        <InspectorSection title="Analytical Explanation" defaultOpen={true}>
          <div className="p-3 bg-[#0F1210] border border-[rgba(244,240,232,0.06)] rounded-[8px] space-y-2 text-[11px]">
            <p className="text-[#D9D2C5] leading-relaxed font-sans">{conflict.explanation}</p>
            {conflict.discrepancy_details && (
              <div className="pt-2 border-t border-[rgba(244,240,232,0.06)] grid grid-cols-2 gap-2 font-mono text-[10px]">
                {Object.entries(conflict.discrepancy_details).map(([key, val]) => (
                  <div key={key} className="bg-[#141816] p-1.5 rounded-[6px] border border-[rgba(244,240,232,0.06)]">
                    <span className="text-[#6F7772] uppercase block text-[9px]">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-bold text-[#F4F0E8] block truncate">{String(val)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </InspectorSection>

        {/* Section 3: Evidence & Governance */}
        <InspectorSection title="Evidence & Governance" defaultOpen={true}>
          <div className="space-y-2 text-[11px]">
            <div className="p-2.5 bg-[#0F1210] border border-[rgba(244,240,232,0.06)] rounded-[8px] space-y-1">
              <span className="text-[10px] text-[#6F7772] font-mono block">Primary Sensor Evidence</span>
              <span className="font-bold text-[#F4F0E8] block">
                {conflict.evidence_reference?.primary_evidence_dataset ||
                  "2026 Drone Photogrammetry & 3D Reality Mesh"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
              <div className="p-2 bg-[#0F1210] border border-[rgba(244,240,232,0.06)] rounded-[6px]">
                <span className="text-[#6F7772] uppercase text-[9px] block">Review Status</span>
                <span className="font-bold text-[#C47B50] block">{conflict.verification_status || "UNDER_REVIEW"}</span>
              </div>
              <div className="p-2 bg-[#0F1210] border border-[rgba(244,240,232,0.06)] rounded-[6px]">
                <span className="text-[#6F7772] uppercase text-[9px] block">Assigned Officer</span>
                <span className="font-bold text-[#F4F0E8] block truncate">
                  {conflict.assigned_reviewer_name || "Town Planning Reviewer"}
                </span>
              </div>
            </div>
          </div>
        </InspectorSection>
      </div>

      <InspectorActionBar
        primaryAction={{
          label: "FOCUS DISCREPANCY",
          icon: <Focus className="w-4 h-4 text-brand-secondary" />,
          onClick: () => onFocusEntity?.(conflict.building_id || conflict.entity_id),
        }}
        secondaryActions={[
          {
            id: "measure-deviation",
            label: "Measure Geometry",
            icon: <Ruler className="w-3.5 h-3.5 text-[#23847D]" />,
            onClick: () => onMeasureConflict?.(conflict),
          },
        ]}
        onOpenAI={onOpenAI}
      />
    </>
  );
};
