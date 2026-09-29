"use client";

import React, { useState } from "react";
import {
  Building2,
  Layers,
  ShieldAlert,
  Ruler,
  Maximize2,
  Sparkles,
  ArrowUpRight,
  Compass,
  AlertTriangle,
} from "lucide-react";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import { InspectorHeader } from "./InspectorHeader";
import { InspectorSection } from "./InspectorSection";
import { InspectorStat } from "./InspectorStat";
import { InspectorRelationship } from "./InspectorRelationship";
import { InspectorActionBar } from "./InspectorActionBar";
import { BuildingHierarchyNode } from "@/types/property";
import { ContextualIntelligenceSection } from "./ContextualIntelligenceSection";
import { PostGISSpatialIntelligenceCard } from "./PostGISSpatialIntelligenceCard";
import {
  ConflictItem,
  PropertyEvidenceResponse,
  ProvenanceChainResponse,
  ConfidenceBreakdownResponse,
  NearbyInfrastructureResponse,
  EntityIntelligenceSummary,
} from "@/types/intelligence";

interface BuildingInspectorProps {
  selection: ActiveSpatialSelection;
  buildingNode: BuildingHierarchyNode | null;
  isolateBuilding?: boolean;
  explodeFloors?: boolean;
  onToggleIsolateBuilding?: () => void;
  onToggleExplodeFloors?: () => void;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  onFocusEntity?: (id: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
  onOpenAI?: () => void;
  // Phase 8 Intelligence props
  conflicts?: ConflictItem[];
  evidence?: PropertyEvidenceResponse | null;
  provenance?: ProvenanceChainResponse | null;
  confidence?: ConfidenceBreakdownResponse | null;
  infrastructure?: NearbyInfrastructureResponse | null;
  intelligenceSummary?: EntityIntelligenceSummary | null;
  activeConflict?: ConflictItem | null;
  onSelectConflict?: (conflict: ConflictItem) => void;
  onMeasureConflict?: (conflict: ConflictItem) => void;
  onOpenAIWithQuery?: (prompt: string) => void;
}

export const BuildingInspector: React.FC<BuildingInspectorProps> = ({
  selection,
  buildingNode,
  isolateBuilding = false,
  explodeFloors = false,
  onToggleIsolateBuilding,
  onToggleExplodeFloors,
  onSelectLevel,
  onFocusEntity,
  onClose,
  onMinimize,
  onOpenAI,
  conflicts = [],
  evidence = null,
  provenance = null,
  confidence = null,
  infrastructure = null,
  intelligenceSummary = null,
  activeConflict = null,
  onSelectConflict,
  onMeasureConflict,
  onOpenAIWithQuery,
}) => {
  const meta = selection.metadata || {};
  // Canonical default floors for Aura Horizon when API tree not yet loaded
  const DEFAULT_AURA_FLOORS = [
    {
      id: "fl-3",
      floor_code: "FL-03",
      floor_label: "Floor 03 (Executive Suite)",
      base_elevation: 934.5,
      ceiling_elevation: 941.5,
      floor_area_sqm: 240.0,
      is_unsanctioned: true,
      units: [],
    },
    {
      id: "fl-2",
      floor_code: "FL-02",
      floor_label: "Floor 02 (First Floor)",
      base_elevation: 927.5,
      ceiling_elevation: 934.5,
      floor_area_sqm: 240.0,
      is_unsanctioned: false,
      units: [],
    },
    {
      id: "fl-1",
      floor_code: "FL-01",
      floor_label: "Floor 01 (Ground Floor)",
      base_elevation: 920.5,
      ceiling_elevation: 927.5,
      floor_area_sqm: 240.0,
      is_unsanctioned: false,
      units: [],
    },
  ];
  const floors = (buildingNode?.floors && buildingNode.floors.length > 0)
    ? buildingNode.floors
    : DEFAULT_AURA_FLOORS;
  const hasDiscrepancy = meta.has_discrepancy !== false; // Default true for Aura Horizon

  return (
    <>
      <InspectorHeader
        entityType="BUILDING"
        title={selection.title}
        subtitle={selection.subtitle}
        code={meta.building_code}
        source={selection.source}
        verificationState={selection.verificationState}
        confidence={selection.confidence}
        onClose={onClose}
        onMinimize={onMinimize}
      />

      <div className="overflow-y-auto flex-1 p-0 divide-y divide-[rgba(244,240,232,0.06)]">
        {/* Discrepancy Alert Banner if vertical limit is exceeded */}
        {hasDiscrepancy && (
          <div className="p-3.5 bg-rose-950/40 border-b border-rose-800/50 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-rose-200 block">
                Spatial Variance Detected (+3.00m)
              </span>
              <span className="text-rose-300/80 block mt-0.5">
                Observed height (14.5m) exceeds sanctioned limit (11.5m). Floor 03 represents an
                unsanctioned vertical addition.
              </span>
            </div>
          </div>
        )}

        {/* Section 1: Structural & Volumetric Metrics */}
        <InspectorSection title="Volumetric Structure" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <InspectorStat
              label="Observed Height"
              value={meta.observed_height ?? 14.5}
              unit="m"
              badge="LOD2"
              badgeType={hasDiscrepancy ? "warning" : "computed"}
              subtext={`Sanctioned: ${meta.sanctioned_height ?? 11.5}m`}
            />
            <InspectorStat
              label="Floor Stack"
              value={`${meta.detected_floors ?? 4} Floors`}
              badge={hasDiscrepancy ? "+1 FLOOR" : "MATCH"}
              badgeType={hasDiscrepancy ? "warning" : "authoritative"}
              subtext={`Sanctioned: ${meta.sanctioned_floors ?? 3} Floors`}
            />
            <InspectorStat
              label="Ground Elevation"
              value={meta.ground_elevation ?? 920.5}
              unit="m MSL"
              subtext="Topographic Datum"
            />
            <InspectorStat
              label="Building Typology"
              value={meta.building_type || "COMMERCIAL"}
              subtext="Mixed-Use Commercial"
            />
          </div>
        </InspectorSection>

        {/* Section 1.5: Live PostGIS Spatial Intelligence */}
        <InspectorSection
          title="PostGIS Spatial Intelligence"
          badge="AUTHORITATIVE"
          icon={<Compass className="w-3.5 h-3.5 text-[#C47B50]" />}
          defaultOpen={true}
        >
          <PostGISSpatialIntelligenceCard
            entityType="BUILDING"
            entityId={meta.building_code || buildingNode?.id || selection.entityId}
            onSelectProperty={(type, id) => onSelectLevel(type, id)}
          />
        </InspectorSection>

        {/* Section 2: Vertical Slabs Matrix */}
        <InspectorSection
          title="Floor Slab Matrix"
          badge={floors.length}
          icon={<Layers className="w-3.5 h-3.5 text-[#C47B50]" />}
          defaultOpen={true}
        >
          {floors.length > 0 ? (
            <div className="space-y-1.5">
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  onClick={() => onSelectLevel("FLOOR", floor.floor_code)}
                  className={`w-full p-2.5 rounded-[8px] border flex items-center justify-between text-left transition-all group ${
                    floor.is_unsanctioned
                      ? "bg-rose-950/20 hover:bg-rose-950/30 border-rose-800/40 text-rose-200"
                      : "bg-[#0F1210] hover:bg-[#1A201D] border-[rgba(244,240,232,0.08)] text-[#F4F0E8]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs truncate group-hover:text-[#C47B50]">
                        {floor.floor_label || `Floor ${floor.floor_code}`}
                      </span>
                      {floor.is_unsanctioned && (
                        <span className="px-1.5 py-0.2 rounded-[4px] bg-rose-900/80 text-rose-300 text-[9px] font-mono font-bold shrink-0">
                          UNSANCTIONED
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#77867C] font-mono block mt-0.5">
                      {floor.floor_code} • {floor.base_elevation}m – {floor.ceiling_elevation}m MSL
                      ({floor.floor_area_sqm}m²)
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#6F7772] group-hover:text-[#C47B50] transition-colors shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)] text-[11px] text-[#77867C] font-mono">
              Floor slabs not yet extracted for this building.
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
            currentLevel="BUILDING"
            onSelectLevel={onSelectLevel}
          />
        </InspectorSection>

        {/* Section 4: Phase 8 Contextual Intelligence */}
        <ContextualIntelligenceSection
          selection={selection}
          conflicts={conflicts}
          evidence={evidence}
          provenance={provenance}
          confidence={confidence}
          infrastructure={infrastructure}
          intelligenceSummary={intelligenceSummary}
          activeConflict={activeConflict}
          onSelectConflict={onSelectConflict}
          onMeasureConflict={onMeasureConflict}
          onOpenAIWithQuery={onOpenAIWithQuery}
        />
      </div>

      <InspectorActionBar
        primaryAction={{
          label: "FOCUS BUILDING",
          icon: <Building2 className="w-4 h-4" />,
          onClick: () => onFocusEntity?.(selection.entityId),
        }}
        secondaryActions={[
          {
            id: "isolate-building",
            label: isolateBuilding ? "Show All Context" : "Isolate Building",
            icon: <Maximize2 className="w-3.5 h-3.5" />,
            active: isolateBuilding,
            onClick: () => onToggleIsolateBuilding?.(),
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
