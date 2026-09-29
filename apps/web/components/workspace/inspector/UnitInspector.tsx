"use client";

import React from "react";
import { LayoutGrid, DoorOpen, ArrowUpRight, Compass, ShieldCheck } from "lucide-react";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import { InspectorHeader } from "./InspectorHeader";
import { InspectorSection } from "./InspectorSection";
import { InspectorStat } from "./InspectorStat";
import { InspectorRelationship } from "./InspectorRelationship";
import { InspectorActionBar } from "./InspectorActionBar";
import { UnitHierarchyNode } from "@/types/property";

interface UnitInspectorProps {
  selection: ActiveSpatialSelection;
  unitNode: UnitHierarchyNode | null;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  onFocusEntity?: (id: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
  onOpenAI?: () => void;
}

export const UnitInspector: React.FC<UnitInspectorProps> = ({
  selection,
  unitNode,
  onSelectLevel,
  onFocusEntity,
  onClose,
  onMinimize,
  onOpenAI,
}) => {
  const meta = selection.metadata || {};
  const unitNum = meta.unit_number || selection.entityId || "unit-302";

  const getFallbackRooms = (uNum: string) => {
    const is302 = uNum.includes("302");
    const is301 = uNum.includes("301");
    if (is302) {
      return [
        {
          id: "room-302",
          name: "Executive Suite Primary Chamber",
          type: "OFFICE",
          area_sqm: 24.8,
          dimensions: "6.2m × 4.0m",
          material: "Granite Tile / Glass Partitions",
        },
      ];
    } else if (is301) {
      return [
        {
          id: "room-301",
          name: "Board Conference Chamber",
          type: "CONFERENCE",
          area_sqm: 32.5,
          dimensions: "6.5m × 5.0m",
          material: "Acoustic Panel / Engineered Timber",
        },
      ];
    } else {
      return [
        {
          id: `room-${uNum.replace("unit-", "")}`,
          name: `${uNum} Main Space`,
          type: "COMMERCIAL",
          area_sqm: 28.0,
          dimensions: "7.0m × 4.0m",
          material: "Vitrified Tile",
        },
      ];
    }
  };

  const rooms = (unitNode?.spatial_elements && unitNode.spatial_elements.length > 0)
    ? unitNode.spatial_elements
    : getFallbackRooms(unitNum);

  return (
    <>
      <InspectorHeader
        entityType="UNIT"
        title={selection.title}
        subtitle={selection.subtitle}
        code={meta.unit_number}
        source={selection.source}
        verificationState={selection.verificationState}
        confidence={selection.confidence}
        onClose={onClose}
        onMinimize={onMinimize}
      />

      <div className="overflow-y-auto flex-1 p-0 divide-y divide-[rgba(244,240,232,0.06)]">
        {/* Section 1: Unit Property Dimensions */}
        <InspectorSection title="Strata Unit Metrics" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <InspectorStat
              label="Carpet Area"
              value={meta.carpet_area_sqm ?? 190.0}
              unit="m²"
              badge="SURVEY"
              badgeType="authoritative"
              subtext="Clear Usable Interior"
            />
            <InspectorStat
              label="Built-Up Area"
              value={meta.built_up_area_sqm ?? 225.0}
              unit="m²"
              badge="COMPUTED"
              badgeType="computed"
              subtext="Including Wall Footprints"
            />
            <InspectorStat
              label="Unit Typology"
              value={meta.unit_type || "COMMERCIAL_OFFICE"}
              subtext="Strata Commercial Use"
            />
            <InspectorStat
              label="3D Status"
              value={meta.status_3d || "AVAILABLE"}
              subtext="PostGIS 3D Cadastre"
            />
          </div>
        </InspectorSection>

        {/* Section 2: Internal Spaces & Rooms */}
        <InspectorSection
          title="Internal Spaces"
          badge={rooms.length}
          icon={<DoorOpen className="w-3.5 h-3.5 text-[#C47B50]" />}
          defaultOpen={true}
        >
          {rooms.length > 0 ? (
            <div className="space-y-1.5">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => onSelectLevel("ROOM", room.id)}
                  className="w-full p-2.5 rounded-[8px] bg-[#0F1210] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] flex items-center justify-between text-left transition-all group"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-[#F4F0E8] block truncate group-hover:text-[#C47B50]">
                      {room.name}
                    </span>
                    <span className="text-[10px] text-[#77867C] font-mono block">
                      {room.type} • {room.dimensions || `${room.area_sqm}m²`} • {room.material}
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#6F7772] group-hover:text-[#C47B50] transition-colors shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)] text-[11px] text-[#77867C] font-mono">
              Internal partition boundaries not yet mapped.
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
            currentLevel="UNIT"
            onSelectLevel={onSelectLevel}
          />
        </InspectorSection>
      </div>

      <InspectorActionBar
        primaryAction={{
          label: "FOCUS UNIT INTERIOR",
          icon: <LayoutGrid className="w-4 h-4" />,
          onClick: () => onFocusEntity?.(selection.entityId),
        }}
        secondaryActions={[
          {
            id: "inspect-room",
            label: "Inspect Room",
            icon: <DoorOpen className="w-3.5 h-3.5" />,
            onClick: () => {
              if (rooms.length) onSelectLevel("ROOM", rooms[0].id);
            },
          },
        ]}
        onOpenAI={onOpenAI}
      />
    </>
  );
};
