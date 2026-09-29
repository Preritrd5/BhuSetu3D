"use client";

import React from "react";
import { LayoutGrid, DoorOpen, ArrowUpRight, Compass } from "lucide-react";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import { InspectorHeader } from "./InspectorHeader";
import { InspectorSection } from "./InspectorSection";
import { InspectorStat } from "./InspectorStat";
import { InspectorRelationship } from "./InspectorRelationship";
import { InspectorActionBar } from "./InspectorActionBar";
import { SpatialElementNode } from "@/types/property";

interface RoomInspectorProps {
  selection: ActiveSpatialSelection;
  roomNode: SpatialElementNode | null;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  onFocusEntity?: (id: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
  onOpenAI?: () => void;
}

export const RoomInspector: React.FC<RoomInspectorProps> = ({
  selection,
  roomNode,
  onSelectLevel,
  onFocusEntity,
  onClose,
  onMinimize,
  onOpenAI,
}) => {
  const meta = selection.metadata || {};
  const roomId = selection.entityId || "room-302";

  const getFallbackElements = (rId: string) => {
    if (rId.includes("302")) {
      return [
        {
          id: "door-302",
          name: "Door D-302-A (Egress Access)",
          type: "DOOR",
          dimensions: "1.0m × 2.1m",
          material: "Solid Hardwood / Fire-Rated 60min",
        },
        {
          id: "window-302",
          name: "Window W-302-A (Curtain Glazing)",
          type: "WINDOW",
          dimensions: "2.4m × 1.8m",
          material: "Double-Glazed Low-E Architectural Glass",
        },
      ];
    } else if (rId.includes("301")) {
      return [
        {
          id: "door-301",
          name: "Door D-301-A (Conference Entry)",
          type: "DOOR",
          dimensions: "1.8m × 2.4m",
          material: "Frameless Toughened Glass Double-Leaf",
        },
        {
          id: "window-301",
          name: "Window W-301-A (Ribbon Facade Window)",
          type: "WINDOW",
          dimensions: "4.0m × 1.5m",
          material: "Acoustic Double Glazing / Bronze Tint",
        },
      ];
    } else {
      return [
        {
          id: `door-${rId.replace("room-", "")}`,
          name: `Door D-${rId.replace("room-", "")}`,
          type: "DOOR",
          dimensions: "1.0m × 2.1m",
          material: "Flush Timber Door",
        },
      ];
    }
  };

  const childElements = (roomNode?.elements && roomNode.elements.length > 0)
    ? roomNode.elements
    : getFallbackElements(roomId);

  return (
    <>
      <InspectorHeader
        entityType="ROOM"
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
        {/* Section 1: Room Dimensions */}
        <InspectorSection title="Room Spatial Metrics" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <InspectorStat
              label="Computed Area"
              value={meta.area_sqm ?? 24.8}
              unit="m²"
              badge="LOD3"
              badgeType="computed"
              subtext="Clear Room Floor Plate"
            />
            <InspectorStat
              label="Dimensions"
              value={meta.dimensions || "5.2m x 4.8m"}
              subtext="Length x Width"
            />
            <InspectorStat
              label="Partition Material"
              value={meta.material || "Double Glazed"}
              subtext="Acoustic STC 42"
            />
            <InspectorStat
              label="Sub-Elements"
              value={`${childElements.length} Elements`}
              subtext="Doors & Glazing"
            />
          </div>
        </InspectorSection>

        {/* Section 2: Architectural Elements */}
        <InspectorSection
          title="Architectural Elements"
          badge={childElements.length}
          icon={<DoorOpen className="w-3.5 h-3.5 text-[#C47B50]" />}
          defaultOpen={true}
        >
          {childElements.length > 0 ? (
            <div className="space-y-1.5">
              {childElements.map((elem) => (
                <button
                  key={elem.id}
                  onClick={() => onSelectLevel(elem.type === "DOOR" ? "DOOR" : elem.type === "WINDOW" ? "WINDOW" : "ELEMENT", elem.id)}
                  className="w-full p-2.5 rounded-[10px] bg-[#1A201D] hover:bg-[#222A26] border border-[rgba(244,240,232,0.08)] flex items-center justify-between text-left transition-all group"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-[#F4F0E8] block truncate group-hover:text-[#C47B50]">
                      {elem.name}
                    </span>
                    <span className="text-[11px] text-[#A2B3A8] font-mono block mt-0.5">
                      {elem.type} • {elem.dimensions} • {elem.material}
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#77867C] group-hover:text-[#C47B50] transition-colors shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-[10px] bg-[#1A201D]/60 border border-[rgba(244,240,232,0.08)] text-[11px] text-[#A2B3A8] font-mono">
              No sub-elements mapped in this room.
            </div>
          )}
        </InspectorSection>

        {/* Section 3: Hierarchy Relationships */}
        <InspectorSection
          title="Spatial Hierarchy"
          icon={<Compass className="w-3.5 h-3.5 text-[#23847D]" />}
          defaultOpen={false}
        >
          <InspectorRelationship
            hierarchyPath={selection.hierarchyPath}
            currentLevel="ROOM"
            onSelectLevel={onSelectLevel}
          />
        </InspectorSection>
      </div>

      <InspectorActionBar
        primaryAction={{
          label: "INSPECT ROOM INTERIOR",
          icon: <LayoutGrid className="w-4 h-4" />,
          onClick: () => onFocusEntity?.(selection.entityId),
        }}
        secondaryActions={[
          {
            id: "inspect-element",
            label: "Inspect Door",
            icon: <DoorOpen className="w-3.5 h-3.5" />,
            onClick: () => {
              if (childElements.length) {
                onSelectLevel(childElements[0].type === "DOOR" ? "DOOR" : "ELEMENT", childElements[0].id);
              }
            },
          },
        ]}
        onOpenAI={onOpenAI}
      />
    </>
  );
};
