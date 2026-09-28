"use client";

import React from "react";
import { DoorOpen, ShieldCheck, Compass, LayoutGrid } from "lucide-react";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import { InspectorHeader } from "./InspectorHeader";
import { InspectorSection } from "./InspectorSection";
import { InspectorStat } from "./InspectorStat";
import { InspectorRelationship } from "./InspectorRelationship";
import { InspectorActionBar } from "./InspectorActionBar";
import { SpatialElementNode } from "@/types/property";

interface DoorInspectorProps {
  selection: ActiveSpatialSelection;
  doorNode: SpatialElementNode | null;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  onFocusEntity?: (id: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
  onOpenAI?: () => void;
}

export const DoorInspector: React.FC<DoorInspectorProps> = ({
  selection,
  doorNode,
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
        entityType="DOOR"
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
        {/* Section 1: Door Specifications */}
        <InspectorSection title="Door Architecture" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <InspectorStat
              label="Dimensions"
              value={meta.dimensions || "1.1m x 2.4m"}
              subtext="Width x Height"
            />
            <InspectorStat
              label="Fire Rating"
              value={meta.fire_rating || "FD-60"}
              badge="BARRIER"
              badgeType="authoritative"
              subtext="60 Min Fire Resistance"
            />
            <InspectorStat
              label="Construction"
              value="Solid Core Timber"
              subtext="Reinforced Steel Frame"
            />
            <InspectorStat
              label="Egress Direction"
              value="Outward Swing"
              badge="LIFE SAFETY"
              badgeType="authoritative"
              subtext="NBC Egress Compliant"
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
            currentLevel="DOOR"
            onSelectLevel={onSelectLevel}
          />
        </InspectorSection>
      </div>

      <InspectorActionBar
        primaryAction={{
          label: "FOCUS DOOR ELEMENT",
          icon: <DoorOpen className="w-4 h-4" />,
          onClick: () => onFocusEntity?.(selection.entityId),
        }}
        secondaryActions={[
          {
            id: "inspect-parent-room",
            label: "Inspect Room",
            icon: <LayoutGrid className="w-3.5 h-3.5" />,
            onClick: () => onSelectLevel("ROOM", selection.parentId || undefined),
          },
        ]}
        onOpenAI={onOpenAI}
      />
    </>
  );
};
