"use client";

import React from "react";
import { SpatialLevel } from "./WorkspaceBreadcrumb";
import {
  SpatialHierarchyTreeResponse,
  ParcelHierarchyNode,
  BuildingHierarchyNode,
  FloorHierarchyNode,
  UnitHierarchyNode,
  SpatialElementNode,
} from "@/types/property";
import { useSpatialSelection } from "@/hooks/useSpatialSelection";
import { useSpatialIntelligence } from "@/hooks/useSpatialIntelligence";
import { ContextualInspector } from "./inspector/ContextualInspector";
import { ConflictItem } from "@/types/intelligence";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialErrorBoundary } from "../common/SpatialErrorBoundary";

export interface RightContextualPanelProps {
  currentLevel: SpatialLevel;
  selectedParcelId: string | null;
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  selectedUnitId?: string | null;
  selectedRoomId: string | null;
  selectedElementId: string | null;
  selectedInfrastructureId?: string | null;
  treeData?: SpatialHierarchyTreeResponse | null;
  isolateFloor: boolean;
  isolateBuilding?: boolean;
  explodeFloors?: boolean;
  onToggleIsolateFloor: (isolate: boolean) => void;
  onToggleIsolateBuilding?: () => void;
  onToggleExplodeFloors?: () => void;
  onClose: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  onFocusEntity?: (entityId: string) => void;
  onOpenAI?: () => void;
  onMeasureConflict?: (conflict: ConflictItem) => void;
  onOpenAIWithQuery?: (prompt: string) => void;
  precomputedSelection?: {
    selection: ActiveSpatialSelection;
    activeParcel: ParcelHierarchyNode | null;
    activeBuilding: BuildingHierarchyNode | null;
    activeFloor: FloorHierarchyNode | null;
    activeUnit: UnitHierarchyNode | null;
    activeRoom: SpatialElementNode | null;
    activeElement: SpatialElementNode | null;
  };
}

const RightContextualPanelComponent: React.FC<RightContextualPanelProps> = ({
  currentLevel,
  selectedParcelId,
  selectedBuildingId,
  selectedFloorId,
  selectedUnitId,
  selectedRoomId,
  selectedElementId,
  selectedInfrastructureId,
  treeData,
  isolateFloor,
  isolateBuilding = false,
  explodeFloors = false,
  onToggleIsolateFloor,
  onToggleIsolateBuilding,
  onToggleExplodeFloors,
  onClose,
  onMinimize,
  isMinimized = false,
  onSelectLevel,
  onFocusEntity,
  onOpenAI,
  onMeasureConflict,
  onOpenAIWithQuery,
  precomputedSelection,
}) => {
  // Use precomputed selection if provided to eliminate duplicate hook computation;
  // otherwise fallback to computing from local state.
  const hookSelection = useSpatialSelection({
    treeData: treeData || null,
    currentLevel,
    selectedParcelId,
    selectedBuildingId,
    selectedFloorId,
    selectedUnitId,
    selectedRoomId,
    selectedElementId,
    selectedInfrastructureId,
    isolateBuilding,
    isolateFloor,
    explodeFloors,
  });

  const activeSelectionBundle = precomputedSelection || hookSelection;
  const {
    selection,
    activeParcel,
    activeBuilding,
    activeFloor,
    activeUnit,
    activeRoom,
    activeElement,
  } = activeSelectionBundle;

  // Single source of spatial context intelligence with LRU caching
  const {
    conflicts,
    evidence,
    provenance,
    confidence,
    infrastructure,
    intelligenceSummary,
    activeConflict,
    setActiveConflict,
  } = useSpatialIntelligence(selection);

  return (
    <SpatialErrorBoundary
      fallbackTitle="Inspector Module Error"
      fallbackMessage="Property inspection details could not be loaded. Please reselect or retry."
      onReset={onClose}
    >
      <ContextualInspector
        selection={selection}
        activeParcel={activeParcel}
        activeBuilding={activeBuilding}
        activeFloor={activeFloor}
        activeUnit={activeUnit}
        activeRoom={activeRoom}
        activeElement={activeElement}
        treeData={treeData}
        isolateBuilding={isolateBuilding}
        isolateFloor={isolateFloor}
        explodeFloors={explodeFloors}
        onToggleIsolateBuilding={onToggleIsolateBuilding}
        onToggleIsolateFloor={onToggleIsolateFloor}
        onToggleExplodeFloors={onToggleExplodeFloors}
        onClose={onClose}
        onMinimize={onMinimize}
        isMinimized={isMinimized}
        onSelectLevel={onSelectLevel}
        onFocusEntity={onFocusEntity}
        onOpenAI={onOpenAI}
        conflicts={conflicts}
        evidence={evidence}
        provenance={provenance}
        confidence={confidence}
        infrastructure={infrastructure}
        intelligenceSummary={intelligenceSummary}
        activeConflict={activeConflict}
        onSelectConflict={setActiveConflict}
        onMeasureConflict={onMeasureConflict}
        onOpenAIWithQuery={onOpenAIWithQuery}
      />
    </SpatialErrorBoundary>
  );
};

export const RightContextualPanel = React.memo(RightContextualPanelComponent);
