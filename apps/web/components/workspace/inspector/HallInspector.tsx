"use client";

import React from "react";
import { LayoutGrid, Users, Compass } from "lucide-react";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import { InspectorHeader } from "./InspectorHeader";
import { InspectorSection } from "./InspectorSection";
import { InspectorStat } from "./InspectorStat";
import { InspectorRelationship } from "./InspectorRelationship";
import { InspectorActionBar } from "./InspectorActionBar";
import { SpatialElementNode } from "@/types/property";

interface HallInspectorProps {
  selection: ActiveSpatialSelection;
  hallNode: SpatialElementNode | null;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  onFocusEntity?: (id: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
  onOpenAI?: () => void;
}

export const HallInspector: React.FC<HallInspectorProps> = ({
  selection,
  hallNode,
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
        entityType="HALL"
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
        {/* Section 1: Assembly Hall Metrics */}
        <InspectorSection title="Assembly Space Metrics" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <InspectorStat
              label="Computed Area"
              value={meta.area_sqm ?? 32.5}
              unit="m²"
              badge="LOD3"
              badgeType="computed"
              subtext="Assembly Floor Plate"
            />
            <InspectorStat
              label="Dimensions"
              value={meta.dimensions || "6.5m x 5.0m"}
              subtext="Length x Width"
            />
            <InspectorStat
              label="Acoustic Finish"
              value={meta.material || "Acoustic Timber"}
              subtext="Reverberation Control"
            />
            <InspectorStat
              label="Design Capacity"
              value="~24 Persons"
              subtext="NBC 2016 Assembly Standard"
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
            currentLevel="HALL"
            onSelectLevel={onSelectLevel}
          />
        </InspectorSection>
      </div>

      <InspectorActionBar
        primaryAction={{
          label: "FOCUS CONFERENCE HALL",
          icon: <LayoutGrid className="w-4 h-4" />,
          onClick: () => onFocusEntity?.(selection.entityId),
        }}
        onOpenAI={onOpenAI}
      />
    </>
  );
};
