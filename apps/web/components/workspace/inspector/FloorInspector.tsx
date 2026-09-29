"use client";

import React from "react";
import {
  Layers,
  LayoutGrid,
  Maximize2,
  AlertTriangle,
  ArrowUpRight,
  Compass,
  Info,
  ShieldCheck,
} from "lucide-react";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import { InspectorHeader } from "./InspectorHeader";
import { InspectorSection } from "./InspectorSection";
import { InspectorStat } from "./InspectorStat";
import { InspectorRelationship } from "./InspectorRelationship";
import { InspectorActionBar } from "./InspectorActionBar";
import { FloorHierarchyNode } from "@/types/property";

interface FloorInspectorProps {
  selection: ActiveSpatialSelection;
  floorNode: FloorHierarchyNode | null;
  isolateFloor: boolean;
  explodeFloors?: boolean;
  onToggleIsolateFloor: (isolate: boolean) => void;
  onToggleExplodeFloors?: () => void;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  onFocusEntity?: (id: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
  onOpenAI?: () => void;
}

export const FloorInspector: React.FC<FloorInspectorProps> = ({
  selection,
  floorNode,
  isolateFloor,
  explodeFloors = false,
  onToggleIsolateFloor,
  onToggleExplodeFloors,
  onSelectLevel,
  onFocusEntity,
  onClose,
  onMinimize,
  onOpenAI,
}) => {
  const meta = selection.metadata || {};
  const floorCode = meta.floor_code || selection.entityId || "FL-03";

  // Canonical fallback units per floor (FL-01 to FL-07)
  const getFallbackUnits = (code: string) => {
    switch (code) {
      case "FL-01":
        return [
          {
            id: "unit-101",
            unit_number: "unit-101",
            unit_label: "Unit 101 · Grand Entrance Lobby & Reception",
            unit_type: "COMMERCIAL",
            carpet_area_sqm: 110.0,
            ulpin_3d: "KA-BLR-2026-P102-U101",
            rooms: [],
          },
          {
            id: "unit-102",
            unit_number: "unit-102",
            unit_label: "Unit 102 · Retail Arcade & Cafe Concourse",
            unit_type: "RETAIL",
            carpet_area_sqm: 85.0,
            ulpin_3d: "KA-BLR-2026-P102-U102",
            rooms: [],
          },
        ];
      case "FL-02":
        return [
          {
            id: "unit-201",
            unit_number: "unit-201",
            unit_label: "Unit 201 · Commercial Banking Operations",
            unit_type: "COMMERCIAL",
            carpet_area_sqm: 115.0,
            ulpin_3d: "KA-BLR-2026-P102-U201",
            rooms: [],
          },
          {
            id: "unit-202",
            unit_number: "unit-202",
            unit_label: "Unit 202 · Private Wealth Client Suites",
            unit_type: "COMMERCIAL",
            carpet_area_sqm: 90.0,
            ulpin_3d: "KA-BLR-2026-P102-U202",
            rooms: [],
          },
        ];
      case "FL-04":
        return [
          {
            id: "unit-401",
            unit_number: "unit-401",
            unit_label: "Unit 401 · Open Tech Collaboration Studio",
            unit_type: "OFFICE",
            carpet_area_sqm: 120.0,
            ulpin_3d: "KA-BLR-2026-P102-U401",
            rooms: [],
          },
          {
            id: "unit-402",
            unit_number: "unit-402",
            unit_label: "Unit 402 · Scrum & Meeting Pods",
            unit_type: "OFFICE",
            carpet_area_sqm: 85.0,
            ulpin_3d: "KA-BLR-2026-P102-U402",
            rooms: [],
          },
        ];
      case "FL-05":
        return [
          {
            id: "unit-501",
            unit_number: "unit-501",
            unit_label: "Unit 501 · Corporate Legal Advisory",
            unit_type: "OFFICE",
            carpet_area_sqm: 110.0,
            ulpin_3d: "KA-BLR-2026-P102-U501",
            rooms: [],
          },
          {
            id: "unit-502",
            unit_number: "unit-502",
            unit_label: "Unit 502 · Senior Partner Chambers",
            unit_type: "OFFICE",
            carpet_area_sqm: 95.0,
            ulpin_3d: "KA-BLR-2026-P102-U502",
            rooms: [],
          },
        ];
      case "FL-06":
        return [
          {
            id: "unit-601",
            unit_number: "unit-601",
            unit_label: "Unit 601 · Advanced R&D Laboratory",
            unit_type: "LABORATORY",
            carpet_area_sqm: 115.0,
            ulpin_3d: "KA-BLR-2026-P102-U601",
            rooms: [],
          },
          {
            id: "unit-602",
            unit_number: "unit-602",
            unit_label: "Unit 602 · Prototyping & Design Studio",
            unit_type: "STUDIO",
            carpet_area_sqm: 90.0,
            ulpin_3d: "KA-BLR-2026-P102-U602",
            rooms: [],
          },
        ];
      case "FL-07":
        return [
          {
            id: "unit-701",
            unit_number: "unit-701",
            unit_label: "Unit 701 · Sky Lounge & Reception Atrium",
            unit_type: "COMMERCIAL",
            carpet_area_sqm: 105.0,
            ulpin_3d: "KA-BLR-2026-P102-U701",
            rooms: [],
          },
          {
            id: "unit-702",
            unit_number: "unit-702",
            unit_label: "Unit 702 · Panoramic Boardroom & CEO Chamber",
            unit_type: "COMMERCIAL",
            carpet_area_sqm: 100.0,
            ulpin_3d: "KA-BLR-2026-P102-U702",
            rooms: [],
          },
        ];
      case "FL-03":
      default:
        return [
          {
            id: "unit-301",
            unit_number: "unit-301",
            unit_label: "Unit 301 · Board Conference Hall",
            unit_type: "COMMERCIAL",
            carpet_area_sqm: 118.0,
            ulpin_3d: "KA-BLR-2026-P102-U301",
            rooms: [],
          },
          {
            id: "unit-302",
            unit_number: "unit-302",
            unit_label: "Unit 302 · Executive Office Suite",
            unit_type: "COMMERCIAL",
            carpet_area_sqm: 88.0,
            ulpin_3d: "KA-BLR-2026-P102-U302",
            rooms: [],
          },
        ];
    }
  };

  const units = (floorNode?.units && floorNode.units.length > 0)
    ? floorNode.units
    : getFallbackUnits(floorCode);
  const isUnsanctioned = meta.is_unsanctioned || floorCode === "FL-03";
  const isIllustrative = !isUnsanctioned && (selection.source === "ILLUSTRATIVE" || floorCode !== "FL-03");

  return (
    <>
      <InspectorHeader
        entityType="FLOOR"
        title={selection.title}
        subtitle={selection.subtitle}
        code={meta.floor_code}
        source={selection.source}
        verificationState={selection.verificationState}
        confidence={selection.confidence}
        onClose={onClose}
        onMinimize={onMinimize}
      />

      <div className="overflow-y-auto flex-1 p-0 divide-y divide-[rgba(244,240,232,0.06)]">
        {/* Unsanctioned Floor Notice (Floor 03 Discrepancy) */}
        {isUnsanctioned && (
          <div className="p-3.5 bg-rose-950/40 border-b border-rose-800/50 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-rose-200 block">
                Unsanctioned Surveyed Floor (+4.0m Slab)
              </span>
              <span className="text-rose-300/80 block mt-0.5">
                Floor slab surveyed above sanctioned height envelope. Discrepancy confirmed against
                municipal sanction plan BBMP/WZ/2022/4102.
              </span>
            </div>
          </div>
        )}

        {/* Illustrative Demonstration Geometry Notice */}
        {isIllustrative && (
          <div className="p-3 bg-[#1A201D] border-b border-[#23847D]/30 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#2EB8B0] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-[#E5F2EC] block">
                Demonstration Digital Twin Level
              </span>
              <span className="text-[#8FA89B] block mt-0.5">
                Volumetric structure and interior units are rendered using illustrative architectural BIM geometry for spatial workflow and navigation demonstration.
              </span>
            </div>
          </div>
        )}

        {/* Section 1: Slab Geometry & Elevation */}
        <InspectorSection title="Slab Geometry & Elevation" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <InspectorStat
              label="Base Elevation"
              value={meta.base_elevation ?? 931.0}
              unit="m MSL"
              subtext="Clear Floor Slab Level"
            />
            <InspectorStat
              label="Ceiling Elevation"
              value={meta.ceiling_elevation ?? 935.0}
              unit="m MSL"
              subtext="Underside of Roof Slab"
            />
            <InspectorStat
              label="Clear Slab Height"
              value={meta.floor_height ?? 4.0}
              unit="m"
              subtext="Vertical Slab Thickness"
            />
            <InspectorStat
              label="Floor Plate Area"
              value={meta.floor_area_sqm ?? 240.0}
              unit="m²"
              badge="POSTGIS"
              badgeType="computed"
              subtext="Extruded Slab Footprint"
            />
          </div>
        </InspectorSection>

        {/* Section 2: Units on Floor */}
        <InspectorSection
          title="Units on Floor"
          badge={units.length}
          icon={<LayoutGrid className="w-3.5 h-3.5 text-[#C47B50]" />}
          defaultOpen={true}
        >
          {units.length > 0 ? (
            <div className="space-y-1.5">
              {units.map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => onSelectLevel("UNIT", unit.unit_number)}
                  className="w-full p-2.5 rounded-[8px] bg-[#0F1210] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] flex items-center justify-between text-left transition-all group"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-[#F4F0E8] block truncate group-hover:text-[#C47B50]">
                      {unit.unit_label || `Unit ${unit.unit_number}`}
                    </span>
                    <span className="text-[11px] text-[#A7B3AB] font-mono block">
                      {unit.ulpin_3d} • {unit.unit_type} ({unit.carpet_area_sqm}m²)
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#6F7772] group-hover:text-[#C47B50] transition-colors shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)] text-[11px] text-[#77867C] font-mono">
              No units partitioned on this floor slab.
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
            currentLevel="FLOOR"
            onSelectLevel={onSelectLevel}
          />
        </InspectorSection>
      </div>

      <InspectorActionBar
        primaryAction={{
          label: isolateFloor ? "REVERT TO FULL BUILDING" : "ISOLATE FLOOR SLAB",
          icon: <Maximize2 className="w-4 h-4" />,
          active: isolateFloor,
          onClick: () => onToggleIsolateFloor(!isolateFloor),
        }}
        secondaryActions={[
          {
            id: "inspect-unit",
            label: "Inspect Unit",
            icon: <LayoutGrid className="w-3.5 h-3.5" />,
            onClick: () => {
              if (units.length) onSelectLevel("UNIT", units[0].unit_number);
            },
          },
          {
            id: "explode-floors",
            label: explodeFloors ? "Collapse Stack" : "Explode Floors",
            icon: <Layers className="w-3.5 h-3.5" />,
            active: explodeFloors,
            onClick: () => onToggleExplodeFloors?.(),
          },
        ]}
        onOpenAI={onOpenAI}
      />
    </>
  );
};
