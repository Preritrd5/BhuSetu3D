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

  // Canonical 7-Floor Definitions for Aura Horizon (FL-01 to FL-07)
  const CANONICAL_7_FLOORS = useMemo<FloorHierarchyNode[]>(() => [
    {
      id: "fl-1",
      building_id: "77777777-7777-4000-8000-000000000102",
      floor_code: "FL-01",
      floor_number: 1,
      floor_label: "Floor 01 (Ground Lobby & Retail)",
      base_elevation: 920.5,
      ceiling_elevation: 924.5,
      floor_height: 4.0,
      floor_area_sqm: 240.0,
      is_unsanctioned: false,
      units: [
        { id: "unit-101", floor_id: "fl-1", building_id: "77777777-7777-4000-8000-000000000102", parcel_id: "66666666-6666-4000-8000-000000000102", unit_number: "unit-101", unit_label: "Unit 101 · Grand Entrance Lobby & Reception", unit_type: "COMMERCIAL", carpet_area_sqm: 110.0, ulpin_3d: "KA-BLR-2026-P102-U101", verification_status: "VERIFIED", spatial_elements: [{ id: "room-101", name: "Grand Entrance Lobby", type: "LOBBY", area_sqm: 110.0, dimensions: "11m x 10m", material: "Italian Marble / Glass Curtain", elements: [{ id: "door-101", name: "Main Double Glass Entrance Doors", type: "DOOR", dimensions: "2.4m x 3.0m", material: "Toughened Frameless Glass" }, { id: "window-101", name: "Storefront Facade Glazing", type: "WINDOW", dimensions: "6.0m x 3.5m", material: "Low-E Double Glazing" }] }] },
        { id: "unit-102", floor_id: "fl-1", building_id: "77777777-7777-4000-8000-000000000102", parcel_id: "66666666-6666-4000-8000-000000000102", unit_number: "unit-102", unit_label: "Unit 102 · Retail Arcade & Cafe Concourse", unit_type: "RETAIL", carpet_area_sqm: 85.0, ulpin_3d: "KA-BLR-2026-P102-U102", verification_status: "VERIFIED", spatial_elements: [{ id: "room-102", name: "Retail Arcade & Cafe", type: "RETAIL", area_sqm: 85.0, dimensions: "8.5m x 10m", material: "Granite Floor", elements: [{ id: "door-102", name: "Retail Concourse Door", type: "DOOR", dimensions: "1.2m x 2.4m", material: "Anodized Aluminum" }, { id: "window-102", name: "Retail Display Window", type: "WINDOW", dimensions: "4.0m x 2.4m", material: "Clear Laminated Glass" }] }] },
      ],
    },
    {
      id: "fl-2",
      building_id: "77777777-7777-4000-8000-000000000102",
      floor_code: "FL-02",
      floor_number: 2,
      floor_label: "Floor 02 (Commercial Banking & Advisory)",
      base_elevation: 924.5,
      ceiling_elevation: 928.5,
      floor_height: 4.0,
      floor_area_sqm: 240.0,
      is_unsanctioned: false,
      units: [
        { id: "unit-201", floor_id: "fl-2", building_id: "77777777-7777-4000-8000-000000000102", parcel_id: "66666666-6666-4000-8000-000000000102", unit_number: "unit-201", unit_label: "Unit 201 · Commercial Banking Operations", unit_type: "COMMERCIAL", carpet_area_sqm: 115.0, ulpin_3d: "KA-BLR-2026-P102-U201", verification_status: "VERIFIED", spatial_elements: [{ id: "room-201", name: "Banking Operations Chamber", type: "OFFICE", area_sqm: 115.0, dimensions: "11.5m x 10m", material: "Vitrified Tile", elements: [{ id: "door-201", name: "Banking Hall Access Door", type: "DOOR", dimensions: "1.2m x 2.4m", material: "Reinforced Security Door" }, { id: "window-201", name: "Perimeter Ribbon Glazing", type: "WINDOW", dimensions: "3.5m x 1.8m", material: "Double Glazed Tinted" }] }] },
        { id: "unit-202", floor_id: "fl-2", building_id: "77777777-7777-4000-8000-000000000102", parcel_id: "66666666-6666-4000-8000-000000000102", unit_number: "unit-202", unit_label: "Unit 202 · Private Wealth Client Suites", unit_type: "COMMERCIAL", carpet_area_sqm: 90.0, ulpin_3d: "KA-BLR-2026-P102-U202", verification_status: "VERIFIED", spatial_elements: [{ id: "room-202", name: "Wealth Advisory Suites", type: "OFFICE", area_sqm: 90.0, dimensions: "9m x 10m", material: "Carpet Tile / Timber Panel", elements: [{ id: "door-202", name: "Advisory Chamber Door", type: "DOOR", dimensions: "1.0m x 2.4m", material: "Solid Teak Door" }, { id: "window-202", name: "East Facade Window", type: "WINDOW", dimensions: "2.5m x 1.8m", material: "Acoustic Glazing" }] }] },
      ],
    },
    {
      id: "fl-3",
      building_id: "77777777-7777-4000-8000-000000000102",
      floor_code: "FL-03",
      floor_number: 3,
      floor_label: "Floor 03 (Executive Suite · Cadastral Discrepancy)",
      base_elevation: 928.5,
      ceiling_elevation: 932.5,
      floor_height: 4.0,
      floor_area_sqm: 240.0,
      is_unsanctioned: true, // AUTHORITATIVE DISPUTE FLOOR
      units: [
        { id: "unit-301", floor_id: "fl-3", building_id: "77777777-7777-4000-8000-000000000102", parcel_id: "66666666-6666-4000-8000-000000000102", unit_number: "unit-301", unit_label: "Unit 301 · Board Conference Hall", unit_type: "COMMERCIAL", carpet_area_sqm: 118.0, ulpin_3d: "KA-BLR-2026-P102-U301", verification_status: "VERIFIED", spatial_elements: [{ id: "room-301", name: "Board Conference Chamber", type: "CONFERENCE", area_sqm: 32.5, dimensions: "6.5m x 5.0m", material: "Acoustic Timber Slats", elements: [{ id: "door-301", name: "Conference Double Door", type: "DOOR", dimensions: "1.8m x 2.4m", material: "Toughened Frameless Glass" }, { id: "window-301", name: "Ribbon Facade Window", type: "WINDOW", dimensions: "4.0m x 1.5m", material: "Acoustic Double Glazing" }] }] },
        { id: "unit-302", floor_id: "fl-3", building_id: "77777777-7777-4000-8000-000000000102", parcel_id: "66666666-6666-4000-8000-000000000102", unit_number: "unit-302", unit_label: "Unit 302 · Executive Office Suite", unit_type: "COMMERCIAL", carpet_area_sqm: 88.0, ulpin_3d: "KA-BLR-2026-P102-U302", verification_status: "VERIFIED", spatial_elements: [{ id: "room-302", name: "Executive Suite Primary Chamber", type: "OFFICE", area_sqm: 24.8, dimensions: "6.2m x 4.0m", material: "Granite Tile / Glass Partitions", elements: [{ id: "door-302", name: "Door D-302-A (Egress Door)", type: "DOOR", dimensions: "1.0m x 2.1m", material: "Solid Hardwood / Fire-Rated 60min" }, { id: "window-302", name: "Window W-302-A (Curtain Glazing)", type: "WINDOW", dimensions: "2.4m x 1.8m", material: "Double-Glazed Low-E Architectural Glass" }] }] },
      ],
    },
    {
      id: "fl-4",
      building_id: "77777777-7777-4000-8000-000000000102",
      floor_code: "FL-04",
      floor_number: 4,
      floor_label: "Floor 04 (Tech Workstations & Open Office)",
      base_elevation: 932.5,
      ceiling_elevation: 936.5,
      floor_height: 4.0,
      floor_area_sqm: 240.0,
      is_unsanctioned: false,
      units: [
        { id: "unit-401", floor_id: "fl-4", building_id: "77777777-7777-4000-8000-000000000102", parcel_id: "66666666-6666-4000-8000-000000000102", unit_number: "unit-401", unit_label: "Unit 401 · Open Tech Collaboration Studio", unit_type: "OFFICE", carpet_area_sqm: 120.0, ulpin_3d: "KA-BLR-2026-P102-U401", verification_status: "VERIFIED", spatial_elements: [{ id: "room-401", name: "Tech Open Collaboration Studio", type: "OFFICE", area_sqm: 120.0, dimensions: "12m x 10m", material: "Polished Concrete / Exposed Ducting", elements: [{ id: "door-401", name: "Access Keycard Door", type: "DOOR", dimensions: "1.1m x 2.4m", material: "Steel Frame Glass" }, { id: "window-401", name: "West Ribbon Window", type: "WINDOW", dimensions: "5.0m x 1.8m", material: "Double Glazed" }] }] },
        { id: "unit-402", floor_id: "fl-4", building_id: "77777777-7777-4000-8000-000000000102", parcel_id: "66666666-6666-4000-8000-000000000102", unit_number: "unit-402", unit_label: "Unit 402 · Scrum & Meeting Pods", unit_type: "OFFICE", carpet_area_sqm: 85.0, ulpin_3d: "KA-BLR-2026-P102-U402", verification_status: "VERIFIED", spatial_elements: [{ id: "room-402", name: "Scrum & Meeting Pods", type: "MEETING", area_sqm: 85.0, dimensions: "8.5m x 10m", material: "Acoustic Felt / Glass", elements: [{ id: "door-402", name: "Acoustic Sliding Door", type: "DOOR", dimensions: "1.0m x 2.4m", material: "Laminated Acoustic Glass" }, { id: "window-402", name: "East Facing Window", type: "WINDOW", dimensions: "3.0m x 1.8m", material: "Low-E Glazed" }] }] },
      ],
    },
    {
      id: "fl-5",
      building_id: "77777777-7777-4000-8000-000000000102",
      floor_code: "FL-05",
      floor_number: 5,
      floor_label: "Floor 05 (Corporate Legal & Advisory)",
      base_elevation: 936.5,
      ceiling_elevation: 940.5,
      floor_height: 4.0,
      floor_area_sqm: 240.0,
      is_unsanctioned: false,
      units: [
        { id: "unit-501", floor_id: "fl-5", building_id: "77777777-7777-4000-8000-000000000102", parcel_id: "66666666-6666-4000-8000-000000000102", unit_number: "unit-501", unit_label: "Unit 501 · Corporate Legal Advisory", unit_type: "OFFICE", carpet_area_sqm: 110.0, ulpin_3d: "KA-BLR-2026-P102-U501", verification_status: "VERIFIED", spatial_elements: [{ id: "room-501", name: "Legal Advisory Chamber", type: "OFFICE", area_sqm: 110.0, dimensions: "11m x 10m", material: "Hardwood Floor / Sound Insulated", elements: [{ id: "door-501", name: "Chambers Entry Door", type: "DOOR", dimensions: "1.0m x 2.4m", material: "Solid Walnut" }, { id: "window-501", name: "West Glazing Unit", type: "WINDOW", dimensions: "3.5m x 1.8m", material: "Tinted Double Glazed" }] }] },
        { id: "unit-502", floor_id: "fl-5", building_id: "77777777-7777-4000-8000-000000000102", parcel_id: "66666666-6666-4000-8000-000000000102", unit_number: "unit-502", unit_label: "Unit 502 · Senior Partner Chambers", unit_type: "OFFICE", carpet_area_sqm: 95.0, ulpin_3d: "KA-BLR-2026-P102-U502", verification_status: "VERIFIED", spatial_elements: [{ id: "room-502", name: "Partner Private Chambers", type: "OFFICE", area_sqm: 95.0, dimensions: "9.5m x 10m", material: "Plush Carpet / Leather Panel", elements: [{ id: "door-502", name: "Partner Suite Door", type: "DOOR", dimensions: "1.0m x 2.4m", material: "Solid Walnut with Brass Fittings" }, { id: "window-502", name: "East Skyline Window", type: "WINDOW", dimensions: "3.5m x 1.8m", material: "Low-E Glazing" }] }] },
      ],
    },
    {
      id: "fl-6",
      building_id: "77777777-7777-4000-8000-000000000102",
      floor_code: "FL-06",
      floor_number: 6,
      floor_label: "Floor 06 (Innovation & R&D Hub)",
      base_elevation: 940.5,
      ceiling_elevation: 944.5,
      floor_height: 4.0,
      floor_area_sqm: 240.0,
      is_unsanctioned: false,
      units: [
        { id: "unit-601", floor_id: "fl-6", building_id: "77777777-7777-4000-8000-000000000102", parcel_id: "66666666-6666-4000-8000-000000000102", unit_number: "unit-601", unit_label: "Unit 601 · Advanced R&D Laboratory", unit_type: "LABORATORY", carpet_area_sqm: 115.0, ulpin_3d: "KA-BLR-2026-P102-U601", verification_status: "VERIFIED", spatial_elements: [{ id: "room-601", name: "Advanced R&D Clean Lab", type: "LABORATORY", area_sqm: 115.0, dimensions: "11.5m x 10m", material: "Anti-Static Epoxy Flooring", elements: [{ id: "door-601", name: "Air-Lock Sealed Door", type: "DOOR", dimensions: "1.2m x 2.4m", material: "Hermetically Sealed Steel" }, { id: "window-601", name: "Observation Window", type: "WINDOW", dimensions: "3.0m x 1.8m", material: "Safety Laminated" }] }] },
        { id: "unit-602", floor_id: "fl-6", building_id: "77777777-7777-4000-8000-000000000102", parcel_id: "66666666-6666-4000-8000-000000000102", unit_number: "unit-602", unit_label: "Unit 602 · Prototyping & Design Studio", unit_type: "STUDIO", carpet_area_sqm: 90.0, ulpin_3d: "KA-BLR-2026-P102-U602", verification_status: "VERIFIED", spatial_elements: [{ id: "room-602", name: "Rapid Prototyping Studio", type: "STUDIO", area_sqm: 90.0, dimensions: "9m x 10m", material: "Industrial Resin", elements: [{ id: "door-602", name: "Double Studio Door", type: "DOOR", dimensions: "1.8m x 2.4m", material: "Aluminum Frame" }, { id: "window-602", name: "North Glazing", type: "WINDOW", dimensions: "4.0m x 1.8m", material: "Clear Insulated" }] }] },
      ],
    },
    {
      id: "fl-7",
      building_id: "77777777-7777-4000-8000-000000000102",
      floor_code: "FL-07",
      floor_number: 7,
      floor_label: "Floor 07 (Sky Lounge & Executive Boardroom)",
      base_elevation: 944.5,
      ceiling_elevation: 948.5,
      floor_height: 4.0,
      floor_area_sqm: 240.0,
      is_unsanctioned: false,
      units: [
        { id: "unit-701", floor_id: "fl-7", building_id: "77777777-7777-4000-8000-000000000102", parcel_id: "66666666-6666-4000-8000-000000000102", unit_number: "unit-701", unit_label: "Unit 701 · Sky Lounge & Reception Atrium", unit_type: "COMMERCIAL", carpet_area_sqm: 105.0, ulpin_3d: "KA-BLR-2026-P102-U701", verification_status: "VERIFIED", spatial_elements: [{ id: "room-701", name: "Sky Lounge Reception Atrium", type: "LOUNGE", area_sqm: 105.0, dimensions: "10.5m x 10m", material: "Honed Quartzite / Glass Railings", elements: [{ id: "door-701", name: "Sky Terrace Sliding Door", type: "DOOR", dimensions: "2.4m x 2.8m", material: "Double Sliding Glass" }, { id: "window-701", name: "Floor-to-Ceiling Panoramic Window", type: "WINDOW", dimensions: "6.0m x 2.8m", material: "Solar Control Triple Glazing" }] }] },
        { id: "unit-702", floor_id: "fl-7", building_id: "77777777-7777-4000-8000-000000000102", parcel_id: "66666666-6666-4000-8000-000000000102", unit_number: "unit-702", unit_label: "Unit 702 · Panoramic Boardroom & CEO Chamber", unit_type: "COMMERCIAL", carpet_area_sqm: 100.0, ulpin_3d: "KA-BLR-2026-P102-U702", verification_status: "VERIFIED", spatial_elements: [{ id: "room-702", name: "Executive Boardroom Chamber", type: "BOARDROOM", area_sqm: 100.0, dimensions: "10m x 10m", material: "Chevron Oak / Acoustic Suede", elements: [{ id: "door-702", name: "Boardroom Double Door", type: "DOOR", dimensions: "1.8m x 2.8m", material: "Smoked Glass with Bronze Trim" }, { id: "window-702", name: "Bengaluru Skyline Panoramic Window", type: "WINDOW", dimensions: "6.0m x 2.8m", material: "Acoustic Low-E Triple Glazing" }] }] },
      ],
    },
  ], []);

  // 3. Resolve Active Floor
  const activeFloor = useMemo<FloorHierarchyNode | null>(() => {
    const availableFloors = (activeBuilding?.floors && activeBuilding.floors.length > 0)
      ? activeBuilding.floors
      : CANONICAL_7_FLOORS;

    if (selectedFloorId) {
      const match = availableFloors.find(
        (f) => f.floor_code === selectedFloorId || f.id === selectedFloorId
      );
      if (match) return match;
    }
    return (
      availableFloors.find((f) => f.floor_code === "FL-03" || f.floor_code === "floor-3") ||
      availableFloors[0] ||
      null
    );
  }, [activeBuilding, selectedFloorId, CANONICAL_7_FLOORS]);

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
        const isAuthoritative = (activeFloor?.floor_code === "FL-03" || activeFloor?.id === "FL-03");
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
          geometryReference: isAuthoritative ? "BIM IFC Element LoD400" : "Illustrative Architectural Component",
          source: (isAuthoritative ? "DERIVED" : "ILLUSTRATIVE") as TrustSource,
          confidence: isAuthoritative ? 0.96 : 0.80,
          verificationState: isAuthoritative ? "VERIFIED" : "UNVERIFIED",
          selectionState: "SELECTED",
          cameraTarget: activeElement?.id,
          inspectionMode,
          metadata: {
            dimensions: activeElement?.dimensions || (isDoor ? "1.1m x 2.4m" : "2.2m x 1.6m"),
            material: activeElement?.material || (isDoor ? "Solid Core Timber with Steel Frame" : "Low-E Tinted Double Glazing"),
            fire_rating: activeElement?.fire_rating || (isDoor ? "FD-60" : "Unrated"),
            glazing: activeElement?.glazing || (isWindow ? "Low-E Reflective" : undefined),
            is_illustrative: !isAuthoritative,
          },
          rawNode: activeElement,
        };
      }

      case "CORRIDOR": {
        const isAuthoritative = (activeFloor?.floor_code === "FL-03" || activeFloor?.id === "FL-03");
        const corridor = activeUnit?.spatial_elements?.find((e) => e.type === "CORRIDOR") || null;
        return {
          entityType: "CORRIDOR",
          entityId: corridor?.id || `corridor-${activeFloor?.floor_number ?? 3}`,
          parentId: activeFloor?.id || null,
          parentType: "FLOOR",
          title: corridor?.name || `Floor ${activeFloor?.floor_code || "FL-03"} Central Circulation Corridor`,
          subtitle: `${activeFloor?.floor_code || "FL-03"} Egress & Access Hallway`,
          code: corridor?.id || `corridor-${activeFloor?.floor_number ?? 3}`,
          hierarchyPath,
          geometryReference: isAuthoritative ? "LoD3 Interior Space Polygon" : "Illustrative Digital Twin Corridor",
          source: (isAuthoritative ? "DERIVED" : "ILLUSTRATIVE") as TrustSource,
          confidence: isAuthoritative ? 0.97 : 0.82,
          verificationState: isAuthoritative ? "VERIFIED" : "UNVERIFIED",
          selectionState: "SELECTED",
          cameraTarget: corridor?.id || `corridor-${activeFloor?.floor_number ?? 3}`,
          inspectionMode,
          metadata: {
            area_sqm: corridor?.area_sqm || 36.4,
            dimensions: corridor?.dimensions || "14.0m x 2.6m",
            material: corridor?.material || "Terrazzo Floor / LED Recessed",
            clear_width_m: 2.6,
            life_safety_compliant: true,
            is_illustrative: !isAuthoritative,
          },
          rawNode: corridor,
        };
      }

      case "HALL":
      case "ROOM": {
        const isAuthoritative = (activeFloor?.floor_code === "FL-03" || activeFloor?.id === "FL-03");
        const isHall = currentLevel === "HALL" || activeRoom?.name?.toLowerCase().includes("hall") || activeRoom?.type === "HALL";
        return {
          entityType: isHall ? "HALL" : "ROOM",
          entityId: activeRoom?.id || (isAuthoritative ? "room-302" : "room-101"),
          parentId: activeUnit?.id || null,
          parentType: "UNIT",
          title: activeRoom?.name || (isHall ? "Room 301 (Conference Hall)" : "Room 302 (Executive Suite)"),
          subtitle: isHall ? "Assembly / Large Meeting Space" : (isAuthoritative ? "Executive Workspace" : "Demonstration Interior Space"),
          code: activeRoom?.id || (isHall ? "room-301" : "room-302"),
          hierarchyPath,
          geometryReference: isAuthoritative ? "LoD3 Interior Room Prism" : "Illustrative Digital Twin Layout Geometry",
          source: (isAuthoritative ? "DERIVED" : "ILLUSTRATIVE") as TrustSource,
          confidence: isAuthoritative ? 0.95 : 0.80,
          verificationState: isAuthoritative ? "VERIFIED" : "UNVERIFIED",
          selectionState: "SELECTED",
          cameraTarget: activeRoom?.id,
          inspectionMode,
          metadata: {
            area_sqm: activeRoom?.area_sqm || (isHall ? 32.5 : 24.8),
            dimensions: activeRoom?.dimensions || (isHall ? "6.5m x 5.0m" : "5.2m x 4.8m"),
            material: activeRoom?.material || (isHall ? "Acoustic Timber Paneling" : "Double Glazed Partition"),
            child_elements_count: activeRoom?.elements?.length || 2,
            is_illustrative: !isAuthoritative,
          },
          rawNode: activeRoom,
        };
      }

      case "UNIT": {
        const isAuthoritativeFloor = activeFloor?.floor_code === "FL-03" || activeFloor?.id === "FL-03";
        const isAuthoritativeUnit = isAuthoritativeFloor && (activeUnit?.id === "unit-301" || activeUnit?.unit_number === "301" || activeUnit?.unit_number === "unit-302" || activeUnit?.id === "unit-302");
        return {
          entityType: "UNIT",
          entityId: activeUnit?.id || "unit-301",
          parentId: activeFloor?.id || null,
          parentType: "FLOOR",
          title: activeUnit?.unit_label || `Unit ${activeUnit?.unit_number || "301"}`,
          subtitle: activeUnit?.ulpin_3d || "KA-BLR-2026-P102-B1-F3-U04",
          code: activeUnit?.unit_number || "301",
          hierarchyPath,
          geometryReference: isAuthoritativeUnit ? "PostGIS 3D Strata Unit Polygon" : "Illustrative Digital Twin Unit Boundary",
          source: (isAuthoritativeUnit ? "AUTHORITATIVE" : "ILLUSTRATIVE") as TrustSource,
          confidence: isAuthoritativeUnit ? 0.94 : 0.82,
          verificationState: isAuthoritativeUnit
            ? ((activeUnit?.verification_status === "VERIFIED" ? "VERIFIED" : "REVIEW_REQUIRED") as VerificationState)
            : "UNVERIFIED",
          selectionState: "SELECTED",
          cameraTarget: activeUnit?.id,
          inspectionMode,
          metadata: {
            unit_number: activeUnit?.unit_number || "301",
            unit_type: activeUnit?.unit_type || "COMMERCIAL_OFFICE",
            carpet_area_sqm: activeUnit?.carpet_area_sqm || 190.0,
            built_up_area_sqm: activeUnit?.built_up_area_sqm || 225.0,
            status_3d: activeUnit?.status_3d || "AVAILABLE",
            rooms_count: activeUnit?.spatial_elements?.length || 2,
            is_illustrative: !isAuthoritativeUnit,
          },
          rawNode: activeUnit,
        };
      }

      case "FLOOR": {
        const isAuthoritativeFloor = activeFloor?.floor_code === "FL-03" || activeFloor?.id === "FL-03" || activeFloor?.is_unsanctioned;
        return {
          entityType: "FLOOR",
          entityId: activeFloor?.id || "FL-03",
          parentId: activeBuilding?.id || null,
          parentType: "BUILDING",
          title: activeFloor?.floor_label || `Floor ${activeFloor?.floor_code || "FL-03"}`,
          subtitle: activeFloor?.is_unsanctioned
            ? "Unsanctioned Vertical Addition (+3.0m Violation)"
            : (isAuthoritativeFloor ? `Floor Slab #${activeFloor?.floor_number ?? 3}` : `Illustrative Digital Twin Level #${activeFloor?.floor_number ?? 1}`),
          code: activeFloor?.floor_code || "FL-03",
          hierarchyPath,
          geometryReference: isAuthoritativeFloor ? "PostGIS 3D Slab Prism (Surveyed)" : "Illustrative LoD3 BIM Slab",
          source: (isAuthoritativeFloor ? "AUTHORITATIVE" : "ILLUSTRATIVE") as TrustSource,
          confidence: isAuthoritativeFloor ? 0.98 : 0.85,
          verificationState: activeFloor?.is_unsanctioned ? "DISCREPANCY_DETECTED" : (isAuthoritativeFloor ? "VERIFIED" : "UNVERIFIED"),
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
            units_count: activeFloor?.units?.length || 2,
            is_illustrative: !isAuthoritativeFloor,
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
