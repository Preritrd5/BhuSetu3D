"use client";

import React, { useState } from "react";
import { InspectorShell } from "./InspectorShell";
import { ParcelInspector } from "./ParcelInspector";
import { BuildingInspector } from "./BuildingInspector";
import { FloorInspector } from "./FloorInspector";
import { UnitInspector } from "./UnitInspector";
import { RoomInspector } from "./RoomInspector";
import { HallInspector } from "./HallInspector";
import { CorridorInspector } from "./CorridorInspector";
import { DoorInspector } from "./DoorInspector";
import { WindowInspector } from "./WindowInspector";
import { InfrastructureInspector } from "./InfrastructureInspector";
import { CityInspector } from "./CityInspector";
import { ConflictInspector } from "./ConflictInspector";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import {
  ParcelHierarchyNode,
  BuildingHierarchyNode,
  FloorHierarchyNode,
  UnitHierarchyNode,
  SpatialElementNode,
  SpatialHierarchyTreeResponse,
} from "@/types/property";
import {
  ConflictItem,
  PropertyEvidenceResponse,
  ProvenanceChainResponse,
  ConfidenceBreakdownResponse,
  NearbyInfrastructureResponse,
  EntityIntelligenceSummary,
} from "@/types/intelligence";

export interface ContextualInspectorProps {
  selection: ActiveSpatialSelection;
  activeParcel: ParcelHierarchyNode | null;
  activeBuilding: BuildingHierarchyNode | null;
  activeFloor: FloorHierarchyNode | null;
  activeUnit: UnitHierarchyNode | null;
  activeRoom: SpatialElementNode | null;
  activeElement: SpatialElementNode | null;
  treeData?: SpatialHierarchyTreeResponse | null;
  isolateBuilding?: boolean;
  isolateFloor?: boolean;
  explodeFloors?: boolean;
  onToggleIsolateBuilding?: () => void;
  onToggleIsolateFloor?: (isolate: boolean) => void;
  onToggleExplodeFloors?: () => void;
  onClose: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  onFocusEntity?: (id: string) => void;
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

const ContextualInspectorComponent: React.FC<ContextualInspectorProps> = ({
  selection,
  activeParcel,
  activeBuilding,
  activeFloor,
  activeUnit,
  activeRoom,
  activeElement,
  treeData,
  isolateBuilding = false,
  isolateFloor = false,
  explodeFloors = false,
  onToggleIsolateBuilding,
  onToggleIsolateFloor,
  onToggleExplodeFloors,
  onClose,
  onMinimize,
  isMinimized = false,
  onSelectLevel,
  onFocusEntity,
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
  const renderContent = () => {
    if (activeConflict) {
      return (
        <ConflictInspector
          conflict={activeConflict}
          onFocusEntity={onFocusEntity}
          onMeasureConflict={onMeasureConflict}
          onClose={onClose}
          onMinimize={onMinimize}
          onOpenAI={onOpenAI}
        />
      );
    }

    switch (selection.entityType) {
      case "PARCEL":
        return (
          <ParcelInspector
            selection={selection}
            parcelNode={activeParcel}
            onSelectLevel={onSelectLevel}
            onFocusEntity={onFocusEntity}
            onClose={onClose}
            onMinimize={onMinimize}
            onOpenAI={onOpenAI}
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
        );

      case "BUILDING":
        return (
          <BuildingInspector
            selection={selection}
            buildingNode={activeBuilding}
            isolateBuilding={isolateBuilding}
            explodeFloors={explodeFloors}
            onToggleIsolateBuilding={onToggleIsolateBuilding}
            onToggleExplodeFloors={onToggleExplodeFloors}
            onSelectLevel={onSelectLevel}
            onFocusEntity={onFocusEntity}
            onClose={onClose}
            onMinimize={onMinimize}
            onOpenAI={onOpenAI}
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
        );

      case "FLOOR":
        return (
          <FloorInspector
            selection={selection}
            floorNode={activeFloor}
            isolateFloor={isolateFloor}
            explodeFloors={explodeFloors}
            onToggleIsolateFloor={onToggleIsolateFloor || (() => {})}
            onToggleExplodeFloors={onToggleExplodeFloors}
            onSelectLevel={onSelectLevel}
            onFocusEntity={onFocusEntity}
            onClose={onClose}
            onMinimize={onMinimize}
            onOpenAI={onOpenAI}
          />
        );

      case "UNIT":
        return (
          <UnitInspector
            selection={selection}
            unitNode={activeUnit}
            onSelectLevel={onSelectLevel}
            onFocusEntity={onFocusEntity}
            onClose={onClose}
            onMinimize={onMinimize}
            onOpenAI={onOpenAI}
          />
        );

      case "HALL":
        return (
          <HallInspector
            selection={selection}
            hallNode={activeRoom}
            onSelectLevel={onSelectLevel}
            onFocusEntity={onFocusEntity}
            onClose={onClose}
            onMinimize={onMinimize}
            onOpenAI={onOpenAI}
          />
        );

      case "CORRIDOR":
        return (
          <CorridorInspector
            selection={selection}
            corridorNode={activeElement}
            onSelectLevel={onSelectLevel}
            onFocusEntity={onFocusEntity}
            onClose={onClose}
            onMinimize={onMinimize}
            onOpenAI={onOpenAI}
          />
        );

      case "DOOR":
        return (
          <DoorInspector
            selection={selection}
            doorNode={activeElement}
            onSelectLevel={onSelectLevel}
            onFocusEntity={onFocusEntity}
            onClose={onClose}
            onMinimize={onMinimize}
            onOpenAI={onOpenAI}
          />
        );

      case "WINDOW":
        return (
          <WindowInspector
            selection={selection}
            windowNode={activeElement}
            onSelectLevel={onSelectLevel}
            onFocusEntity={onFocusEntity}
            onClose={onClose}
            onMinimize={onMinimize}
            onOpenAI={onOpenAI}
          />
        );

      case "INFRASTRUCTURE":
        return (
          <InfrastructureInspector
            selection={selection}
            onSelectLevel={onSelectLevel}
            onFocusEntity={onFocusEntity}
            onClose={onClose}
            onMinimize={onMinimize}
            onOpenAI={onOpenAI}
          />
        );

      case "ROOM":
      case "ELEMENT":
        return (
          <RoomInspector
            selection={selection}
            roomNode={activeRoom}
            onSelectLevel={onSelectLevel}
            onFocusEntity={onFocusEntity}
            onClose={onClose}
            onMinimize={onMinimize}
            onOpenAI={onOpenAI}
          />
        );

      case "CITY":
      case "REGION":
      default:
        return (
          <CityInspector
            selection={selection}
            treeData={treeData}
            onSelectLevel={onSelectLevel}
            onFocusEntity={onFocusEntity}
            onClose={onClose}
            onMinimize={onMinimize}
            onOpenAI={onOpenAI}
          />
        );
    }
  };

  return (
    <InspectorShell
      onClose={onClose}
      onMinimize={onMinimize}
      isMinimized={isMinimized}
    >
      {renderContent()}
    </InspectorShell>
  );
};

export const ContextualInspector = React.memo(ContextualInspectorComponent);
