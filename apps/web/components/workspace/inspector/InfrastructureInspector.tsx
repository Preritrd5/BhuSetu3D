"use client";

import React from "react";
import { Activity, AlertTriangle, Compass, Ruler, ShieldCheck } from "lucide-react";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import { InspectorHeader } from "./InspectorHeader";
import { InspectorSection } from "./InspectorSection";
import { InspectorStat } from "./InspectorStat";
import { InspectorRelationship } from "./InspectorRelationship";
import { InspectorActionBar } from "./InspectorActionBar";

interface InfrastructureInspectorProps {
  selection: ActiveSpatialSelection;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  onFocusEntity?: (id: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
  onOpenAI?: () => void;
}

export const InfrastructureInspector: React.FC<InfrastructureInspectorProps> = ({
  selection,
  onSelectLevel,
  onFocusEntity,
  onClose,
  onMinimize,
  onOpenAI,
}) => {
  const meta = selection.metadata || {};
  const hasBufferConflict = meta.buffer_conflict;

  return (
    <>
      <InspectorHeader
        entityType="INFRASTRUCTURE"
        title={selection.title}
        subtitle={selection.subtitle}
        code={selection.entityId}
        source={selection.source}
        verificationState={selection.verificationState}
        confidence={selection.confidence}
        onClose={onClose}
        onMinimize={onMinimize}
      />

      <div className="overflow-y-auto flex-1 p-0 divide-y divide-[rgba(244,240,232,0.06)]">
        {/* Buffer Conflict Alert */}
        {hasBufferConflict && (
          <div className="p-3.5 bg-[#B56E48]/10 border-b border-[#B56E48]/25 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#C47B50] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-[#F4F0E8] block">
                Subsurface Buffer Intersection (-1.80m)
              </span>
              <span className="text-[#D9D2C5]/80 block mt-0.5">
                Mandatory 5.0m municipal drainage buffer infringed. Measured distance from SWD
                centerline to Aura Horizon foundation is 3.20m.
              </span>
            </div>
          </div>
        )}

        {/* Section 1: Utility Engineering Specs */}
        <InspectorSection title="Utility Specifications" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <InspectorStat
              label="Utility Type"
              value={meta.utility_category || "STORMWATER"}
              badge="POSTGIS"
              badgeType="authoritative"
              subtext="Subsurface Municipal Trunk"
            />
            <InspectorStat
              label="Invert Depth"
              value={`-${meta.depth_meters ?? 1.8}m`}
              unit="BGL"
              subtext="Below Ground Level"
            />
            <InspectorStat
              label="Mandated Buffer"
              value={`${meta.mandated_buffer_m ?? 5.0}m`}
              badge="STATUTORY"
              badgeType="authoritative"
              subtext="Municipal Exclusion Zone"
            />
            <InspectorStat
              label="Measured Clearance"
              value={`${meta.observed_buffer_m ?? 3.2}m`}
              badge={hasBufferConflict ? "-1.8m INFRINGEMENT" : "CLEAR"}
              badgeType={hasBufferConflict ? "warning" : "authoritative"}
              subtext="To Aura Horizon Foundation"
            />
          </div>
        </InspectorSection>

        {/* Section 2: Hierarchy Relationships */}
        <InspectorSection
          title="Spatial Hierarchy"
          icon={<Compass className="w-3.5 h-3.5 text-[#23847D]" />}
          defaultOpen={false}
        >
          <InspectorRelationship
            hierarchyPath={selection.hierarchyPath}
            currentLevel="INFRASTRUCTURE"
            onSelectLevel={onSelectLevel}
          />
        </InspectorSection>
      </div>

      <InspectorActionBar
        primaryAction={{
          label: "FOCUS UTILITY ALIGNMENT",
          icon: <Activity className="w-4 h-4" />,
          onClick: () => onFocusEntity?.(selection.entityId),
        }}
        onOpenAI={onOpenAI}
      />
    </>
  );
};
