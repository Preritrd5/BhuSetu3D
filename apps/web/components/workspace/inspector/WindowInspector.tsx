"use client";

import React from "react";
import { LayoutGrid, Sun, Compass } from "lucide-react";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import { InspectorHeader } from "./InspectorHeader";
import { InspectorSection } from "./InspectorSection";
import { InspectorStat } from "./InspectorStat";
import { InspectorRelationship } from "./InspectorRelationship";
import { InspectorActionBar } from "./InspectorActionBar";
import { SpatialElementNode } from "@/types/property";

interface WindowInspectorProps {
  selection: ActiveSpatialSelection;
  windowNode: SpatialElementNode | null;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  onFocusEntity?: (id: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
  onOpenAI?: () => void;
}

export const WindowInspector: React.FC<WindowInspectorProps> = ({
  selection,
  windowNode,
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
        entityType="WINDOW"
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
        {/* Section 1: Window & Glazing Metrics */}
        <InspectorSection title="Glazing Performance" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <InspectorStat
              label="Dimensions"
              value={meta.dimensions || "2.2m x 1.6m"}
              subtext="Width x Height"
            />
            <InspectorStat
              label="Glazing Type"
              value="Low-E Double"
              badge="ECBC"
              badgeType="authoritative"
              subtext="Argon Insulated (12mm)"
            />
            <InspectorStat
              label="SHGC Coefficient"
              value="0.28"
              subtext="Solar Heat Gain Standard"
            />
            <InspectorStat
              label="Facade Facing"
              value="North-East"
              subtext="Aura Horizon Exterior"
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
            currentLevel="WINDOW"
            onSelectLevel={onSelectLevel}
          />
        </InspectorSection>
      </div>

      <InspectorActionBar
        primaryAction={{
          label: "FOCUS FACADE WINDOW",
          icon: <LayoutGrid className="w-4 h-4" />,
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
