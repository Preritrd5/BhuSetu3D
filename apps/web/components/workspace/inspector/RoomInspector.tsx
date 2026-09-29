"use client";

import React from "react";
import { LayoutGrid, DoorOpen, ArrowUpRight, Compass, Info } from "lucide-react";
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
    if (rId.includes("101")) {
      return [
        { id: "door-101", name: "Main Double Glass Entrance Doors", type: "DOOR", dimensions: "2.4m × 3.0m", material: "Toughened Frameless Glass" },
        { id: "window-101", name: "Storefront Facade Glazing", type: "WINDOW", dimensions: "6.0m × 3.5m", material: "Low-E Double Glazing" },
      ];
    } else if (rId.includes("102")) {
      return [
        { id: "door-102", name: "Retail Concourse Door", type: "DOOR", dimensions: "1.2m × 2.4m", material: "Anodized Aluminum" },
        { id: "window-102", name: "Retail Display Window", type: "WINDOW", dimensions: "4.0m × 2.4m", material: "Clear Laminated Glass" },
      ];
    } else if (rId.includes("201")) {
      return [
        { id: "door-201", name: "Banking Hall Access Door", type: "DOOR", dimensions: "1.2m × 2.4m", material: "Reinforced Security Door" },
        { id: "window-201", name: "Perimeter Ribbon Glazing", type: "WINDOW", dimensions: "3.5m × 1.8m", material: "Double Glazed Tinted" },
      ];
    } else if (rId.includes("202")) {
      return [
        { id: "door-202", name: "Advisory Chamber Door", type: "DOOR", dimensions: "1.0m × 2.4m", material: "Solid Teak Door" },
        { id: "window-202", name: "East Facade Window", type: "WINDOW", dimensions: "2.5m × 1.8m", material: "Acoustic Glazing" },
      ];
    } else if (rId.includes("301")) {
      return [
        { id: "door-301", name: "Door D-301-A (Conference Entry)", type: "DOOR", dimensions: "1.8m × 2.4m", material: "Frameless Toughened Glass Double-Leaf" },
        { id: "window-301", name: "Window W-301-A (Ribbon Facade Window)", type: "WINDOW", dimensions: "4.0m × 1.5m", material: "Acoustic Double Glazing / Bronze Tint" },
      ];
    } else if (rId.includes("302")) {
      return [
        { id: "door-302", name: "Door D-302-A (Egress Access)", type: "DOOR", dimensions: "1.0m × 2.1m", material: "Solid Hardwood / Fire-Rated 60min" },
        { id: "window-302", name: "Window W-302-A (Curtain Glazing)", type: "WINDOW", dimensions: "2.4m × 1.8m", material: "Double-Glazed Low-E Architectural Glass" },
      ];
    } else if (rId.includes("401")) {
      return [
        { id: "door-401", name: "Access Keycard Door", type: "DOOR", dimensions: "1.1m × 2.4m", material: "Steel Frame Glass" },
        { id: "window-401", name: "West Ribbon Window", type: "WINDOW", dimensions: "5.0m × 1.8m", material: "Double Glazed" },
      ];
    } else if (rId.includes("402")) {
      return [
        { id: "door-402", name: "Acoustic Sliding Door", type: "DOOR", dimensions: "1.0m × 2.4m", material: "Laminated Acoustic Glass" },
        { id: "window-402", name: "East Facing Window", type: "WINDOW", dimensions: "3.0m × 1.8m", material: "Low-E Glazed" },
      ];
    } else if (rId.includes("501")) {
      return [
        { id: "door-501", name: "Chambers Entry Door", type: "DOOR", dimensions: "1.0m × 2.4m", material: "Solid Walnut" },
        { id: "window-501", name: "West Glazing Unit", type: "WINDOW", dimensions: "3.5m × 1.8m", material: "Tinted Double Glazed" },
      ];
    } else if (rId.includes("502")) {
      return [
        { id: "door-502", name: "Partner Suite Door", type: "DOOR", dimensions: "1.0m × 2.4m", material: "Solid Walnut with Brass Fittings" },
        { id: "window-502", name: "East Skyline Window", type: "WINDOW", dimensions: "3.5m × 1.8m", material: "Low-E Glazing" },
      ];
    } else if (rId.includes("601")) {
      return [
        { id: "door-601", name: "Air-Lock Sealed Door", type: "DOOR", dimensions: "1.2m × 2.4m", material: "Hermetically Sealed Steel" },
        { id: "window-601", name: "Observation Window", type: "WINDOW", dimensions: "3.0m × 1.8m", material: "Safety Laminated" },
      ];
    } else if (rId.includes("602")) {
      return [
        { id: "door-602", name: "Double Studio Door", type: "DOOR", dimensions: "1.8m × 2.4m", material: "Aluminum Frame" },
        { id: "window-602", name: "North Glazing", type: "WINDOW", dimensions: "4.0m × 1.8m", material: "Clear Insulated" },
      ];
    } else if (rId.includes("701")) {
      return [
        { id: "door-701", name: "Sky Terrace Sliding Door", type: "DOOR", dimensions: "2.4m × 2.8m", material: "Double Sliding Glass" },
        { id: "window-701", name: "Floor-to-Ceiling Panoramic Window", type: "WINDOW", dimensions: "6.0m × 2.8m", material: "Solar Control Triple Glazing" },
      ];
    } else if (rId.includes("702")) {
      return [
        { id: "door-702", name: "Boardroom Double Door", type: "DOOR", dimensions: "1.8m × 2.8m", material: "Smoked Glass with Bronze Trim" },
        { id: "window-702", name: "Bengaluru Skyline Panoramic Window", type: "WINDOW", dimensions: "6.0m × 2.8m", material: "Acoustic Low-E Triple Glazing" },
      ];
    } else {
      return [
        { id: `door-${rId.replace("room-", "")}`, name: `Door D-${rId.replace("room-", "")}`, type: "DOOR", dimensions: "1.0m × 2.1m", material: "Flush Timber Door" },
      ];
    }
  };

  const childElements = (roomNode?.elements && roomNode.elements.length > 0)
    ? roomNode.elements
    : getFallbackElements(roomId);
  const isIllustrative = selection.source === "ILLUSTRATIVE";

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
        {/* Illustrative Notice */}
        {isIllustrative && (
          <div className="p-3 bg-[#1A201D] border-b border-[#23847D]/30 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#2EB8B0] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-[#E5F2EC] block">
                Demonstration Interior Elements
              </span>
              <span className="text-[#8FA89B] block mt-0.5">
                Doors, windows, and partition envelopes are modeled with illustrative BIM architectural components.
              </span>
            </div>
          </div>
        )}
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
