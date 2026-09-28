/**
 * BhuSetu 3D Spatial Selection Hook
 * Single Source of Truth for Contextual Inspectors & 3D Synchronization
 */
import { useMemo } from "react";
import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import {
  SpatialHierarchyTreeResponse,
  ParcelHierarchyNode,
  BuildingHierarchyNode,
  FloorHierarchyNode,
  UnitHierarchyNode,
  SpatialElementNode,
} from "@/types/property";
import {
  ActiveSpatialSelection,
  HierarchyPathNode,
  TrustSource,
  VerificationState,
} from "@/types/selection";

import { getUrbanBuildingById, getUrbanParcelById } from "@/lib/cesium";

export interface UseSpatialSelectionProps {
  treeData: SpatialHierarchyTreeResponse | null;
  currentLevel: SpatialLevel;
  selectedParcelId: string | null;
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  selectedUnitId?: string | null;
  selectedRoomId: string | null;
  selectedElementId: string | null;
  selectedInfrastructureId?: string | null;
  isolateBuilding?: boolean;
  isolateFloor?: boolean;
  explodeFloors?: boolean;
}

export function useSpatialSelection({
  treeData,
  currentLevel,
  selectedParcelId,
  selectedBuildingId,
  selectedFloorId,
  selectedUnitId,
  selectedRoomId,
  selectedElementId,
  selectedInfrastructureId,
  isolateBuilding = false,
  isolateFloor = false,
  explodeFloors = false,
}: UseSpatialSelectionProps): {
  selection: ActiveSpatialSelection;
  activeParcel: ParcelHierarchyNode | null;
  activeBuilding: BuildingHierarchyNode | null;
  activeFloor: FloorHierarchyNode | null;
  activeUnit: UnitHierarchyNode | null;
  activeRoom: SpatialElementNode | null;
  activeElement: SpatialElementNode | null;
} {
  const city = treeData?.city || null;
  const region = city?.regions?.[0] || null;
  const parcels = useMemo(() => region?.parcels || [], [region]);
  const allBuildings = useMemo(() => parcels.flatMap((p) => p.buildings) || [], [parcels]);

  // 1. Resolve Active Parcel
  const activeParcel = useMemo<ParcelHierarchyNode | null>(() => {
    if (selectedParcelId) {
      const pclMeta = getUrbanParcelById(selectedParcelId);
      const match = parcels.find(
        (p) =>
          p.id === selectedParcelId ||
          p.ulpin_2d === selectedParcelId ||
          p.survey_number === selectedParcelId ||
          (pclMeta && (p.ulpin_2d === pclMeta.ulpin || p.id === pclMeta.legacyId))
      );
      if (match) return match;
    }
    if (selectedBuildingId) {
      const bldMeta = getUrbanBuildingById(selectedBuildingId);
      const parent = parcels.find(
        (p) =>
          p.buildings?.some(
            (b) =>
              b.id === selectedBuildingId ||
              b.building_code === selectedBuildingId ||
              (bldMeta && (b.building_code === bldMeta.code || b.id === bldMeta.legacyId))
          ) ||
          (bldMeta && (p.id === bldMeta.parcelId || p.id === bldMeta.legacyParcelId))
      );
      if (parent) return parent;
    }
    return parcels[0] || null;
  }, [parcels, selectedParcelId, selectedBuildingId]);

  // 2. Resolve Active Building
  const activeBuilding = useMemo<BuildingHierarchyNode | null>(() => {
    if (selectedBuildingId) {
      const bldMeta = getUrbanBuildingById(selectedBuildingId);
      const match = allBuildings.find(
        (b) =>
          b.id === selectedBuildingId ||
          b.building_code === selectedBuildingId ||
          (bldMeta && (b.building_code === bldMeta.code || b.id === bldMeta.legacyId))
      );
      if (match) return match;
    }
    if (activeParcel?.buildings?.length) {
      return activeParcel.buildings[0];
    }
    return (
      allBuildings.find((b) => b.id === "77777777-7777-4000-8000-000000000102") ||
      allBuildings[0] ||
      null
    );
  }, [allBuildings, activeParcel, selectedBuildingId]);

  // 3. Resolve Active Floor
  const activeFloor = useMemo<FloorHierarchyNode | null>(() => {
    if (!activeBuilding?.floors?.length) return null;
    if (selectedFloorId) {
      const match = activeBuilding.floors.find(
        (f) => f.floor_code === selectedFloorId || f.id === selectedFloorId
      );
      if (match) return match;
    }
    return (
      activeBuilding.floors.find((f) => f.floor_code === "FL-03" || f.floor_code === "floor-3") ||
      activeBuilding.floors[0] ||
      null
    );
  }, [activeBuilding, selectedFloorId]);

  // 4. Resolve Active Unit
  const activeUnit = useMemo<UnitHierarchyNode | null>(() => {
    const units = activeFloor?.units?.length
      ? activeFloor.units
      : activeBuilding?.floors?.flatMap((f) => f.units) || [];
    if (!units.length) return null;
    if (selectedUnitId) {
      const match = units.find((u) => u.id === selectedUnitId || u.unit_number === selectedUnitId);
      if (match) return match;
    }
    if (selectedRoomId) {
      const match = units.find((u) => u.spatial_elements?.some((e) => e.id === selectedRoomId));
      if (match) return match;
    }
    return (
      units.find((u) => u.unit_number === "301" || u.unit_number === "unit-302") ||
      units[0] ||
      null
    );
  }, [activeFloor, activeBuilding, selectedUnitId, selectedRoomId]);

  // 5. Resolve Active Room / Hall
  const activeRoom = useMemo<SpatialElementNode | null>(() => {
    const elements = activeUnit?.spatial_elements || [];
    if (!elements.length) return null;
    if (selectedRoomId) {
      const match = elements.find((e) => e.id === selectedRoomId);
      if (match) return match;
    }
    return elements.find((e) => e.id === "room-302") || elements[0] || null;
  }, [activeUnit, selectedRoomId]);

  // 6. Resolve Active Element (Door, Window, etc.)
  const activeElement = useMemo<SpatialElementNode | null>(() => {
    const elements = activeRoom?.elements || activeUnit?.spatial_elements || [];
    if (!elements.length) return null;
    if (selectedElementId) {
      const match = elements.find((e) => e.id === selectedElementId);
      if (match) return match;
    }
    return elements[0] || null;
  }, [activeRoom, activeUnit, selectedElementId]);

  // Construct Canonical ActiveSpatialSelection
  const selection = useMemo<ActiveSpatialSelection>(() => {
    const hierarchyPath: HierarchyPathNode[] = [];
    if (city) {
      hierarchyPath.push({ level: "CITY", id: city.id, name: city.name, code: city.code });
    }
    if (region) {
      hierarchyPath.push({ level: "REGION", id: region.id, name: region.name, code: region.code });
    }
    if (activeParcel) {
      hierarchyPath.push({
        level: "PARCEL",
        id: activeParcel.id,
        name: `Parcel ${activeParcel.survey_number}`,
        code: activeParcel.ulpin_2d,
      });
    }
    if (activeBuilding) {
      hierarchyPath.push({
        level: "BUILDING",
        id: activeBuilding.id,
        name: activeBuilding.name,
        code: activeBuilding.building_code,
      });
    }
    if (activeFloor) {
      hierarchyPath.push({
        level: "FLOOR",
        id: activeFloor.id,
        name: activeFloor.floor_label || `Floor ${activeFloor.floor_code}`,
        code: activeFloor.floor_code,
      });
    }
    if (activeUnit) {
      hierarchyPath.push({
        level: "UNIT",
        id: activeUnit.id,
        name: activeUnit.unit_label || `Unit ${activeUnit.unit_number}`,
        code: activeUnit.ulpin_3d,
      });
    }
    if (activeRoom && (currentLevel === "ROOM" || currentLevel === "HALL" || currentLevel === "CORRIDOR" || currentLevel === "ELEMENT" || currentLevel === "DOOR" || currentLevel === "WINDOW")) {
      hierarchyPath.push({
        level: "ROOM",
        id: activeRoom.id,
        name: activeRoom.name,
        code: activeRoom.id,
      });
    }
    if (activeElement && (currentLevel === "ELEMENT" || currentLevel === "DOOR" || currentLevel === "WINDOW")) {
      hierarchyPath.push({
        level: currentLevel,
        id: activeElement.id,
        name: activeElement.name,
        code: activeElement.id,
      });
    }

    const inspectionMode = { isolateBuilding, isolateFloor, explodeFloors };

    // Branch selection properties per currentLevel
    switch (currentLevel) {
      case "INFRASTRUCTURE": {
        const isStormDrain = selectedInfrastructureId === "SWD-MALL-04" || !selectedInfrastructureId;
        return {
          entityType: "INFRASTRUCTURE",
          entityId: selectedInfrastructureId || "SWD-MALL-04",
          title: isStormDrain ? "Stormwater Drainage Main SWD-MALL-04" : "11kV Subterranean Power BESCOM-F-08",
          subtitle: isStormDrain ? "Municipal Storm Drain Trunk" : "Electrical Feeder Corridor",
          code: selectedInfrastructureId || "SWD-MALL-04",
          hierarchyPath: [
            { level: "CITY", id: city?.id || "blr", name: city?.name || "Bengaluru", code: "BLR" },
            { level: "REGION", id: region?.id || "w101", name: region?.name || "Malleshwaram", code: "W-101" },
            { level: "INFRASTRUCTURE", id: selectedInfrastructureId || "SWD-MALL-04", name: isStormDrain ? "SWD-MALL-04" : "BESCOM-F-08" },
          ],
          geometryReference: "PostGIS LineString3D (depth: -1.8m)",
          source: "AUTHORITATIVE",
          confidence: 0.99,
          verificationState: "REVIEW_REQUIRED", // Intersects setback buffer
          selectionState: "SELECTED",
          cameraTarget: selectedInfrastructureId || "SWD-MALL-04",
          inspectionMode,
          metadata: {
            utility_category: isStormDrain ? "STORMWATER" : "ELECTRICAL",
            is_subsurface: true,
            depth_meters: isStormDrain ? 1.8 : 2.4,
            mandated_buffer_m: 5.0,
            observed_buffer_m: 3.2,
            buffer_conflict: true,
            evidence_source_type: "MUNICIPAL_UTILITY_SURVEY",
          },
        };
      }

      case "DOOR":
      case "WINDOW":
      case "ELEMENT": {
        const isDoor = currentLevel === "DOOR" || activeElement?.type === "DOOR";
        const isWindow = currentLevel === "WINDOW" || activeElement?.type === "WINDOW";
        return {
          entityType: isDoor ? "DOOR" : isWindow ? "WINDOW" : "ELEMENT",
          entityId: activeElement?.id || (isDoor ? "door-302" : "window-302"),
          parentId: activeRoom?.id || activeUnit?.id || null,
          parentType: activeRoom ? "ROOM" : "UNIT",
          title: activeElement?.name || (isDoor ? "Door D-302-A (Egress Door)" : "Window W-302-1 (Facade Glazing)"),
          subtitle: isDoor ? "FD-60 Fire Barrier Door" : "Low-E Double Glazed Unit",
          code: activeElement?.id || (isDoor ? "door-302" : "window-302"),
          hierarchyPath,
          geometryReference: "BIM IFC Element LoD400",
          source: "DERIVED",
          confidence: 0.96,
          verificationState: "VERIFIED",
          selectionState: "SELECTED",
          cameraTarget: activeElement?.id,
          inspectionMode,
          metadata: {
            dimensions: activeElement?.dimensions || (isDoor ? "1.1m x 2.4m" : "2.2m x 1.6m"),
            material: activeElement?.material || (isDoor ? "Solid Core Timber with Steel Frame" : "Low-E Tinted Double Glazing"),
            fire_rating: activeElement?.fire_rating || (isDoor ? "FD-60" : "Unrated"),
            glazing: activeElement?.glazing || (isWindow ? "Low-E Reflective" : undefined),
          },
          rawNode: activeElement,
        };
      }

      case "CORRIDOR": {
        const corridor = activeUnit?.spatial_elements?.find((e) => e.type === "CORRIDOR") || null;
        return {
          entityType: "CORRIDOR",
          entityId: corridor?.id || "corridor-3",
          parentId: activeFloor?.id || null,
          parentType: "FLOOR",
          title: corridor?.name || "Central Circulation Corridor",
          subtitle: "Floor 03 Egress & Access Hallway",
          code: corridor?.id || "corridor-3",
          hierarchyPath,
          geometryReference: "LoD3 Interior Space Polygon",
          source: "DERIVED",
          confidence: 0.97,
          verificationState: "VERIFIED",
          selectionState: "SELECTED",
          cameraTarget: corridor?.id || "corridor-3",
          inspectionMode,
          metadata: {
            area_sqm: corridor?.area_sqm || 36.4,
            dimensions: corridor?.dimensions || "14.0m x 2.6m",
            material: corridor?.material || "Terrazzo Floor / LED Recessed",
            clear_width_m: 2.6,
            life_safety_compliant: true,
          },
          rawNode: corridor,
        };
      }

      case "HALL":
      case "ROOM": {
        const isHall = currentLevel === "HALL" || activeRoom?.name.toLowerCase().includes("hall");
        return {
          entityType: isHall ? "HALL" : "ROOM",
          entityId: activeRoom?.id || "room-302",
          parentId: activeUnit?.id || null,
          parentType: "UNIT",
          title: activeRoom?.name || (isHall ? "Room 301 (Conference Hall)" : "Room 302 (Executive Suite)"),
          subtitle: isHall ? "Assembly / Large Meeting Space" : "Executive Workspace",
          code: activeRoom?.id || (isHall ? "room-301" : "room-302"),
          hierarchyPath,
          geometryReference: "LoD3 Interior Room Prism",
          source: "DERIVED",
          confidence: 0.95,
          verificationState: "VERIFIED",
          selectionState: "SELECTED",
          cameraTarget: activeRoom?.id,
          inspectionMode,
          metadata: {
            area_sqm: activeRoom?.area_sqm || (isHall ? 32.5 : 24.8),
            dimensions: activeRoom?.dimensions || (isHall ? "6.5m x 5.0m" : "5.2m x 4.8m"),
            material: activeRoom?.material || (isHall ? "Acoustic Timber Paneling" : "Double Glazed Partition"),
            child_elements_count: activeRoom?.elements?.length || 2,
          },
          rawNode: activeRoom,
        };
      }

      case "UNIT": {
        return {
          entityType: "UNIT",
          entityId: activeUnit?.id || "unit-301",
          parentId: activeFloor?.id || null,
          parentType: "FLOOR",
          title: activeUnit?.unit_label || `Unit ${activeUnit?.unit_number || "301"}`,
          subtitle: activeUnit?.ulpin_3d || "KA-BLR-2026-P102-B1-F3-U04",
          code: activeUnit?.unit_number || "301",
          hierarchyPath,
          geometryReference: "PostGIS 3D Strata Unit Polygon",
          source: "AUTHORITATIVE",
          confidence: 0.94,
          verificationState: (activeUnit?.verification_status === "VERIFIED" ? "VERIFIED" : "REVIEW_REQUIRED") as VerificationState,
          selectionState: "SELECTED",
          cameraTarget: activeUnit?.id,
          inspectionMode,
          metadata: {
            unit_number: activeUnit?.unit_number || "301",
            unit_type: activeUnit?.unit_type || "COMMERCIAL_OFFICE",
            carpet_area_sqm: activeUnit?.carpet_area_sqm || 190.0,
            built_up_area_sqm: activeUnit?.built_up_area_sqm || 225.0,
            status_3d: activeUnit?.status_3d || "AVAILABLE",
            rooms_count: activeUnit?.spatial_elements?.length || 3,
          },
          rawNode: activeUnit,
        };
      }

      case "FLOOR": {
        return {
          entityType: "FLOOR",
          entityId: activeFloor?.id || "FL-03",
          parentId: activeBuilding?.id || null,
          parentType: "BUILDING",
          title: activeFloor?.floor_label || `Floor ${activeFloor?.floor_code || "FL-03"}`,
          subtitle: activeFloor?.is_unsanctioned
            ? "Unsanctioned Vertical Addition (+3.0m Violation)"
            : `Floor Slab #${activeFloor?.floor_number ?? 3}`,
          code: activeFloor?.floor_code || "FL-03",
          hierarchyPath,
          geometryReference: "PostGIS 3D Slab Prism",
          source: "DERIVED",
          confidence: 0.98,
          verificationState: activeFloor?.is_unsanctioned ? "DISCREPANCY_DETECTED" : "VERIFIED",
          selectionState: "SELECTED",
          cameraTarget: activeFloor?.id,
          inspectionMode,
          metadata: {
            floor_code: activeFloor?.floor_code || "FL-03",
            floor_number: activeFloor?.floor_number ?? 3,
            base_elevation: activeFloor?.base_elevation ?? 931.0,
            ceiling_elevation: activeFloor?.ceiling_elevation ?? 935.0,
            floor_height: activeFloor?.floor_height ?? 4.0,
            floor_area_sqm: activeFloor?.floor_area_sqm ?? 240.0,
            is_unsanctioned: Boolean(activeFloor?.is_unsanctioned),
            units_count: activeFloor?.units?.length || 1,
          },
          rawNode: activeFloor,
        };
      }

      case "BUILDING": {
        return {
          entityType: "BUILDING",
          entityId: activeBuilding?.id || "BLD-KA-BLR-102",
          parentId: activeParcel?.id || null,
          parentType: "PARCEL",
          title: activeBuilding?.name || "Aura Horizon Commercial Complex",
          subtitle: activeBuilding?.building_code || "BLD-KA-BLR-102",
          code: activeBuilding?.building_code || "BLD-KA-BLR-102",
          hierarchyPath,
          geometryReference: "LoD2 Volumetric Extrusion",
          source: "AUTHORITATIVE",
          confidence: 0.99,
          verificationState: activeBuilding?.has_discrepancy ? "DISCREPANCY_DETECTED" : "VERIFIED",
          selectionState: "SELECTED",
          cameraTarget: activeBuilding?.id,
          inspectionMode,
          metadata: {
            building_code: activeBuilding?.building_code || "BLD-KA-BLR-102",
            building_type: activeBuilding?.building_type || "COMMERCIAL",
            ground_elevation: activeBuilding?.ground_elevation ?? 920.5,
            observed_height: activeBuilding?.building_height ?? 14.5,
            sanctioned_height: 11.5,
            height_delta: (activeBuilding?.building_height ?? 14.5) - 11.5,
            detected_floors: activeBuilding?.detected_floors ?? 4,
            sanctioned_floors: activeBuilding?.sanctioned_floors ?? 3,
            has_discrepancy: Boolean(activeBuilding?.has_discrepancy),
            floors_count: activeBuilding?.floors?.length || 4,
          },
          rawNode: activeBuilding,
        };
      }

      case "PARCEL": {
        return {
          entityType: "PARCEL",
          entityId: activeParcel?.id || "KA-BLR-2026-P102",
          parentId: region?.id || null,
          parentType: "REGION",
          title: `Cadastral Parcel ${activeParcel?.survey_number || "102/3B"}`,
          subtitle: activeParcel?.ulpin_2d || "KA-BLR-2026-P102",
          code: activeParcel?.ulpin_2d || "KA-BLR-2026-P102",
          hierarchyPath,
          geometryReference: "PostGIS 2D Boundary Polygon (EPSG:4326 / SRID:32643)",
          source: "AUTHORITATIVE",
          confidence: 1.0,
          verificationState: "VERIFIED",
          selectionState: "SELECTED",
          cameraTarget: activeParcel?.id,
          inspectionMode,
          metadata: {
            ulpin_2d: activeParcel?.ulpin_2d || "KA-BLR-2026-P102",
            survey_number: activeParcel?.survey_number || "102/3B",
            land_use: activeParcel?.land_use || "COMMERCIAL_MIXED",
            recorded_area_sqm: activeParcel?.recorded_area_sqm ?? 520.0,
            computed_area_sqm: activeParcel?.computed_area_sqm ?? 520.0,
            elevation_base: activeParcel?.elevation_base ?? 920.0,
            buildings_count: activeParcel?.buildings?.length || 1,
          },
          rawNode: activeParcel,
        };
      }

      case "REGION": {
        return {
          entityType: "REGION",
          entityId: region?.id || "w101",
          parentId: city?.id || null,
          parentType: "CITY",
          title: region?.name || "Malleshwaram Zone",
          subtitle: `Administrative Zone Code: ${region?.code || "W-101"}`,
          code: region?.code || "W-101",
          hierarchyPath,
          geometryReference: "Municipal Ward Boundary GeoJSON",
          source: "AUTHORITATIVE",
          confidence: 1.0,
          verificationState: "VERIFIED",
          selectionState: "SELECTED",
          cameraTarget: region?.id,
          inspectionMode,
          metadata: {
            parcels_count: region?.parcels?.length || 3,
          },
          rawNode: region,
        };
      }

      case "CITY":
      default: {
        return {
          entityType: "CITY",
          entityId: city?.id || "blr",
          title: city?.name || "Bengaluru Municipal Corporation",
          subtitle: "Digital Property Twin • Macro Urban Cadastre",
          hierarchyPath: [{ level: "CITY", id: city?.id || "blr", name: city?.name || "Bengaluru", code: "BLR" }],
          geometryReference: "City-wide Urban Extent",
          source: "AUTHORITATIVE",
          confidence: 1.0,
          verificationState: "VERIFIED",
          selectionState: "NONE",
          inspectionMode,
          metadata: {
            total_parcels: treeData?.total_parcels || 3,
            total_buildings: treeData?.total_buildings || 3,
            total_floors: treeData?.total_floors || 4,
            total_units: treeData?.total_units || 4,
          },
          rawNode: city,
        };
      }
    }
  }, [
    currentLevel,
    city,
    region,
    activeParcel,
    activeBuilding,
    activeFloor,
    activeUnit,
    activeRoom,
    activeElement,
    selectedInfrastructureId,
    isolateBuilding,
    isolateFloor,
    explodeFloors,
    treeData,
  ]);

  return {
    selection,
    activeParcel,
    activeBuilding,
    activeFloor,
    activeUnit,
    activeRoom,
    activeElement,
  };
}
