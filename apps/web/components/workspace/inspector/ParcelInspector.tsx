"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Building2, Ruler, ArrowUpRight, Compass, ShieldCheck } from "lucide-react";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import { InspectorHeader } from "./InspectorHeader";
import { InspectorSection } from "./InspectorSection";
import { InspectorStat } from "./InspectorStat";
import { InspectorRelationship } from "./InspectorRelationship";
import { InspectorActionBar } from "./InspectorActionBar";
import { ParcelHierarchyNode } from "@/types/property";
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

interface ParcelInspectorProps {
  selection: ActiveSpatialSelection;
  parcelNode: ParcelHierarchyNode | null;
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

export const ParcelInspector: React.FC<ParcelInspectorProps> = ({
  selection,
  parcelNode,
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
  const buildings = parcelNode?.buildings || [];

  return (
    <>
      <InspectorHeader
        entityType="PARCEL"
        title={selection.title}
        subtitle={selection.subtitle}
        code={meta.ulpin_2d}
        source={selection.source}
        verificationState={selection.verificationState}
        confidence={selection.confidence}
        onClose={onClose}
        onMinimize={onMinimize}
      />

      <div className="overflow-y-auto flex-1 p-0 divide-y divide-[rgba(244,240,232,0.06)]">
        {/* Section 1: Cadastral Land Facts */}
        <InspectorSection title="Cadastral Facts" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <InspectorStat
              label="Legal Recorded Area"
              value={meta.recorded_area_sqm ?? 520}
              unit="m²"
              badge="LEGAL"
              badgeType="authoritative"
              subtext="Revenue Survey Registry"
            />
            <InspectorStat
              label="Computed Spatial Area"
              value={meta.computed_area_sqm ?? 520}
              unit="m²"
              badge="COMPUTED"
              badgeType="computed"
              subtext="PostGIS Polygon EPSG:4326"
            />
            <InspectorStat
              label="Zoning Classification"
              value={meta.land_use || "COMMERCIAL_MIXED"}
              subtext="BhuSetu Master Plan 2031"
            />
            <InspectorStat
              label="Base Elevation"
              value={meta.elevation_base ?? 920.0}
              unit="m MSL"
              subtext="Survey of India Datum"
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
            entityType="PARCEL"
            entityId={meta.ulpin_2d || parcelNode?.id || selection.entityId}
            onSelectProperty={(type, id) => onSelectLevel(type, id)}
          />
        </InspectorSection>

        {/* Section 2: Buildings on Parcel */}
        <InspectorSection
          title="Buildings On Parcel"
          badge={buildings.length}
          icon={<Building2 className="w-3.5 h-3.5 text-[#23847D]" />}
          defaultOpen={true}
        >
          {buildings.length > 0 ? (
            <div className="space-y-1.5">
              {buildings.map((bld) => (
                <button
                  key={bld.id}
                  onClick={() => onSelectLevel("BUILDING", bld.id)}
                  className="w-full p-2.5 rounded-[8px] bg-[#0F1210] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] flex items-center justify-between text-left transition-all group"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-[#F4F0E8] block truncate group-hover:text-[#C47B50]">
                      {bld.name}
                    </span>
                    <span className="text-[11px] text-[#A7B3AB] font-mono block">
                      {bld.building_code} • {bld.detected_floors} Floors ({bld.building_height}m)
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#6F7772] group-hover:text-[#C47B50] transition-colors shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)] text-[11px] text-[#77867C] font-mono">
              No buildings registered on this parcel.
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
            currentLevel="PARCEL"
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
          label: "FOCUS PARCEL",
          icon: <MapPin className="w-4 h-4" />,
          onClick: () => onFocusEntity?.(selection.entityId),
        }}
        secondaryActions={[
          {
            id: "inspect-buildings",
            label: "Inspect Building",
            icon: <Building2 className="w-3.5 h-3.5" />,
            onClick: () => {
              if (buildings.length) onSelectLevel("BUILDING", buildings[0].id);
            },
          },
          {
            id: "open-2d",
            label: "2D Cadastre",
            icon: <ArrowUpRight className="w-3.5 h-3.5" />,
            onClick: () => {
              if (typeof window !== "undefined") {
                window.location.href = `/cadastre?parcel=${selection.entityId}`;
              }
            },
          },
        ]}
        onOpenAI={onOpenAI}
      />
    </>
  );
};
