"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { WorkspaceTopBar } from "@/components/workspace/WorkspaceTopBar";
import {
  WorkspaceBreadcrumb,
  SpatialLevel,
} from "@/components/workspace/WorkspaceBreadcrumb";
import {
  LeftSpatialControlPanel,
  LayerVisibilityState,
} from "@/components/workspace/LeftSpatialControlPanel";
import { RightContextualPanel } from "@/components/workspace/RightContextualPanel";
import { BottomSpatialToolStrip } from "@/components/workspace/BottomSpatialToolStrip";
import { BottomTemporalTimeline } from "@/components/workspace/BottomTemporalTimeline";
import { AISpatialInvestigatorModal } from "@/components/workspace/AISpatialInvestigatorModal";
import { AIExtractionModal } from "@/components/cesium/AIExtractionModal";
import { MeasurementHUD } from "@/components/workspace/tools/MeasurementHUD";
import { SpatialCompass } from "@/components/workspace/tools/SpatialCompass";
import { SpatialScaleBar } from "@/components/workspace/tools/SpatialScaleBar";
import { SpatialComparisonDrawer } from "@/components/workspace/tools/SpatialComparisonDrawer";
import { SpatialErrorBoundary } from "@/components/common/SpatialErrorBoundary";
import { getSpatialHierarchyTree } from "@/lib/api/properties";
import { getUrbanBuildingById, getUrbanParcelById } from "@/lib/cesium";
import { SpatialHierarchyTreeResponse } from "@/types/property";
import { useSpatialSelection } from "@/hooks/useSpatialSelection";
import { ActiveSpatialSelection } from "@/types/selection";
import { SpatialAnchorBadge } from "@/components/workspace/inspector/SpatialAnchorBadge";
import { SpatialLoadingRoller } from "@/components/common/SpatialLoadingRoller";
import {
  SpatialToolType,
  MeasurementMode,
  MeasurementResult,
  ComparisonState,
  CameraViewPreset,
  CameraTelemetry,
} from "@/types/tools";
import { ConflictItem } from "@/types/intelligence";

// Client-only dynamic loading of Cesium 3D Viewer to prevent SSR Node window/document errors
const CesiumViewer = dynamic(
  () => import("@/components/cesium/CesiumViewer").then((m) => m.CesiumViewer),
  {
    ssr: false,
    loading: () => (
      <SpatialLoadingRoller
        label="INITIALIZING BHUSETU 3D DIGITAL TWIN"
        subtitle="Mounting Cesium 3D geospatial canvas & streaming volumetric tiles..."
        size="lg"
      />
    ),
  }
);

function City3DContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlLevel = searchParams.get("level") as SpatialLevel | null;
  const urlParcelId = searchParams.get("parcel");
  const urlBuildingId = searchParams.get("building");
  const urlFloorId = searchParams.get("floor");
  const urlUnitId = searchParams.get("unit");
  const urlRoomId = searchParams.get("room");
  const urlElementId = searchParams.get("element");

  // Multi-Level Spatial State (8-Tier Progressive Inspection)
  const [currentLevel, setCurrentLevel] = useState<SpatialLevel>(urlLevel || "BUILDING");
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(
    urlParcelId || "66666666-6666-4000-8000-000000000102"
  );
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    urlBuildingId || "77777777-7777-4000-8000-000000000102"
  );
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(
    urlFloorId || "FL-03"
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(
    urlUnitId || "unit-302"
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    urlRoomId || "room-302"
  );
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    urlElementId || "door-302"
  );
  const [selectedInfrastructureId, setSelectedInfrastructureId] = useState<string | null>(null);

  // Deep 3D Spatial Inspection Modes
  const [isolateBuilding, setIsolateBuilding] = useState<boolean>(false);
  const [isolateFloor, setIsolateFloor] = useState<boolean>(false);
  const [explodeFloors, setExplodeFloors] = useState<boolean>(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(urlLevel ? urlLevel !== "CITY" : false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState<boolean>(false);

  // Layer visibility state
  const [layers, setLayers] = useState<LayerVisibilityState>({
    buildings: true,
    parcels: true,
    floors: true,
    units: true,
    subsurfaceUtilities: true,
    conflicts: true,
    temporalDiff: true,
  });

  // Phase 7: Spatial Tools & Measurement State
  const [activeSpatialTool, setActiveSpatialTool] = useState<SpatialToolType>("SELECT");
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>("DISTANCE");
  const [measurementResult, setMeasurementResult] = useState<MeasurementResult | null>(null);

  // Phase 7: Spatial Comparison State (Object A vs Object B)
  const [comparisonState, setComparisonState] = useState<ComparisonState>({
    isActive: false,
    entityA: null,
    entityB: null,
    status: "SELECTING_A",
  });

  // Phase 7: Live Camera Telemetry & Dynamic Presets
  const [cameraTelemetry, setCameraTelemetry] = useState<CameraTelemetry>({
    heading: 38,
    pitch: -28,
    altitude: 88,
  });
  const [cameraPreset, setCameraPreset] = useState<CameraViewPreset | null>(null);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | null>(null);
  const [aiHighlightEntityIds, setAiHighlightEntityIds] = useState<string[]>([]);
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Live PostGIS Spatial Hierarchy Tree State
  const [treeData, setTreeData] = useState<SpatialHierarchyTreeResponse | null>(null);
  const [isLoadingTree, setIsLoadingTree] = useState<boolean>(true);

  // Fetch live PostGIS spatial hierarchy tree
  useEffect(() => {
    let isMounted = true;
    setIsLoadingTree(true);
    getSpatialHierarchyTree()
      .then((data) => {
        if (isMounted) {
          setTreeData(data);
          setIsLoadingTree(false);
        }
      })
      .catch((err) => {
        console.warn("[BHUSETU_3D] Could not fetch live spatial hierarchy tree:", err);
        if (isMounted) {
          setIsLoadingTree(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  // 4D Temporal Year Scrubber
  const [temporalYear, setTemporalYear] = useState<number>(2026);

  // Sync URL query params with selection on change
  useEffect(() => {
    if (urlLevel && urlLevel !== currentLevel) setCurrentLevel(urlLevel);
    if (urlParcelId && urlParcelId !== selectedParcelId) setSelectedParcelId(urlParcelId);
    if (urlBuildingId && urlBuildingId !== selectedBuildingId) setSelectedBuildingId(urlBuildingId);
    if (urlFloorId && urlFloorId !== selectedFloorId) setSelectedFloorId(urlFloorId);
    if (urlUnitId && urlUnitId !== selectedUnitId) setSelectedUnitId(urlUnitId);
    if (urlRoomId && urlRoomId !== selectedRoomId) setSelectedRoomId(urlRoomId);
    if (urlElementId && urlElementId !== selectedElementId) setSelectedElementId(urlElementId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlLevel, urlParcelId, urlBuildingId, urlFloorId, urlUnitId, urlRoomId, urlElementId]);

  // Push selection state changes to URL for shareable, reproducible deep links
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (currentLevel) params.set("level", currentLevel);
    if (selectedParcelId) params.set("parcel", selectedParcelId);
    if (selectedBuildingId) params.set("building", selectedBuildingId);
    if (selectedFloorId) params.set("floor", selectedFloorId);
    if (selectedUnitId) params.set("unit", selectedUnitId);
    if (selectedRoomId) params.set("room", selectedRoomId);
    if (selectedElementId) params.set("element", selectedElementId);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [
    currentLevel,
    selectedParcelId,
    selectedBuildingId,
    selectedFloorId,
    selectedUnitId,
    selectedRoomId,
    selectedElementId,
  ]);

  const handleToggleLayer = (key: keyof LayerVisibilityState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Progressive Level Selection across full 8-tier hierarchy
  const handleSelectLevel = (level: SpatialLevel, id?: string) => {
    setCurrentLevel(level);

    if (level === "CITY") {
      setIsRightPanelOpen(false); // Section 12, 51: City view minimizes inspector so 3D world is 100% hero
      setSelectedBuildingId(null);
      setSelectedFloorId(null);
      setSelectedUnitId(null);
      setSelectedRoomId(null);
      setSelectedElementId(null);
      setIsolateBuilding(false);
      setIsolateFloor(false);
      setExplodeFloors(false);
    } else {
      setIsRightPanelOpen(true); // Section 12, 52: Selection opens inspector smoothly
      if (level === "REGION") {
        setSelectedBuildingId(null);
        setSelectedFloorId(null);
        setSelectedUnitId(null);
        setSelectedRoomId(null);
        setSelectedElementId(null);
        setIsolateBuilding(false);
        setIsolateFloor(false);
        setExplodeFloors(false);
      } else if (level === "PARCEL") {
        if (id) {
          setSelectedParcelId(id);
          const pclMeta = getUrbanParcelById(id);
          if (pclMeta?.primaryBuildingIds?.length) {
            setSelectedBuildingId(pclMeta.primaryBuildingIds[0]);
          } else {
            setSelectedBuildingId(null);
          }
        }
        setSelectedFloorId(null);
        setSelectedUnitId(null);
        setSelectedRoomId(null);
        setSelectedElementId(null);
        setIsolateBuilding(false);
        setIsolateFloor(false);
        setExplodeFloors(false);
      } else if (level === "BUILDING") {
        if (id) {
          setSelectedBuildingId(id);
          const bldMeta = getUrbanBuildingById(id);
          if (bldMeta) {
            setSelectedParcelId(bldMeta.legacyParcelId || bldMeta.parcelId);
          }
        } else if (!selectedBuildingId) {
          setSelectedBuildingId("77777777-7777-4000-8000-000000000102");
        }
        setSelectedFloorId(null);
        setSelectedUnitId(null);
        setSelectedRoomId(null);
        setSelectedElementId(null);
        setIsolateFloor(false);
      } else if (level === "FLOOR") {
        if (!selectedBuildingId) setSelectedBuildingId("77777777-7777-4000-8000-000000000102");
        if (id) setSelectedFloorId(id);
        else if (!selectedFloorId) setSelectedFloorId("FL-03");
        setSelectedUnitId(null);
        setSelectedRoomId(null);
        setSelectedElementId(null);
      } else if (level === "UNIT") {
        if (!selectedBuildingId) setSelectedBuildingId("77777777-7777-4000-8000-000000000102");
        if (!selectedFloorId) setSelectedFloorId("FL-03");
        if (id) setSelectedUnitId(id);
        else if (!selectedUnitId) setSelectedUnitId("unit-302");
        setSelectedRoomId(null);
        setSelectedElementId(null);
      } else if (level === "ROOM") {
        if (!selectedBuildingId) setSelectedBuildingId("77777777-7777-4000-8000-000000000102");
        if (!selectedFloorId) setSelectedFloorId("FL-03");
        if (!selectedUnitId) setSelectedUnitId("unit-302");
        if (id) setSelectedRoomId(id);
        else if (!selectedRoomId) setSelectedRoomId("room-302");
        setSelectedElementId(null);
      } else if (level === "CORRIDOR") {
        if (!selectedBuildingId) setSelectedBuildingId("77777777-7777-4000-8000-000000000102");
        if (!selectedFloorId) setSelectedFloorId("FL-03");
        setSelectedRoomId(null);
        setSelectedElementId(null);
      } else if (level === "ELEMENT" || level === "DOOR" || level === "WINDOW") {
        if (!selectedBuildingId) setSelectedBuildingId("77777777-7777-4000-8000-000000000102");
        if (!selectedFloorId) setSelectedFloorId("FL-03");
        if (!selectedUnitId) setSelectedUnitId("unit-302");
        if (!selectedRoomId) setSelectedRoomId("room-302");
        if (id) setSelectedElementId(id);
        else if (!selectedElementId) setSelectedElementId(level === "WINDOW" ? "window-302" : "door-302");
      } else if (level === "HALL") {
        if (!selectedBuildingId) setSelectedBuildingId("77777777-7777-4000-8000-000000000102");
        if (!selectedFloorId) setSelectedFloorId("FL-03");
        if (!selectedUnitId) setSelectedUnitId("unit-302");
        if (id) setSelectedRoomId(id);
        else setSelectedRoomId("room-301");
        setSelectedElementId(null);
      } else if (level === "INFRASTRUCTURE") {
        if (id) setSelectedInfrastructureId(id);
      }
    }
  };

  // Up One Level Navigation across full 8-tier hierarchy
  const handleUpOneLevel = () => {
    switch (currentLevel) {
      case "DOOR":
      case "WINDOW":
      case "ELEMENT":
        handleSelectLevel("ROOM");
        break;
      case "HALL":
      case "CORRIDOR":
      case "ROOM":
        handleSelectLevel("UNIT");
        break;
      case "UNIT":
        handleSelectLevel("FLOOR");
        break;
      case "FLOOR":
        handleSelectLevel("BUILDING");
        break;
      case "BUILDING":
        handleSelectLevel("PARCEL");
        break;
      case "INFRASTRUCTURE":
      case "PARCEL":
        handleSelectLevel("CITY");
        break;
      case "REGION":
      case "CITY":
      default:
        handleSelectLevel("CITY");
        break;
    }
  };

  const resolveEntitySelection = (level: SpatialLevel, id: string): ActiveSpatialSelection | null => {
    if (treeData) {
      for (const region of treeData.city?.regions || []) {
        for (const parcel of region.parcels || []) {
          if (level === "PARCEL" && parcel.id === id) {
            return {
              entityId: parcel.id,
              entityType: "PARCEL",
              title: `Parcel ${parcel.survey_number}`,
              code: parcel.ulpin_2d || parcel.survey_number,
              hierarchyPath: [
                { level: "CITY", id: "city", name: "Bengaluru Urban" },
                { level: "PARCEL", id: parcel.id, name: parcel.survey_number, code: parcel.ulpin_2d },
              ],
              source: "AUTHORITATIVE",
              verificationState: "VERIFIED",
              selectionState: "SELECTED",
              inspectionMode: {},
              metadata: {
                recorded_area_sqm: parcel.recorded_area_sqm || parcel.computed_area_sqm,
                land_use: parcel.land_use || "Mixed Commercial",
                has_discrepancy: false,
              },
            };
          }
          const b = parcel.buildings?.find((b) => b.id === id || b.building_code === id);
          if (b) {
            return {
              entityId: b.id,
              entityType: "BUILDING",
              title: b.name,
              code: b.building_code,
              hierarchyPath: [
                { level: "CITY", id: "city", name: "Bengaluru Urban" },
                { level: "PARCEL", id: parcel.id, name: parcel.survey_number },
                { level: "BUILDING", id: b.id, name: b.name, code: b.building_code },
              ],
              source: "AUTHORITATIVE",
              verificationState: b.has_discrepancy ? "DISCREPANCY_DETECTED" : "VERIFIED",
              selectionState: "SELECTED",
              inspectionMode: {},
              metadata: {
                detected_floors: b.detected_floors,
                observed_height: b.building_height,
                sanctioned_height: b.sanctioned_floors * 3.5,
                building_type: b.building_type,
                has_discrepancy: b.has_discrepancy,
                recorded_area_sqm: parcel.recorded_area_sqm,
              },
            };
          }
        }
      }
    }

    if (id === "77777777-7777-4000-8000-000000000102" || id === "b-102") {
      return {
        entityId: "77777777-7777-4000-8000-000000000102",
        entityType: "BUILDING",
        title: "Aura Horizon Commercial Complex",
        code: "BLD-KA-BLR-102",
        hierarchyPath: [
          { level: "CITY", id: "city", name: "Bengaluru Urban" },
          { level: "PARCEL", id: "p-102", name: "Parcel 102/3B" },
          { level: "BUILDING", id: "b-102", name: "Aura Horizon Commercial Complex", code: "BLD-KA-BLR-102" },
        ],
        source: "AUTHORITATIVE",
        verificationState: "DISCREPANCY_DETECTED",
        selectionState: "SELECTED",
        inspectionMode: {},
        metadata: {
          detected_floors: 3,
          observed_height: 14.5,
          sanctioned_height: 11.5,
          building_type: "Commercial",
          has_discrepancy: true,
          recorded_area_sqm: 480,
        },
      };
    }
    if (id === "77777777-7777-4000-8000-000000000101" || id === "b-101") {
      return {
        entityId: "77777777-7777-4000-8000-000000000101",
        entityType: "BUILDING",
        title: "Malleshwaram Residency",
        code: "BLD-KA-BLR-101",
        hierarchyPath: [
          { level: "CITY", id: "city", name: "Bengaluru Urban" },
          { level: "PARCEL", id: "p-101", name: "Parcel 101/2A" },
          { level: "BUILDING", id: "b-101", name: "Malleshwaram Residency", code: "BLD-KA-BLR-101" },
        ],
        source: "AUTHORITATIVE",
        verificationState: "VERIFIED",
        selectionState: "SELECTED",
        inspectionMode: {},
        metadata: {
          detected_floors: 2,
          observed_height: 10.5,
          sanctioned_height: 10.5,
          building_type: "Residential",
          has_discrepancy: false,
          recorded_area_sqm: 350,
        },
      };
    }
    if (id === "77777777-7777-4000-8000-000000000103" || id === "b-103") {
      return {
        entityId: "77777777-7777-4000-8000-000000000103",
        entityType: "BUILDING",
        title: "Green Valley Arcade",
        code: "BLD-KA-BLR-103",
        hierarchyPath: [
          { level: "CITY", id: "city", name: "Bengaluru Urban" },
          { level: "PARCEL", id: "p-103", name: "Parcel 103/1" },
          { level: "BUILDING", id: "b-103", name: "Green Valley Arcade", code: "BLD-KA-BLR-103" },
        ],
        source: "AUTHORITATIVE",
        verificationState: "VERIFIED",
        selectionState: "SELECTED",
        inspectionMode: {},
        metadata: {
          detected_floors: 2,
          observed_height: 7.5,
          sanctioned_height: 7.5,
          building_type: "Retail Arcade",
          has_discrepancy: false,
          recorded_area_sqm: 290,
        },
      };
    }

    return {
      entityId: id,
      entityType: level,
      title: `${level} (${id.slice(0, 8)})`,
      code: id.toUpperCase().slice(0, 10),
      hierarchyPath: [
        { level: "CITY", id: "city", name: "Bengaluru Urban" },
        { level, id, name: `${level} ${id.slice(0, 8)}` },
      ],
      source: "DERIVED",
      verificationState: "VERIFIED",
      selectionState: "SELECTED",
      inspectionMode: {},
      metadata: {
        detected_floors: 4,
        observed_height: 16.0,
        sanctioned_height: 16.0,
        building_type: "Mixed Use",
        has_discrepancy: false,
        recorded_area_sqm: 420,
      },
    };
  };

  const handleSelectTool = (tool: SpatialToolType) => {
    if (activeSpatialTool === tool) {
      setActiveSpatialTool("SELECT");
      if (tool === "COMPARE") {
        setComparisonState({
          isActive: false,
          entityA: null,
          entityB: null,
          status: "SELECTING_A",
        });
      }
    } else {
      setActiveSpatialTool(tool);
      if (tool === "COMPARE") {
        setComparisonState({
          isActive: true,
          entityA: selection || null,
          entityB: null,
          status: selection ? "SELECTING_B" : "SELECTING_A",
        });
        setIsRightPanelOpen(false);
      } else if (tool === "MEASURE") {
        setMeasurementResult(null);
      }
    }
  };

  const handleCloseCompare = () => {
    setComparisonState({
      isActive: false,
      entityA: null,
      entityB: null,
      status: "SELECTING_A",
    });
    setActiveSpatialTool("SELECT");
  };

  const handleSelectCompareEntity = (level: SpatialLevel, id: string) => {
    const resolved = resolveEntitySelection(level, id);
    if (!resolved) return;

    setComparisonState((prev) => {
      if (!prev.entityA || prev.status === "SELECTING_A") {
        return {
          ...prev,
          isActive: true,
          entityA: resolved,
          status: "SELECTING_B",
        };
      } else {
        return {
          ...prev,
          isActive: true,
          entityB: resolved,
          status: "COMPARING",
        };
      }
    });
  };

  // Phase 8: Discrepancy measurement and contextual AI investigator trigger
  const handleMeasureConflict = (conflict: ConflictItem) => {
    setActiveSpatialTool("MEASURE");
    setMeasurementMode("HEIGHT");
    setCameraPreset("FIT");
    setTimeout(() => setCameraPreset(null), 100);
  };

  const handleOpenAIWithQuery = (prompt: string) => {
    setAiInitialPrompt(prompt);
    setIsAIModalOpen(true);
  };

  // Phase 7: Global Hotkey Listener: Escape, KeyV, KeyM, KeyC, KeyT, KeyL, KeyI, KeyF, KeyN, Digit2, Home
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (isAIModalOpen) {
          setIsAIModalOpen(false);
        } else if (isExtractionModalOpen) {
          setIsExtractionModalOpen(false);
        } else if (comparisonState.isActive) {
          handleCloseCompare();
        } else if (activeSpatialTool === "MEASURE" || activeSpatialTool === "TIMELINE") {
          setActiveSpatialTool("SELECT");
          setMeasurementResult(null);
        } else if (currentLevel !== "CITY") {
          handleUpOneLevel();
        } else {
          setIsRightPanelOpen(false);
        }
      } else if (e.code === "KeyV" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleSelectTool("SELECT");
      } else if (e.code === "KeyL" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsLeftPanelCollapsed((p) => !p);
      } else if (e.code === "KeyI" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsRightPanelOpen((p) => !p);
      } else if (e.code === "KeyM" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleSelectTool("MEASURE");
      } else if (e.code === "KeyC" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleSelectTool("COMPARE");
      } else if (e.code === "KeyT" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleSelectTool("TIMELINE");
      } else if (e.code === "KeyF" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setCameraPreset("FIT");
        setTimeout(() => setCameraPreset(null), 100);
      } else if (e.code === "KeyN" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setCameraPreset("NORTH");
        setTimeout(() => setCameraPreset(null), 100);
      } else if (e.code === "Digit2" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        router.push(`/properties?parcel=${selectedParcelId || "66666666-6666-4000-8000-000000000102"}`);
      } else if (e.key === "Home" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setCameraPreset("BUILDING");
        setTimeout(() => setCameraPreset(null), 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAIModalOpen, isExtractionModalOpen, activeSpatialTool, comparisonState.isActive, currentLevel, selectedParcelId]);

  const handleExtractionComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Single Source of Truth Active Spatial Selection
  const {
    selection,
    activeParcel,
    activeBuilding,
    activeFloor,
    activeUnit,
    activeRoom,
    activeElement,
  } = useSpatialSelection({
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

  const parcelDisplayName = activeParcel ? `Parcel ${activeParcel.survey_number}` : "Parcel 102/3B";
  const buildingDisplayName = activeBuilding ? activeBuilding.name : "Aura Horizon Commercial";
  const floorDisplayName = activeFloor ? (activeFloor.floor_label || `Floor ${activeFloor.floor_code}`) : "Floor 03";
  const unitDisplayName = activeUnit ? (activeUnit.unit_label || `Unit ${activeUnit.unit_number}`) : "Unit 301";
  const roomDisplayName = activeRoom ? activeRoom.name : "Room 302";
  const elementDisplayName = activeElement ? activeElement.name : "Door D-302-A";

  return (
    <ProtectedRoute>
      <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
        {/* Full-Screen WebGL Cesium 3D Viewport (85-90%+ Screen Real Estate) */}
        <main className="absolute inset-0 w-full h-full z-0">
          <CesiumViewer
            currentLevel={currentLevel}
            selectedBuildingId={selectedBuildingId}
            selectedParcelId={selectedParcelId}
            selectedFloorId={selectedFloorId}
            selectedUnitId={selectedUnitId}
            selectedRoomId={selectedRoomId}
            selectedElementId={selectedElementId}
            onSelectLevel={handleSelectLevel}
            isolateBuilding={isolateBuilding}
            isolateFloor={isolateFloor}
            explodeFloors={explodeFloors}
            onToggleIsolateBuilding={() => setIsolateBuilding((prev) => !prev)}
            onToggleIsolateFloor={() => setIsolateFloor((prev) => !prev)}
            onToggleExplodeFloors={() => setExplodeFloors((prev) => !prev)}
            layers={layers}
            temporalYear={temporalYear}
            cameraPreset={cameraPreset}
            measurementActive={activeSpatialTool === "MEASURE"}
            measurementMode={measurementMode}
            onMeasurementComplete={(res) => {
              /* legacy compat */
            }}
            onMeasurementUpdate={(res) => setMeasurementResult(res)}
            onTelemetryChange={(telemetry) => setCameraTelemetry(telemetry)}
            comparisonEntityBId={comparisonState.entityB?.entityId || null}
            onSelectCompareEntity={handleSelectCompareEntity}
            activeTool={activeSpatialTool}
            highlightEntityIds={aiHighlightEntityIds}
            treeData={treeData}
            isRightPanelOpen={isRightPanelOpen}
          />
        </main>

        {/* Floating Top Omnibar & Macro KPI Strip */}
        <WorkspaceTopBar
          activeMode="3D"
          onOpenAI={() => setIsAIModalOpen(true)}
          onSelectEntity={(id, type) => {
            if (type === "BUILDING") handleSelectLevel("BUILDING", id);
            else if (type === "PARCEL") handleSelectLevel("PARCEL", id);
            else if (type === "FLOOR") handleSelectLevel("FLOOR", id);
            else if (type === "UNIT") handleSelectLevel("UNIT", id);
            else if (type === "ROOM") handleSelectLevel("ROOM", id);
          }}
          treeData={treeData}
          stats={{
            parcels: treeData?.total_parcels || 3,
            buildings: treeData?.total_buildings || 3,
            units: treeData?.total_units || 4,
            qualityIndex: 94.2,
            conflicts: 2,
          }}
        />

        {/* Progressive Multi-Level Spatial Breadcrumb Navigation */}
        <WorkspaceBreadcrumb
          currentLevel={currentLevel}
          parcelName={parcelDisplayName}
          buildingName={buildingDisplayName}
          floorName={floorDisplayName}
          unitName={unitDisplayName}
          roomName={roomDisplayName}
          elementName={elementDisplayName}
          onNavigateToLevel={handleSelectLevel}
          onUpOneLevel={handleUpOneLevel}
          isLeftPanelCollapsed={isLeftPanelCollapsed}
          isRightPanelOpen={isRightPanelOpen}
        />

        {/* Floating Left Spatial Control Panel [Layers | Outliner | Tools] */}
        <LeftSpatialControlPanel
          layers={layers}
          onToggleLayer={handleToggleLayer}
          currentLevel={currentLevel}
          selectedParcelId={selectedParcelId}
          selectedBuildingId={selectedBuildingId}
          selectedFloorId={selectedFloorId}
          selectedUnitId={selectedUnitId}
          selectedRoomId={selectedRoomId}
          selectedElementId={selectedElementId}
          treeData={treeData}
          isLoadingTree={isLoadingTree}
          onSelectLevel={handleSelectLevel}
          onOpenExtractionModal={() => setIsExtractionModalOpen(true)}
          onSetCameraPreset={(preset) => {
            setCameraPreset(preset);
            setTimeout(() => setCameraPreset(null), 100);
          }}
          measurementActive={activeSpatialTool === "MEASURE"}
          onToggleMeasurement={() => handleSelectTool("MEASURE")}
          measurementResult={
            measurementResult
              ? {
                  distance: measurementResult.distance || 0,
                  heightDelta: measurementResult.heightDelta || 0,
                }
              : null
          }
          isCollapsed={isLeftPanelCollapsed}
          onToggleCollapse={() => setIsLeftPanelCollapsed((p) => !p)}
        />

        {/* Interactive Spatial Compass (linked to Camera Heading) */}
        <div
          className="fixed top-20 z-20 transition-all duration-300 pointer-events-auto"
          style={{
            right: isRightPanelOpen || comparisonState.isActive ? "440px" : "18px",
          }}
        >
          <SpatialCompass
            heading={cameraTelemetry.heading}
            onResetNorth={() => {
              setCameraPreset("NORTH");
              setTimeout(() => setCameraPreset(null), 100);
            }}
          />
        </div>

        {/* Dynamic Metric Spatial Scale Bar */}
        <div className="fixed bottom-10 right-4 z-20 pointer-events-none">
          <SpatialScaleBar altitude={cameraTelemetry.altitude} pitch={cameraTelemetry.pitch} />
        </div>

        {/* Floating 3D Measurement HUD */}
        {activeSpatialTool === "MEASURE" && (
          <SpatialErrorBoundary compact fallbackTitle="Measurement Tool Glitch" onReset={() => setActiveSpatialTool("SELECT")}>
            <MeasurementHUD
              mode={measurementMode}
              onSelectMode={(m) => setMeasurementMode(m)}
              result={measurementResult}
              pointCount={measurementResult?.pointCount || 0}
              onClear={() => setMeasurementResult(null)}
              onClose={() => setActiveSpatialTool("SELECT")}
            />
          </SpatialErrorBoundary>
        )}

        {/* Floating 3D Spatial Comparison Drawer */}
        {(activeSpatialTool === "COMPARE" || comparisonState.isActive) && (
          <SpatialErrorBoundary fallbackTitle="Comparison Drawer Error" onReset={handleCloseCompare}>
            <SpatialComparisonDrawer
              comparisonState={comparisonState}
              onClose={handleCloseCompare}
              onFocusEntityA={() => {
                if (comparisonState.entityA?.entityId) {
                  setCameraPreset("FIT");
                  setTimeout(() => setCameraPreset(null), 100);
                }
              }}
              onFocusEntityB={() => {
                if (comparisonState.entityB?.entityId) {
                  setCameraPreset("FIT");
                  setTimeout(() => setCameraPreset(null), 100);
                }
              }}
              onSelectEntityB={handleSelectCompareEntity}
            />
          </SpatialErrorBoundary>
        )}

        {/* Floating Right Contextual Intelligence Panel */}
        {isRightPanelOpen && !comparisonState.isActive && (
          <RightContextualPanel
            currentLevel={currentLevel}
            selectedParcelId={selectedParcelId}
            selectedBuildingId={selectedBuildingId}
            selectedFloorId={selectedFloorId}
            selectedUnitId={selectedUnitId}
            selectedRoomId={selectedRoomId}
            selectedElementId={selectedElementId}
            selectedInfrastructureId={selectedInfrastructureId}
            treeData={treeData}
            isolateBuilding={isolateBuilding}
            isolateFloor={isolateFloor}
            explodeFloors={explodeFloors}
            onToggleIsolateBuilding={() => setIsolateBuilding((prev) => !prev)}
            onToggleIsolateFloor={(iso) => setIsolateFloor(iso)}
            onToggleExplodeFloors={() => setExplodeFloors((prev) => !prev)}
            onClose={() => setIsRightPanelOpen(false)}
            onMinimize={() => setIsRightPanelOpen(false)}
            isMinimized={!isRightPanelOpen}
            onSelectLevel={handleSelectLevel}
            onFocusEntity={(id) => handleSelectLevel("BUILDING", id)}
            onOpenAI={() => setIsAIModalOpen(true)}
            onMeasureConflict={handleMeasureConflict}
            onOpenAIWithQuery={handleOpenAIWithQuery}
            precomputedSelection={{
              selection,
              activeParcel,
              activeBuilding,
              activeFloor,
              activeUnit,
              activeRoom,
              activeElement,
            }}
          />
        )}

        {/* Floating 3D Spatial Selection Anchor / HUD Badge (when inspector is closed or minimized) */}
        {!isRightPanelOpen && !comparisonState.isActive && (
          <SpatialAnchorBadge
            selection={selection}
            isMinimized={true}
            onRestoreInspector={() => setIsRightPanelOpen(true)}
            onClearSelection={() => handleSelectLevel("CITY")}
          />
        )}

        {/* Floating Bottom Spatial Tool Strip */}
        <BottomSpatialToolStrip
          activeTool={activeSpatialTool}
          onSelectTool={handleSelectTool}
          onToggleLayers={() => setIsLeftPanelCollapsed((prev) => !prev)}
          onOpenAI={() => setIsAIModalOpen(true)}
          onResetCamera={() => {
            setCameraPreset("BUILDING");
            setTimeout(() => setCameraPreset(null), 100);
          }}
          onSetCameraPreset={(preset) => {
            setCameraPreset(preset);
            setTimeout(() => setCameraPreset(null), 100);
          }}
          onNavigate2D={() => {
            router.push(`/properties?parcel=${selectedParcelId || "66666666-6666-4000-8000-000000000102"}`);
          }}
        />

        {/* Floating 4D Temporal Timeline */}
        {activeSpatialTool === "TIMELINE" && (
          <BottomTemporalTimeline
            selectedYear={temporalYear}
            onSelectYear={(yr) => setTemporalYear(yr)}
            onClose={() => setActiveSpatialTool("SELECT")}
          />
        )}

        {/* Grounded AI Spatial Investigator Floating Modal */}
        <AISpatialInvestigatorModal
          isOpen={isAIModalOpen}
          onClose={() => {
            setIsAIModalOpen(false);
            setAiInitialPrompt(null);
          }}
          onFocusEntity={(id) => handleSelectLevel("BUILDING", id)}
          onHighlightEntities={(ids) => setAiHighlightEntityIds(ids)}
          contextEntity={selection}
          initialPrompt={aiInitialPrompt}
        />

        {/* AI Building Extraction & 3D Generation Modal */}
        <AIExtractionModal
          isOpen={isExtractionModalOpen}
          onClose={() => setIsExtractionModalOpen(false)}
          onExtractionComplete={handleExtractionComplete}
        />
      </div>
    </ProtectedRoute>
  );
}

export default function City3DPage() {
  return (
    <Suspense
      fallback={
        <SpatialLoadingRoller
          fullScreen={true}
          label="Loading 3D City Workspace"
          subtitle="Fetching volumetric massing, parcel boundaries & spatial lineage..."
        />
      }
    >
      <City3DContent />
    </Suspense>
  );
}
