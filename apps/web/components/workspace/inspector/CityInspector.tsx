"use client";

import React from "react";
import { Globe2, Building2, MapPin, ArrowUpRight, Compass, ShieldCheck } from "lucide-react";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import { InspectorHeader } from "./InspectorHeader";
import { InspectorSection } from "./InspectorSection";
import { InspectorStat } from "./InspectorStat";
import { InspectorRelationship } from "./InspectorRelationship";
import { InspectorActionBar } from "./InspectorActionBar";
import { SpatialHierarchyTreeResponse } from "@/types/property";

interface CityInspectorProps {
  selection: ActiveSpatialSelection;
  treeData?: SpatialHierarchyTreeResponse | null;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  onFocusEntity?: (id: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
  onOpenAI?: () => void;
}

export const CityInspector: React.FC<CityInspectorProps> = ({
  selection,
  treeData,
  onSelectLevel,
  onFocusEntity,
  onClose,
  onMinimize,
  onOpenAI,
}) => {
  const meta = selection.metadata || {};
  const parcels = treeData?.city?.regions?.flatMap((r) => r.parcels) || [];
  const allBuildings = parcels.flatMap((p) => p.buildings) || [];

  return (
    <>
      <InspectorHeader
        entityType="CITY"
        title={selection.title}
        subtitle={selection.subtitle}
        code="BLR-BBMP-2026"
        source={selection.source}
        verificationState={selection.verificationState}
        confidence={selection.confidence}
        onClose={onClose}
        onMinimize={onMinimize}
      />

      <div className="overflow-y-auto flex-1 p-0 divide-y divide-[rgba(244,240,232,0.06)]">
        {/* Section 1: City Cadastral Aggregate KPIs */}
        <InspectorSection title="Macro Cadastral Inventory" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <InspectorStat
              label="Cadastral Parcels"
              value={meta.total_parcels ?? 3}
              badge="POSTGIS"
              badgeType="authoritative"
              subtext="100% Survey Verified"
            />
            <InspectorStat
              label="3D Building Twins"
              value={meta.total_buildings ?? 3}
              badge="LOD2"
              badgeType="computed"
              subtext="Volumetric Extrusions"
            />
            <InspectorStat
              label="Vertical Slabs"
              value={meta.total_floors ?? 4}
              subtext="Multi-Level Stratas"
            />
            <InspectorStat
              label="Strata Units"
              value={meta.total_units ?? 4}
              subtext="Individual Properties"
            />
          </div>
        </InspectorSection>

        {/* Section 2: Primary Buildings in Zone */}
        <InspectorSection
          title="Featured Buildings"
          badge={allBuildings.length}
          icon={<Building2 className="w-3.5 h-3.5 text-brand-secondary" />}
          defaultOpen={true}
        >
          <div className="space-y-1.5">
            {allBuildings.map((bld) => (
              <button
                key={bld.id}
                onClick={() => onSelectLevel("BUILDING", bld.id)}
                className="w-full p-2.5 rounded-[10px] bg-[#1A201D] hover:bg-[#222A26] border border-[rgba(244,240,232,0.08)] flex items-center justify-between text-left transition-all group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[#F4F0E8] block truncate group-hover:text-brand-secondary">
                      {bld.name}
                    </span>
                    {bld.has_discrepancy && (
                      <span className="px-1.5 py-0.2 rounded-[6px] bg-rose-900/80 text-rose-300 text-[9px] font-mono font-bold shrink-0">
                        VARIANCE
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#A2B3A8] font-mono block mt-0.5">
                    {bld.building_code} • {bld.detected_floors} Floors ({bld.building_height}m)
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#77867C] group-hover:text-brand-secondary transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </InspectorSection>
      </div>

      <InspectorActionBar
        primaryAction={{
          label: "INSPECT PRIMARY COMPLEX",
          icon: <Building2 className="w-4 h-4" />,
          onClick: () => {
            if (allBuildings.length) onSelectLevel("BUILDING", allBuildings[0].id);
          },
        }}
        onOpenAI={onOpenAI}
      />
    </>
  );
};
