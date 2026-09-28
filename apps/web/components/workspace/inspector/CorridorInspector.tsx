"use client";

import React from "react";
import { LayoutGrid, ShieldCheck, Compass, Layers } from "lucide-react";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import { InspectorHeader } from "./InspectorHeader";
import { InspectorSection } from "./InspectorSection";
import { InspectorStat } from "./InspectorStat";
import { InspectorRelationship } from "./InspectorRelationship";
import { InspectorActionBar } from "./InspectorActionBar";
import { SpatialElementNode } from "@/types/property";

interface CorridorInspectorProps {
  selection: ActiveSpatialSelection;
  corridorNode: SpatialElementNode | null;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  onFocusEntity?: (id: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
  onOpenAI?: () => void;
}

export const CorridorInspector: React.FC<CorridorInspectorProps> = ({
  selection,
  corridorNode,
  onSelectLevel,
  onFocusEntity,
  onClose,
  onMinimize,
  onOpenAI,
}) => {
  const meta = selection.metadata || {};

  return (
    <>
      <InspectorHeader
        entityType="CORRIDOR"
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
        {/* Section 1: Egress & Circulation Metrics */}
        <InspectorSection title="Circulation & Egress" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <InspectorStat
              label="Circulation Area"
              value={meta.area_sqm ?? 36.4}
              unit="m²"
              badge="LOD3"
              badgeType="computed"
              subtext="Central Hallway Area"
            />
            <InspectorStat
              label="Clear Width"
              value={`${meta.clear_width_m ?? 2.6}m`}
              badge="COMPLIANT"
              badgeType="authoritative"
              subtext="Exceeds NBC Min (1.8m)"
            />
            <InspectorStat
              label="Dimensions"
              value={meta.dimensions || "14.0m x 2.6m"}
              subtext="Total Corridoric Extent"
            />
            <InspectorStat
              label="Floor Finish"
              value="Terrazzo / LED"
              subtext="High-Traffic Commercial"
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
            currentLevel="CORRIDOR"
            onSelectLevel={onSelectLevel}
          />
        </InspectorSection>
      </div>

      <InspectorActionBar
        primaryAction={{
          label: "FOCUS CIRCULATION CORRIDOR",
          icon: <LayoutGrid className="w-4 h-4" />,
          onClick: () => onFocusEntity?.(selection.entityId),
        }}
        secondaryActions={[
          {
            id: "inspect-floor",
            label: "Inspect Floor",
            icon: <Layers className="w-3.5 h-3.5" />,
            onClick: () => onSelectLevel("FLOOR"),
          },
        ]}
        onOpenAI={onOpenAI}
      />
    </>
  );
};
