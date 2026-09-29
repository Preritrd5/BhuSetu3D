"use client";

/**
 * BhuSetu 3D Immersive Cesium Digital Twin Viewer
 * Multi-Level Spatial Property Intelligence & Digital-Twin Visualization
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Compass, Plus, Minus, RefreshCw, Box, Layers, Ruler } from "lucide-react";
import { WebGLFallback } from "./WebGLFallback";
import { SpatialLoadingRoller } from "../common/SpatialLoadingRoller";
import { CARTO_BASEMAP_CONFIG } from "@/lib/carto";
import { LayerVisibilityState } from "../workspace/LeftSpatialControlPanel";

function isWebGLSupported(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}
import { SpatialLevel } from "../workspace/WorkspaceBreadcrumb";
import {
  SpatialToolType,
  MeasurementMode,
  MeasurementResult,
  CameraTelemetry,
  CameraViewPreset,
} from "@/types/tools";
import {
  Spatial3DSourceResolver,
  SpatialSourceStatus,
  UrbanBuildingDefinition,
  UrbanParcelDefinition,
  UrbanRoadCorridor,
  UrbanInfrastructureLine,
  URBAN_PARCELS,
  URBAN_BUILDINGS,
  URBAN_ROADS,
  URBAN_INFRASTRUCTURE,
  URBAN_VEGETATION_TREES,
  URBAN_STREET_LAMPS,
  getUrbanBuildingById,
  getUrbanParcelById,
  getPrimaryDemonstrationBuilding,
  RenderContext,
  RenderedEntityCollections,
  renderGroundApron,
  renderRoadNetwork,
  renderParcels as renderParcelsRenderer,
  renderBuildings as renderBuildingsRenderer,
  renderTransitViaduct,
  renderUtilities as renderUtilitiesRenderer,
  renderVegetation as renderVegetationRenderer,
  renderStreetLamps as renderStreetLampsRenderer,
} from "@/lib/cesium";

interface CesiumViewerProps {
  currentLevel: SpatialLevel;
  selectedBuildingId: string | null;
  selectedParcelId: string | null;
  selectedFloorId: string | null;
  selectedUnitId?: string | null;
  selectedRoomId: string | null;
  selectedElementId: string | null;
  selectedCorridorId?: string | null;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  isolateBuilding?: boolean;
  isolateFloor?: boolean;
  explodeFloors?: boolean;
  onToggleIsolateBuilding?: () => void;
  onToggleIsolateFloor?: () => void;
  onToggleExplodeFloors?: () => void;
  layers?: LayerVisibilityState;
  temporalYear?: number;
  cameraPreset?: CameraViewPreset | null;
  measurementActive?: boolean;
  measurementMode?: MeasurementMode;
  onMeasurementComplete?: (result: { distance: number; heightDelta: number } | null) => void;
  onMeasurementUpdate?: (result: MeasurementResult | null) => void;
  onTelemetryChange?: (telemetry: CameraTelemetry) => void;
  comparisonEntityBId?: string | null;
  onSelectCompareEntity?: (level: SpatialLevel, id: string) => void;
  activeTool?: SpatialToolType;
  highlightEntityIds?: string[];
  treeData?: any;
  onSourceStatusChange?: (status: SpatialSourceStatus) => void;
  isRightPanelOpen?: boolean;
}

// Backward-compatibility aliases for existing sub-component references
const PRIMARY_BUILDINGS = URBAN_BUILDINGS.map((b) => ({
  id: b.legacyId || b.buildingId,
  code: b.code,
  name: b.name,
  height: b.height,
  sanctionedHeight: b.sanctionedHeight,
  floors: b.floorCount,
  hasConflict: !!b.hasConflict,
  coords: b.footprint,
  centroid: b.centroid,
}));

const CANONICAL_PARCELS = URBAN_PARCELS.map((p) => ({
  id: p.legacyId || p.parcelId,
  ulpin: p.ulpin,
  survey: p.surveyNumber,
  coords: p.footprint,
}));

const CANONICAL_UTILITIES = URBAN_INFRASTRUCTURE.map((u) => ({
  id: u.id,
  name: u.name,
  category: u.category,
  color: u.color,
  width: u.width,
  coords: u.coords,
}));

export const CesiumViewer: React.FC<CesiumViewerProps> = ({
  currentLevel,
  selectedBuildingId,
  selectedParcelId,
  selectedFloorId,
  selectedUnitId,
  selectedRoomId,
  selectedElementId,
  selectedCorridorId,
  onSelectLevel,
  isolateBuilding = false,
  isolateFloor = false,
  explodeFloors = false,
  onToggleIsolateBuilding,
  onToggleIsolateFloor,
  onToggleExplodeFloors,
  layers = {
    buildings: true,
    parcels: true,
    floors: true,
    units: true,
    subsurfaceUtilities: true,
    conflicts: true,
    temporalDiff: true,
  },
  temporalYear = 2026,
  cameraPreset = null,
  measurementActive = false,
  measurementMode = "DISTANCE",
  onMeasurementComplete,
  onMeasurementUpdate,
  onTelemetryChange,
  comparisonEntityBId = null,
  onSelectCompareEntity,
  activeTool = "SELECT",
  highlightEntityIds = [],
  treeData,
  onSourceStatusChange,
  isRightPanelOpen = false,
}) => {
  const { token } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const CesiumRef = useRef<any>(null);

  const treeDataRef = useRef(treeData);
  treeDataRef.current = treeData;
  const onSourceStatusChangeRef = useRef(onSourceStatusChange);
  onSourceStatusChangeRef.current = onSourceStatusChange;

  const sourceResolverRef = useRef<Spatial3DSourceResolver>(new Spatial3DSourceResolver());
  const [sourceStatus, setSourceStatus] = useState<SpatialSourceStatus>(sourceResolverRef.current.getStatus());

  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;
  const measurementActiveRef = useRef(measurementActive);
  measurementActiveRef.current = measurementActive;
  const measurementModeRef = useRef(measurementMode);
  measurementModeRef.current = measurementMode;
  const currentLevelRef = useRef(currentLevel);
  currentLevelRef.current = currentLevel;
  const onSelectCompareEntityRef = useRef(onSelectCompareEntity);
  onSelectCompareEntityRef.current = onSelectCompareEntity;
  const onSelectLevelRef = useRef(onSelectLevel);
  onSelectLevelRef.current = onSelectLevel;
  const onTelemetryChangeRef = useRef(onTelemetryChange);
  onTelemetryChangeRef.current = onTelemetryChange;
  const selectedBuildingIdRef = useRef(selectedBuildingId);
  selectedBuildingIdRef.current = selectedBuildingId;
  const selectedParcelIdRef = useRef(selectedParcelId);
  selectedParcelIdRef.current = selectedParcelId;

  const entitiesMapRef = useRef<Map<string, any>>(new Map());
  const cityEntitiesRef = useRef<any[]>([]);
  const parcelsMapRef = useRef<Map<string, any>>(new Map());
  const utilitiesMapRef = useRef<Map<string, any>>(new Map());
  const interiorEntitiesRef = useRef<any[]>([]);
  const explodedEntitiesRef = useRef<any[]>([]);
  const radarRingsRef = useRef<any[]>([]);
  const roofEquipmentRef = useRef<any[]>([]);
  const streetVegetationRef = useRef<any[]>([]);
  const facadeElementsRef = useRef<any[]>([]);
  const groundGridRef = useRef<any[]>([]);
  const streetLampsRef = useRef<any[]>([]);
  const measurementEntitiesRef = useRef<any[]>([]);
  const flyoverEntitiesRef = useRef<any[]>([]);
  const spatialCalloutsRef = useRef<any[]>([]);
  const setbackBuffersRef = useRef<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [webGLError, setWebGLError] = useState<string | null>(null);
  const [totalBuildingsCount, setTotalBuildingsCount] = useState(0);
  const [cameraAltitude, setCameraAltitude] = useState<number>(88);

  const measurePointsRef = useRef<any[]>([]);
  const screenSpaceHandlerRef = useRef<any>(null);
  const removeCameraListenerRef = useRef<(() => void) | null>(null);

  // 1. Initialize Cesium 3D Viewport
  useEffect(() => {
    let isMounted = true;

    async function initCesium() {
      if (typeof window === "undefined" || !containerRef.current) return;

      try {
        if (!isWebGLSupported()) {
          if (isMounted) {
            setIsLoading(false);
            setWebGLError("WebGL hardware acceleration is disabled or unavailable in this browser session.");
          }
          return;
        }

        (window as any).CESIUM_BASE_URL = "/cesium";
        const Cesium = await import("cesium");
        CesiumRef.current = Cesium;

        // Recovery Phase 1: Optional External Cesium Ion Token Configuration
        const ionToken = (process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || "").trim();
        if (ionToken) {
          try {
            Cesium.Ion.defaultAccessToken = ionToken;
            console.log("[OPTIONAL] Cesium Ion access token configured. Optional context active.");
          } catch (e) {
            console.warn("[OPTIONAL] Failed to configure Cesium Ion access token:", e);
          }
        } else {
          try {
            Cesium.Ion.defaultAccessToken = "";
          } catch {}
          console.log("[CORE] No external Cesium Ion token configured. Running in 100% native BhuSetu mode.");
        }

        if (!document.getElementById("cesium-widgets-css")) {
          const link = document.createElement("link");
          link.id = "cesium-widgets-css";
          link.rel = "stylesheet";
          link.href = "/cesium/Widgets/widgets.css";
          document.head.appendChild(link);
        }

        if (!containerRef.current || !isMounted) return;

        // 1. Core Base Imagery: Authenticated CARTO dark basemap with subdomains and safe error interception
        const imageryProvider = new Cesium.UrlTemplateImageryProvider({
          url: CARTO_BASEMAP_CONFIG.getCesiumTileUrl(),
          subdomains: CARTO_BASEMAP_CONFIG.subdomains,
          credit: CARTO_BASEMAP_CONFIG.attribution,
          maximumLevel: 19,
        });

        if (imageryProvider.errorEvent) {
          imageryProvider.errorEvent.addEventListener((err: any) => {
            // Suppress unhandled tile load errors to prevent Cesium default alert popups
            console.warn("[OPTIONAL] Base imagery tile notice. Continuing with native digital-twin canvas.", err?.message || err);
          });
        }

        // 2. Core Terrain: Native EllipsoidTerrainProvider (100% offline, requires 0 API keys and 0 external network requests)
        const terrainProvider = new Cesium.EllipsoidTerrainProvider();

        const viewer = new Cesium.Viewer(containerRef.current, {
          baseLayer: new Cesium.ImageryLayer(imageryProvider),
          terrainProvider: terrainProvider,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          animation: false,
          navigationHelpButton: false,
          fullscreenButton: false,
          shadows: true,
        });

        // Suppress Cesium's intrusive default modal error dialog
        if (viewer.cesiumWidget) {
          viewer.cesiumWidget.showErrorPanel = (title: string, message: string, error: any) => {
            console.warn(`[BHUSETU_3D] Cesium non-fatal notice: ${title} - ${message}`, error);
          };
        }

        console.log("[CORE] Cesium initialized");
        console.log("[CORE] BhuSetu native spatial geometry pipeline ready.");

        // 3. Connect & Apply 3D Source Resolver (BhuSetu Native, External Provider, Hybrid, Fallback)
        sourceResolverRef.current.subscribeStatus((st) => {
          if (isMounted) {
            setSourceStatus(st);
            if (onSourceStatusChangeRef.current) {
              onSourceStatusChangeRef.current(st);
            }
          }
        });

        sourceResolverRef.current.resolveAndApplySource(viewer, Cesium, {
          treeData: treeDataRef.current,
          selectedBuildingId: selectedBuildingIdRef.current,
          selectedParcelId: selectedParcelIdRef.current,
          config: {
            cesiumIonToken: (process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || "").trim(),
            googleMapsApiKey: (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim(),
          },
        }).catch((err) => {
          console.warn("[SOURCE_RESOLVER] Non-fatal source resolution warning:", err);
        });

        viewer.shadows = true;
        viewer.terrainShadows = Cesium.ShadowMode.ENABLED;

        // Cinematic Directional Key Light (Warm sunlight angled from upper-west for architectural relief and depth)
        viewer.scene.light = new Cesium.DirectionalLight({
          direction: new Cesium.Cartesian3(-0.62, 0.42, -0.66),
          color: Cesium.Color.fromCssColorString("#FFFDF5"),
          intensity: 2.4,
        });

        viewer.scene.globe.enableLighting = true;
        viewer.scene.highDynamicRange = true;
        if (viewer.scene.postProcessStages?.fxaa) {
          viewer.scene.postProcessStages.fxaa.enabled = true;
        }

        // Realistic Horizon Atmospheric Depth Fog (subtle depth gradient across urban matrix)
        viewer.scene.fog.enabled = true;
        viewer.scene.fog.density = 0.00028;
        viewer.scene.fog.screenSpaceErrorFactor = 2.0;
        viewer.scene.fog.minimumBrightness = 0.12;

        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#060A12");
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#040711");
        viewer.scene.globe.depthTestAgainstTerrain = false;

        // Camera: Elevated Oblique 3/4 Perspective framing the multi-building property block and primary hero building
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(77.57060, 12.99620, 120.0),
          orientation: {
            heading: Cesium.Math.toRadians(36.0),
            pitch: Cesium.Math.toRadians(-30.0),
            roll: 0.0,
          },
        });

        // Interactive 3D Picking Handler (Multi-Level Selection)
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        screenSpaceHandlerRef.current = handler;

        handler.setInputAction((click: any) => {
          if (measurementActiveRef.current || activeToolRef.current === "MEASURE") {
            let cartesian: any = viewer.scene.pickPosition(click.position);
            if (!cartesian) {
              const ray = viewer.camera.getPickRay(click.position);
              if (ray) cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            }
            if (cartesian) handleMeasurementClick(cartesian, Cesium, viewer);
            return;
          }

          const pickedObject = viewer.scene.pick(click.position);
          if (Cesium.defined(pickedObject)) {
            // Section 13: External buildings are NOT automatically BhuSetu buildings
            const meta = sourceResolverRef.current.inspectPickedObject(pickedObject.id || pickedObject);
            if (meta.isExternalContext) {
              console.log(
                `[PICKING] External 3D Context selected (${meta.sourceAttribution}). Contextual only (Not an authoritative BhuSetu property).`
              );
              // External objects remain classified as EXTERNAL 3D CONTEXT - never assign ULPIN or property ID
              return;
            }

            if (pickedObject.id) {
              const picked = pickedObject.id;

            // In COMPARE mode, assign entity to Object B if comparison callback is available
            if (activeToolRef.current === "COMPARE" && onSelectCompareEntityRef.current) {
              if (picked._bhuBuildingId) {
                onSelectCompareEntityRef.current("BUILDING", picked._bhuBuildingId);
                return;
              } else if (picked._bhuParcelId) {
                onSelectCompareEntityRef.current("PARCEL", picked._bhuParcelId);
                return;
              }
            }

            if (picked._bhuInfrastructureId) {
              onSelectLevelRef.current("INFRASTRUCTURE", picked._bhuInfrastructureId);
            } else if (picked._bhuElementId) {
              onSelectLevelRef.current("ELEMENT", picked._bhuElementId);
            } else if (picked._bhuRoomId) {
              onSelectLevelRef.current("ROOM", picked._bhuRoomId);
            } else if (picked._bhuUnitId) {
              onSelectLevelRef.current("UNIT", picked._bhuUnitId);
            } else if (picked._bhuCorridorId) {
              onSelectLevelRef.current("CORRIDOR", picked._bhuCorridorId);
            } else if (picked._bhuFloorId) {
              onSelectLevelRef.current("FLOOR", picked._bhuFloorId);
            } else if (picked._bhuBuildingId) {
              onSelectLevelRef.current("BUILDING", picked._bhuBuildingId);
            } else if (picked._bhuParcelId) {
              onSelectLevelRef.current("PARCEL", picked._bhuParcelId);
            }
          }
        } else {
            // Clicking empty canvas steps back up one level
            const lvl = currentLevelRef.current;
            if (lvl === "ELEMENT") onSelectLevelRef.current("ROOM");
            else if (lvl === "ROOM" || lvl === "CORRIDOR") onSelectLevelRef.current("UNIT");
            else if (lvl === "UNIT") onSelectLevelRef.current("FLOOR");
            else if (lvl === "FLOOR") onSelectLevelRef.current("BUILDING");
            else if (lvl === "BUILDING") onSelectLevelRef.current("PARCEL");
            else onSelectLevelRef.current("CITY");
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Track Altitude, Heading & Pitch Telemetry
        removeCameraListenerRef.current = viewer.camera.changed.addEventListener(() => {
          if (viewer.camera) {
            const carto = Cesium.Cartographic.fromCartesian(viewer.camera.position);
            if (carto) {
              const alt = Math.round(carto.height);
              setCameraAltitude(alt);
              if (onTelemetryChangeRef.current) {
                const headingDeg = Cesium.Math.toDegrees(viewer.camera.heading);
                const pitchDeg = Cesium.Math.toDegrees(viewer.camera.pitch);
                onTelemetryChangeRef.current({
                  heading: Math.round(((headingDeg % 360) + 360) % 360),
                  pitch: Math.round(pitchDeg),
                  altitude: alt,
                });
              }
            }
          }
        });

        viewerRef.current = viewer;
        if (isMounted) setIsLoading(false);
      } catch (err: any) {
        console.error("Failed to initialize Cesium 3D:", err);
        if (isMounted) {
          setIsLoading(false);
          setWebGLError(err?.message || "Failed to initialize Cesium 3D graphics engine.");
        }
      }
    }

    initCesium();

    return () => {
      isMounted = false;
      if (removeCameraListenerRef.current) {
        try {
          removeCameraListenerRef.current();
        } catch {}
        removeCameraListenerRef.current = null;
      }
      if (screenSpaceHandlerRef.current && !screenSpaceHandlerRef.current.isDestroyed()) {
        try {
          screenSpaceHandlerRef.current.destroy();
        } catch {}
        screenSpaceHandlerRef.current = null;
      }

      measurePointsRef.current = [];
      measurementEntitiesRef.current = [];
      // eslint-disable-next-line react-hooks/exhaustive-deps
      entitiesMapRef.current.clear();
      cityEntitiesRef.current = [];
      roofEquipmentRef.current = [];
      explodedEntitiesRef.current = [];
      facadeElementsRef.current = [];
      groundGridRef.current = [];
      flyoverEntitiesRef.current = [];
      radarRingsRef.current = [];
      setbackBuffersRef.current = [];
      streetVegetationRef.current = [];
      streetLampsRef.current = [];
      // eslint-disable-next-line react-hooks/exhaustive-deps
      parcelsMapRef.current.clear();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      utilitiesMapRef.current.clear();
      interiorEntitiesRef.current = [];
      spatialCalloutsRef.current = [];

      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (sourceResolverRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        sourceResolverRef.current.cleanup(viewerRef.current);
      }

      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        try {
          viewerRef.current.destroy();
        } catch {}
        viewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase 7: Multi-Mode 3D Measurement Handler (Distance, Height Delta, Planar Area)
  const handleMeasurementClick = (cartesian: any, Cesium: any, viewer: any) => {
    const currentMode = measurementModeRef.current || "DISTANCE";
    measurePointsRef.current.push(cartesian);
    const ptIndex = measurePointsRef.current.length;

    // Add marker pin for the clicked vertex
    const pin = viewer.entities.add({
      position: cartesian,
      point: {
        pixelSize: 10,
        color: Cesium.Color.fromCssColorString("#F97316"),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: currentMode === "AREA" ? `V${ptIndex}` : `P${ptIndex}`,
        font: "bold 10px monospace",
        fillColor: Cesium.Color.WHITE,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString("#090E17").withAlpha(0.92),
        pixelOffset: new Cesium.Cartesian2(0, -16),
      },
    });
    measurementEntitiesRef.current.push(pin);

    if (currentMode === "DISTANCE") {
      if (measurePointsRef.current.length === 2) {
        const p1 = measurePointsRef.current[0];
        const p2 = measurePointsRef.current[1];
        const dist = Cesium.Cartesian3.distance(p1, p2);
        const c1 = Cesium.Cartographic.fromCartesian(p1);
        const c2 = Cesium.Cartographic.fromCartesian(p2);
        const heightDelta = Math.abs(c2.height - c1.height);

        // Horizontal ground distance calculation
        const meanLat = (c1.latitude + c2.latitude) / 2;
        const dx = (c2.longitude - c1.longitude) * 6378137 * Math.cos(meanLat);
        const dy = (c2.latitude - c1.latitude) * 6378137;
        const horizDist = Math.sqrt(dx * dx + dy * dy);

        const lineEntity = viewer.entities.add({
          polyline: {
            positions: [p1, p2],
            width: 3.5,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.fromCssColorString("#F97316"),
              dashLength: 10.0,
            }),
          },
        });
        measurementEntitiesRef.current.push(lineEntity);

        const midpoint = Cesium.Cartesian3.midpoint(p1, p2, new Cesium.Cartesian3());
        const labelEntity = viewer.entities.add({
          position: midpoint,
          label: {
            text: `${dist.toFixed(2)} m (ΔZ: ${heightDelta.toFixed(2)}m)`,
            font: "bold 11px monospace",
            fillColor: Cesium.Color.fromCssColorString("#F97316"),
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString("#090E17").withAlpha(0.92),
            pixelOffset: new Cesium.Cartesian2(0, -12),
          },
        });
        measurementEntitiesRef.current.push(labelEntity);

        if (onMeasurementComplete) {
          onMeasurementComplete({ distance: dist, heightDelta });
        }
        if (onMeasurementUpdate) {
          onMeasurementUpdate({
            mode: "DISTANCE",
            distance: dist,
            horizontalDistance: horizDist,
            heightDelta,
            pointCount: 2,
            formattedValue: `${dist.toFixed(2)} m`,
            isComplete: true,
          });
        }
      }
    } else if (currentMode === "HEIGHT") {
      if (measurePointsRef.current.length === 2) {
        const p1 = measurePointsRef.current[0];
        const p2 = measurePointsRef.current[1];
        const c1 = Cesium.Cartographic.fromCartesian(p1);
        const c2 = Cesium.Cartographic.fromCartesian(p2);
        const heightDelta = Math.abs(c2.height - c1.height);
        const dist = Cesium.Cartesian3.distance(p1, p2);

        // Elevated Cartesian point directly above p1 at c2.height
        const p1Elevated = Cesium.Cartesian3.fromRadians(c1.longitude, c1.latitude, c2.height);

        // Vertical leader line
        const verticalLine = viewer.entities.add({
          polyline: {
            positions: [p1, p1Elevated],
            width: 3.5,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.fromCssColorString("#F97316"),
              dashLength: 8.0,
            }),
          },
        });
        measurementEntitiesRef.current.push(verticalLine);

        // Horizontal connector from elevated p1 to p2
        const horizontalLine = viewer.entities.add({
          polyline: {
            positions: [p1Elevated, p2],
            width: 2.0,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.fromCssColorString("#38BDF8"),
              dashLength: 6.0,
            }),
          },
        });
        measurementEntitiesRef.current.push(horizontalLine);

        // Label at vertical leader midpoint
        const verticalMidpoint = Cesium.Cartesian3.midpoint(p1, p1Elevated, new Cesium.Cartesian3());
        const labelEntity = viewer.entities.add({
          position: verticalMidpoint,
          label: {
            text: `ΔHeight: ${heightDelta.toFixed(2)} m`,
            font: "bold 12px monospace",
            fillColor: Cesium.Color.fromCssColorString("#F97316"),
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString("#090E17").withAlpha(0.92),
            pixelOffset: new Cesium.Cartesian2(40, 0),
          },
        });
        measurementEntitiesRef.current.push(labelEntity);

        if (onMeasurementComplete) {
          onMeasurementComplete({ distance: dist, heightDelta });
        }
        if (onMeasurementUpdate) {
          onMeasurementUpdate({
            mode: "HEIGHT",
            heightDelta,
            distance: dist,
            pointCount: 2,
            formattedValue: `Δh ${heightDelta.toFixed(2)} m`,
            isComplete: true,
          });
        }
      }
    } else if (currentMode === "AREA") {
      // In AREA mode, connect consecutive vertices
      const pts = measurePointsRef.current;
      if (pts.length >= 2) {
        const segLine = viewer.entities.add({
          polyline: {
            positions: [pts[pts.length - 2], pts[pts.length - 1]],
            width: 2.5,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.fromCssColorString("#F97316"),
              dashLength: 8.0,
            }),
          },
        });
        measurementEntitiesRef.current.push(segLine);
      }

      if (pts.length >= 3) {
        // Remove prior dynamic closing lines, area polygon, or centroid label
        measurementEntitiesRef.current = measurementEntitiesRef.current.filter((e) => {
          if ((e as any)._isAreaDynamic) {
            viewer.entities.remove(e);
            return false;
          }
          return true;
        });

        // Convert to local ENU plane coordinates for exact Shoelace area calculation
        const cartos = pts.map((p: any) => Cesium.Cartographic.fromCartesian(p));
        const meanLng = cartos.reduce((s: number, c: any) => s + c.longitude, 0) / cartos.length;
        const meanLat = cartos.reduce((s: number, c: any) => s + c.latitude, 0) / cartos.length;
        const maxH = Math.max(...cartos.map((c: any) => c.height));
        const cosLat = Math.cos(meanLat);
        const R = 6378137;

        const xyPoints = cartos.map((c: any) => ({
          x: (c.longitude - meanLng) * R * cosLat,
          y: (c.latitude - meanLat) * R,
        }));

        let area = 0;
        let perimeter = 0;
        const n = xyPoints.length;
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          area += xyPoints[i].x * xyPoints[j].y;
          area -= xyPoints[j].x * xyPoints[i].y;
          const dx = xyPoints[j].x - xyPoints[i].x;
          const dy = xyPoints[j].y - xyPoints[i].y;
          perimeter += Math.sqrt(dx * dx + dy * dy);
        }
        area = Math.abs(area) / 2;

        // Closing loop polyline
        const closingLine = viewer.entities.add({
          polyline: {
            positions: [pts[pts.length - 1], pts[0]],
            width: 2.5,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.fromCssColorString("#F97316").withAlpha(0.7),
              dashLength: 8.0,
            }),
          },
        });
        (closingLine as any)._isAreaDynamic = true;
        measurementEntitiesRef.current.push(closingLine);

        // Filled translucent polygon surface
        const poly = viewer.entities.add({
          polygon: {
            hierarchy: pts,
            material: Cesium.Color.fromCssColorString("#F97316").withAlpha(0.32),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString("#F97316"),
            outlineWidth: 2.0,
          },
        });
        (poly as any)._isAreaDynamic = true;
        measurementEntitiesRef.current.push(poly);

        // Centroid area label
        const centroidPos = Cesium.Cartesian3.fromRadians(meanLng, meanLat, maxH + 1.5);
        const labelEntity = viewer.entities.add({
          position: centroidPos,
          label: {
            text: `Area: ${area.toFixed(2)} m²\nPerimeter: ${perimeter.toFixed(2)} m`,
            font: "bold 11px monospace",
            fillColor: Cesium.Color.fromCssColorString("#F97316"),
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString("#090E17").withAlpha(0.92),
            pixelOffset: new Cesium.Cartesian2(0, 0),
          },
        });
        (labelEntity as any)._isAreaDynamic = true;
        measurementEntitiesRef.current.push(labelEntity);

        if (onMeasurementUpdate) {
          onMeasurementUpdate({
            mode: "AREA",
            area,
            perimeter,
            pointCount: pts.length,
            formattedValue: `${area.toFixed(2)} m²`,
            isComplete: true,
          });
        }
      }
    }
  };

  // Keyboard Escape Handler (Clear Active Element / Exit Isolation / Step Up)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (explodeFloors && onToggleExplodeFloors) {
          onToggleExplodeFloors();
        } else if (isolateFloor && onToggleIsolateFloor) {
          onToggleIsolateFloor();
        } else if (isolateBuilding && onToggleIsolateBuilding) {
          onToggleIsolateBuilding();
        } else {
          if (currentLevel === "ELEMENT") onSelectLevel("ROOM");
          else if (currentLevel === "ROOM" || currentLevel === "CORRIDOR") onSelectLevel("UNIT");
          else if (currentLevel === "UNIT") onSelectLevel("FLOOR");
          else if (currentLevel === "FLOOR") onSelectLevel("BUILDING");
          else if (currentLevel === "BUILDING") onSelectLevel("PARCEL");
          else onSelectLevel("CITY");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentLevel,
    explodeFloors,
    isolateFloor,
    isolateBuilding,
    onSelectLevel,
    onToggleExplodeFloors,
    onToggleIsolateFloor,
    onToggleIsolateBuilding,
  ]);

  useEffect(() => {
    if (viewerRef.current) {
      measurementEntitiesRef.current.forEach((e) => viewerRef.current.entities.remove(e));
      measurementEntitiesRef.current = [];
      measurePointsRef.current = [];
      if (!measurementActive && onMeasurementUpdate) {
        onMeasurementUpdate(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurementActive, measurementMode]);

  // 2. Render Primary Buildings, Dense Urban Matrix & Infrastructure Corridors
  const renderBuildings = useCallback(() => {
    const viewer = viewerRef.current;
    const Cesium = CesiumRef.current;
    if (!viewer || !Cesium) return;

    // Clear primary buildings
    entitiesMapRef.current.forEach((e) => viewer.entities.remove(e));
    entitiesMapRef.current.clear();

    // Clear urban matrix surrounding buildings
    cityEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    cityEntitiesRef.current = [];

    // Clear rooftop equipment
    roofEquipmentRef.current.forEach((e) => viewer.entities.remove(e));
    roofEquipmentRef.current = [];

    // Clear exploded floor entities
    explodedEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    explodedEntitiesRef.current = [];

    // Clear facade elements, ground grid & flyover entities
    facadeElementsRef.current.forEach((e) => viewer.entities.remove(e));
    facadeElementsRef.current = [];
    groundGridRef.current.forEach((e) => viewer.entities.remove(e));
    groundGridRef.current = [];
    flyoverEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    flyoverEntitiesRef.current = [];

    if (!layers.buildings) return;

    const collections: RenderedEntityCollections = {
      groundGrid: groundGridRef.current,
      roads: groundGridRef.current,
      parcels: parcelsMapRef.current,
      buildings: entitiesMapRef.current,
      cityEntities: cityEntitiesRef.current,
      facadeElements: facadeElementsRef.current,
      roofEquipment: roofEquipmentRef.current,
      explodedEntities: explodedEntitiesRef.current,
      flyoverEntities: flyoverEntitiesRef.current,
      utilities: utilitiesMapRef.current,
      vegetation: streetVegetationRef.current,
      streetLamps: streetLampsRef.current,
    };

    const ctx: RenderContext = {
      viewer,
      Cesium,
      selectedBuildingId,
      selectedParcelId,
      selectedFloorId,
      comparisonEntityBId,
      highlightEntityIds,
      currentLevel,
      isolateBuilding,
      isolateFloor,
      explodeFloors,
      temporalYear,
      layers,
    };

    // 1. Cadastral Studio Floor
    renderGroundApron(viewer, Cesium, collections);

    // 2. Hierarchical Road Network (Dual-lane 8th Main, 7th Main, Cross Streets, Sidewalks, Zebra Crossings)
    renderRoadNetwork(viewer, Cesium, URBAN_ROADS, collections);

    // 3. Elevated Transit Viaduct (Metro Viaduct Corridor)
    renderTransitViaduct(viewer, Cesium, collections);

    // 4. Multi-Typology 3D Buildings (Type A, B, C, D with vertical floor divisions & primary demo hero detailing)
    renderBuildingsRenderer(viewer, Cesium, URBAN_BUILDINGS, ctx, collections);

    setTotalBuildingsCount(URBAN_BUILDINGS.length);
    console.log(
      `[CORE] BhuSetu native spatial geometry loaded (${URBAN_BUILDINGS.length} multi-typology buildings, ${URBAN_PARCELS.length} parcels, road corridors).`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedBuildingId,
    selectedParcelId,
    selectedFloorId,
    comparisonEntityBId,
    layers.buildings,
    layers.conflicts,
    temporalYear,
    currentLevel,
    isolateBuilding,
    isolateFloor,
    explodeFloors,
    highlightEntityIds,
  ]);

  useEffect(() => {
    if (!isLoading) {
      renderBuildings();
    }
  }, [isLoading, renderBuildings]);

  // 3. Cadastral Lot Paving, Municipal Setback Clearance Buffers & Survey Pins
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = CesiumRef.current;
    if (!viewer || !Cesium) return;

    radarRingsRef.current.forEach((r) => viewer.entities.remove(r));
    radarRingsRef.current = [];
    setbackBuffersRef.current.forEach((r) => viewer.entities.remove(r));
    setbackBuffersRef.current = [];

    if (selectedBuildingId) {
      const selectedBld = getUrbanBuildingById(selectedBuildingId) || URBAN_BUILDINGS[0];
      const selectedPcl = (selectedParcelId ? getUrbanParcelById(selectedParcelId) : undefined) ||
        (selectedBld ? getUrbanParcelById(selectedBld.parcelId) : undefined) ||
        URBAN_PARCELS[0];

      if (selectedPcl) {
        // A. Paved Parcel Lot Pad (Dark slate paving stone at base)
        const pclCoords: number[] = [];
        selectedPcl.footprint.forEach(([pLng, pLat]) => pclCoords.push(pLng, pLat));

        const lotPad = viewer.entities.add({
          name: `Paved Lot Pad - ${selectedPcl.surveyNumber}`,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(pclCoords),
            height: 0.02,
            extrudedHeight: 0.05,
            material: Cesium.Color.fromCssColorString("#0B121E"),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString("#1E293B"),
            outlineWidth: 1.0,
          },
        });
        setbackBuffersRef.current.push(lotPad);

        // B. Corner Survey Pin Monuments at Parcel Vertices
        selectedPcl.footprint.slice(0, 4).forEach(([cLng, cLat], idx) => {
          const pin = viewer.entities.add({
            name: `Cadastral Survey Monument Pin #${idx + 1}`,
            position: Cesium.Cartesian3.fromDegrees(cLng, cLat, 0.35),
            cylinder: {
              length: 0.7,
              topRadius: 0.14,
              bottomRadius: 0.18,
              material: Cesium.Color.fromCssColorString("#F59E0B"), // Brass monument marker
              outline: true,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 1.5,
            },
          });
          setbackBuffersRef.current.push(pin);
        });

        // C. Architectural Municipal Setback Clearance Buffer Guides (Authoritative Setbacks)
        const fp = selectedPcl.footprint;
        if (fp.length >= 4) {
          const minLng = Math.min(...fp.map((p) => p[0]));
          const maxLng = Math.max(...fp.map((p) => p[0]));
          const minLat = Math.min(...fp.map((p) => p[1]));
          const maxLat = Math.max(...fp.map((p) => p[1]));
          const dLat = (maxLat - minLat) * 0.08;

          // 5.0m Front Setback Clearance Guide (Dashed Teal Line)
          const frontSetback = viewer.entities.add({
            name: "Municipal Front Setback Guide",
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                minLng + 0.00005, minLat + dLat, 0.15,
                maxLng - 0.00005, minLat + dLat, 0.15,
              ]),
              width: 3.0,
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.fromCssColorString("#14B8A6"),
                dashLength: 12.0,
              }),
            },
          });
          setbackBuffersRef.current.push(frontSetback);

          // 10.0m Rear / Side Clearance Guide (Dashed Sky Blue Line)
          const rearSetback = viewer.entities.add({
            name: "Municipal Rear Setback Guide",
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                minLng + 0.00005, maxLat - dLat, 0.15,
                maxLng - 0.00005, maxLat - dLat, 0.15,
              ]),
              width: 3.0,
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.fromCssColorString("#38BDF8"),
                dashLength: 12.0,
              }),
            },
          });
          setbackBuffersRef.current.push(rearSetback);

          // D. In-Scene Setback Compliance Tag
          const setbackTag = viewer.entities.add({
            name: "Setback Compliance Annotation",
            position: Cesium.Cartesian3.fromDegrees((minLng + maxLng) / 2, minLat + dLat, 1.2),
            label: {
              text: `SETBACK: ${selectedBld?.hasConflict ? "VIOLATION DETECTED" : "COMPLIANT"}`,
              font: "bold 10px monospace",
              fillColor: selectedBld?.hasConflict
                ? Cesium.Color.fromCssColorString("#EF4444")
                : Cesium.Color.fromCssColorString("#2DD4BF"),
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString("#090E17").withAlpha(0.92),
              backgroundPadding: new Cesium.Cartesian2(6, 4),
              pixelOffset: new Cesium.Cartesian2(0, 0),
            },
          });
          setbackBuffersRef.current.push(setbackTag);
        }
      }
    }
  }, [selectedBuildingId, selectedParcelId]);

  // 4. Naturalistic Urban Shade Canopy Trees & Dual-Head Street Lamps
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = CesiumRef.current;
    if (!viewer || !Cesium) return;

    streetVegetationRef.current.forEach((e) => viewer.entities.remove(e));
    streetVegetationRef.current = [];
    streetLampsRef.current.forEach((e) => viewer.entities.remove(e));
    streetLampsRef.current = [];

    const collections: RenderedEntityCollections = {
      groundGrid: groundGridRef.current,
      roads: groundGridRef.current,
      parcels: parcelsMapRef.current,
      buildings: entitiesMapRef.current,
      cityEntities: cityEntitiesRef.current,
      facadeElements: facadeElementsRef.current,
      roofEquipment: roofEquipmentRef.current,
      explodedEntities: explodedEntitiesRef.current,
      flyoverEntities: flyoverEntitiesRef.current,
      utilities: utilitiesMapRef.current,
      vegetation: streetVegetationRef.current,
      streetLamps: streetLampsRef.current,
    };

    renderVegetationRenderer(viewer, Cesium, URBAN_VEGETATION_TREES, collections);
    renderStreetLampsRenderer(viewer, Cesium, URBAN_STREET_LAMPS, collections);
  }, [isLoading]);

  // 5. Cadastral Parcels Layer with Paved Lot Pads & Landscaped Setbacks
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = CesiumRef.current;
    if (!viewer || !Cesium) return;

    parcelsMapRef.current.forEach((e) => viewer.entities.remove(e));
    parcelsMapRef.current.clear();

    if (!layers.parcels) return;

    const collections: RenderedEntityCollections = {
      groundGrid: groundGridRef.current,
      roads: groundGridRef.current,
      parcels: parcelsMapRef.current,
      buildings: entitiesMapRef.current,
      cityEntities: cityEntitiesRef.current,
      facadeElements: facadeElementsRef.current,
      roofEquipment: roofEquipmentRef.current,
      explodedEntities: explodedEntitiesRef.current,
      flyoverEntities: flyoverEntitiesRef.current,
      utilities: utilitiesMapRef.current,
      vegetation: streetVegetationRef.current,
      streetLamps: streetLampsRef.current,
    };

    const ctx: RenderContext = {
      viewer,
      Cesium,
      selectedBuildingId,
      selectedParcelId,
      comparisonEntityBId,
      highlightEntityIds,
      currentLevel,
      isolateBuilding,
      isolateFloor,
      explodeFloors,
      temporalYear,
      layers,
    };

    renderParcelsRenderer(viewer, Cesium, URBAN_PARCELS, ctx, collections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers.parcels, selectedParcelId, isLoading]);

  // 6. Subsurface Utilities Layer
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = CesiumRef.current;
    if (!viewer || !Cesium) return;

    utilitiesMapRef.current.forEach((e) => viewer.entities.remove(e));
    utilitiesMapRef.current.clear();

    if (!layers.subsurfaceUtilities) return;

    const collections: RenderedEntityCollections = {
      groundGrid: groundGridRef.current,
      roads: groundGridRef.current,
      parcels: parcelsMapRef.current,
      buildings: entitiesMapRef.current,
      cityEntities: cityEntitiesRef.current,
      facadeElements: facadeElementsRef.current,
      roofEquipment: roofEquipmentRef.current,
      explodedEntities: explodedEntitiesRef.current,
      flyoverEntities: flyoverEntitiesRef.current,
      utilities: utilitiesMapRef.current,
      vegetation: streetVegetationRef.current,
      streetLamps: streetLampsRef.current,
    };

    const ctx: RenderContext = {
      viewer,
      Cesium,
      selectedBuildingId,
      selectedParcelId,
      comparisonEntityBId,
      highlightEntityIds,
      currentLevel,
      isolateBuilding,
      isolateFloor,
      explodeFloors,
      temporalYear,
      layers,
    };

    renderUtilitiesRenderer(viewer, Cesium, URBAN_INFRASTRUCTURE, ctx, collections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers.subsurfaceUtilities, isLoading]);

  // 7. Floor Cutaway & Multi-Level Sub-Space Interaction (Floor 03 Interior)
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = CesiumRef.current;
    if (!viewer || !Cesium) return;

    interiorEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    interiorEntitiesRef.current = [];

    const isCutawayLevel =
      currentLevel === "FLOOR" ||
      currentLevel === "UNIT" ||
      currentLevel === "ROOM" ||
      currentLevel === "CORRIDOR" ||
      currentLevel === "ELEMENT";

    if (!isCutawayLevel || !selectedBuildingId) return;

    // Determine floor elevation band based on selectedFloorId (7 Floors, 4.0m per floor)
    const FL_HEIGHT = 4.0;
    const FL_GAP = 2.0;

    const SEVEN_FLOOR_CONFIGS: Record<string, {
      index: number;
      label: string;
      code: string;
      unitAId: string;
      unitALabel: string;
      unitBId: string;
      unitBLabel: string;
      doorAId: string;
      doorBId: string;
      doorBLabel: string;
      windowAId: string;
      windowBId: string;
      isAuthoritative?: boolean;
    }> = {
      "FL-01": {
        index: 0,
        label: "Floor 01 (Ground Lobby & Retail Concourse)",
        code: "FL-01",
        unitAId: "unit-101",
        unitALabel: "Unit 101 · Grand Entrance Lobby & Reception",
        unitBId: "unit-102",
        unitBLabel: "Unit 102 · Retail Arcade & Cafe Concourse",
        doorAId: "door-101",
        doorBId: "door-102",
        doorBLabel: "Door D-102 (Retail Concourse Entry)",
        windowAId: "window-101",
        windowBId: "window-102",
        isAuthoritative: false,
      },
      "FL-02": {
        index: 1,
        label: "Floor 02 (Commercial Banking & Advisory)",
        code: "FL-02",
        unitAId: "unit-201",
        unitALabel: "Unit 201 · Commercial Banking Operations",
        unitBId: "unit-202",
        unitBLabel: "Unit 202 · Private Wealth Client Suites",
        doorAId: "door-201",
        doorBId: "door-202",
        doorBLabel: "Door D-202 (Advisory Access)",
        windowAId: "window-201",
        windowBId: "window-202",
        isAuthoritative: false,
      },
      "FL-03": {
        index: 2,
        label: "Floor 03 (Executive Suite · Cadastral Discrepancy)",
        code: "FL-03",
        unitAId: "unit-301",
        unitALabel: "Unit 301 · Board Conference Hall",
        unitBId: "unit-302",
        unitBLabel: "Unit 302 · Executive Office Suite",
        doorAId: "door-301",
        doorBId: "door-302",
        doorBLabel: "Door D-302-A (Egress Door)",
        windowAId: "window-301",
        windowBId: "window-302",
        isAuthoritative: true, // Surveyed cadastral floor with conflict
      },
      "FL-04": {
        index: 3,
        label: "Floor 04 (Tech Workstations & Open Office)",
        code: "FL-04",
        unitAId: "unit-401",
        unitALabel: "Unit 401 · Open Tech Collaboration Studio",
        unitBId: "unit-402",
        unitBLabel: "Unit 402 · Scrum & Meeting Pods",
        doorAId: "door-401",
        doorBId: "door-402",
        doorBLabel: "Door D-402 (Studio Entry)",
        windowAId: "window-401",
        windowBId: "window-402",
        isAuthoritative: false,
      },
      "FL-05": {
        index: 4,
        label: "Floor 05 (Corporate Legal & Advisory)",
        code: "FL-05",
        unitAId: "unit-501",
        unitALabel: "Unit 501 · Corporate Legal Advisory",
        unitBId: "unit-502",
        unitBLabel: "Unit 502 · Senior Partner Chambers",
        doorAId: "door-501",
        doorBId: "door-502",
        doorBLabel: "Door D-502 (Chambers Entry)",
        windowAId: "window-501",
        windowBId: "window-502",
        isAuthoritative: false,
      },
      "FL-06": {
        index: 5,
        label: "Floor 06 (Innovation & R&D Hub)",
        code: "FL-06",
        unitAId: "unit-601",
        unitALabel: "Unit 601 · Advanced R&D Laboratory",
        unitBId: "unit-602",
        unitBLabel: "Unit 602 · Prototyping & Design Studio",
        doorAId: "door-601",
        doorBId: "door-602",
        doorBLabel: "Door D-602 (Lab Security Door)",
        windowAId: "window-601",
        windowBId: "window-602",
        isAuthoritative: false,
      },
      "FL-07": {
        index: 6,
        label: "Floor 07 (Sky Lounge & Executive Boardroom)",
        code: "FL-07",
        unitAId: "unit-701",
        unitALabel: "Unit 701 · Sky Lounge & Reception Atrium",
        unitBId: "unit-702",
        unitBLabel: "Unit 702 · Panoramic Boardroom & CEO Chamber",
        doorAId: "door-701",
        doorBId: "door-702",
        doorBLabel: "Door D-702 (Boardroom Glass Double Door)",
        windowAId: "window-701",
        windowBId: "window-702",
        isAuthoritative: false,
      },
    };

    const cfg = (selectedFloorId && SEVEN_FLOOR_CONFIGS[selectedFloorId])
      ? SEVEN_FLOOR_CONFIGS[selectedFloorId]
      : SEVEN_FLOOR_CONFIGS["FL-03"]; // Default to FL-03

    const floorIndex = cfg.index;
    const floorBaseM = explodeFloors
      ? floorIndex * (FL_HEIGHT + FL_GAP)
      : floorIndex * FL_HEIGHT;

    const zBase = floorBaseM;
    const zCeil = floorBaseM + FL_HEIGHT;

    // A. Concrete Floor Slab Deck (Light Slate Gray with perimeter outline)
    const floorSlabEntity = viewer.entities.add({
      name: `${cfg.label} Concrete Slab Deck`,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray([
          77.57206, 12.99835,
          77.57236, 12.99835,
          77.57236, 12.99985,
          77.57206, 12.99985,
          77.57206, 12.99835,
        ]),
        height: zBase,
        extrudedHeight: zBase + 0.35,
        material: Cesium.Color.fromCssColorString("#94A3B8").withAlpha(0.95),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#CBD5E1"),
        outlineWidth: 1.5,
      },
    });
    (floorSlabEntity as any)._bhuFloorId = cfg.code;
    interiorEntitiesRef.current.push(floorSlabEntity);

    // B. Central Vertical Circulation Core: Dual Elevators + Fire Staircase
    // Dual Elevator Shafts Enclosure (Concrete core)
    const elevatorShaft = viewer.entities.add({
      name: `${cfg.code} Elevator Shaft Core (2 Cabs)`,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray([
          77.57217, 12.99912,
          77.57225, 12.99912,
          77.57225, 12.99926,
          77.57217, 12.99926,
          77.57217, 12.99912,
        ]),
        height: zBase + 0.35,
        extrudedHeight: zCeil,
        material: Cesium.Color.fromCssColorString("#334155").withAlpha(0.95),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#64748B"),
        outlineWidth: 1.5,
      },
    });
    (elevatorShaft as any)._bhuElementId = "elevator-core";
    interiorEntitiesRef.current.push(elevatorShaft);

    // Elevator Doors (facing corridor)
    const elevatorDoors = viewer.entities.add({
      name: `${cfg.code} Stainless Steel Elevator Landing Doors`,
      corridor: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          77.57218, 12.99926,
          77.57224, 12.99926,
        ]),
        width: 0.18,
        height: zBase + 0.35,
        extrudedHeight: zBase + 2.30,
        material: Cesium.Color.fromCssColorString("#38BDF8").withAlpha(0.85),
        outline: true,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1.5,
      },
    });
    (elevatorDoors as any)._bhuElementId = "elevator-doors";
    interiorEntitiesRef.current.push(elevatorDoors);

    // Fire Egress Staircase Shaft Enclosure
    const stairwellShaft = viewer.entities.add({
      name: `${cfg.code} Fire Egress Stairwell Shaft`,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray([
          77.57211, 12.99912,
          77.57216, 12.99912,
          77.57216, 12.99926,
          77.57211, 12.99926,
          77.57211, 12.99912,
        ]),
        height: zBase + 0.35,
        extrudedHeight: zCeil,
        material: Cesium.Color.fromCssColorString("#1E293B").withAlpha(0.92),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#475569"),
        outlineWidth: 1.2,
      },
    });
    (stairwellShaft as any)._bhuElementId = "stairwell-core";
    interiorEntitiesRef.current.push(stairwellShaft);

    // C. Unit B / Room B (East Suite)
    const isUnitBActive =
      currentLevel === "UNIT"
        ? (selectedUnitId === cfg.unitBId || selectedRoomId === cfg.unitBId || selectedRoomId === `room-${cfg.unitBId.replace("unit-", "")}`)
        : (selectedRoomId === `room-${cfg.unitBId.replace("unit-", "")}` || selectedElementId === cfg.doorBId || selectedElementId === cfg.windowBId);

    const roomBWalls = viewer.entities.add({
      name: `${cfg.unitBLabel} Partition Walls`,
      corridor: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          77.57222, 12.9984,
          77.57235, 12.9984,
          77.57235, 12.9990,
          77.57222, 12.9990,
          77.57222, 12.9984,
        ]),
        width: 0.15,
        height: zBase + 0.35,
        extrudedHeight: zCeil,
        material: isUnitBActive
          ? Cesium.Color.fromCssColorString("#C47B50").withAlpha(0.95)
          : Cesium.Color.fromCssColorString("#334155").withAlpha(0.92),
        outline: true,
        outlineColor: isUnitBActive
          ? Cesium.Color.fromCssColorString("#B56E48")
          : Cesium.Color.fromCssColorString("#64748B"),
        outlineWidth: 1.5,
      },
    });
    (roomBWalls as any)._bhuRoomId = `room-${cfg.unitBId.replace("unit-", "")}`;
    (roomBWalls as any)._bhuUnitId = cfg.unitBId;
    interiorEntitiesRef.current.push(roomBWalls);

    // Unit B Carpet surface
    const roomBCarpet = viewer.entities.add({
      name: cfg.unitBLabel,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray([
          77.57222, 12.9984,
          77.57235, 12.9984,
          77.57235, 12.9990,
          77.57222, 12.9990,
          77.57222, 12.9984,
        ]),
        height: zBase + 0.36,
        extrudedHeight: zBase + 0.42,
        material: isUnitBActive
          ? Cesium.Color.fromCssColorString("#B56E48").withAlpha(currentLevel === "UNIT" ? 0.65 : 0.40)
          : currentLevel === "UNIT"
          ? Cesium.Color.fromCssColorString("#1E293B").withAlpha(0.15)
          : Cesium.Color.fromCssColorString("#23847D").withAlpha(0.25),
        outline: true,
        outlineColor: isUnitBActive
          ? Cesium.Color.fromCssColorString("#C47B50")
          : currentLevel === "UNIT"
          ? Cesium.Color.fromCssColorString("#334155")
          : Cesium.Color.fromCssColorString("#23847D"),
        outlineWidth: isUnitBActive ? 2.5 : 1.0,
      },
    });
    (roomBCarpet as any)._bhuRoomId = `room-${cfg.unitBId.replace("unit-", "")}`;
    (roomBCarpet as any)._bhuUnitId = cfg.unitBId;
    interiorEntitiesRef.current.push(roomBCarpet);

    // D. Unit A / Room A (West Suite)
    const isUnitAActive =
      currentLevel === "UNIT"
        ? (selectedUnitId === cfg.unitAId || selectedRoomId === cfg.unitAId || selectedRoomId === `room-${cfg.unitAId.replace("unit-", "")}`)
        : (selectedRoomId === `room-${cfg.unitAId.replace("unit-", "")}` || selectedElementId === cfg.doorAId || selectedElementId === cfg.windowAId);

    const roomAWalls = viewer.entities.add({
      name: `${cfg.unitALabel} Partition Walls`,
      corridor: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          77.57207, 12.9984,
          77.57220, 12.9984,
          77.57220, 12.9990,
          77.57207, 12.9990,
          77.57207, 12.9984,
        ]),
        width: 0.15,
        height: zBase + 0.35,
        extrudedHeight: zCeil,
        material: isUnitAActive
          ? Cesium.Color.fromCssColorString("#23847D").withAlpha(0.95)
          : Cesium.Color.fromCssColorString("#334155").withAlpha(0.92),
        outline: true,
        outlineColor: isUnitAActive
          ? Cesium.Color.fromCssColorString("#2EB8B0")
          : Cesium.Color.fromCssColorString("#64748B"),
        outlineWidth: 1.5,
      },
    });
    (roomAWalls as any)._bhuRoomId = `room-${cfg.unitAId.replace("unit-", "")}`;
    (roomAWalls as any)._bhuUnitId = cfg.unitAId;
    interiorEntitiesRef.current.push(roomAWalls);

    // Unit A Carpet
    const roomACarpet = viewer.entities.add({
      name: cfg.unitALabel,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray([
          77.57207, 12.9984,
          77.57220, 12.9984,
          77.57220, 12.9990,
          77.57207, 12.9990,
          77.57207, 12.9984,
        ]),
        height: zBase + 0.36,
        extrudedHeight: zBase + 0.42,
        material: isUnitAActive
          ? Cesium.Color.fromCssColorString("#23847D").withAlpha(currentLevel === "UNIT" ? 0.60 : 0.40)
          : currentLevel === "UNIT"
          ? Cesium.Color.fromCssColorString("#1E293B").withAlpha(0.15)
          : Cesium.Color.fromCssColorString("#334155").withAlpha(0.20),
        outline: true,
        outlineColor: isUnitAActive
          ? Cesium.Color.fromCssColorString("#2EB8B0")
          : currentLevel === "UNIT"
          ? Cesium.Color.fromCssColorString("#334155")
          : Cesium.Color.fromCssColorString("#64748B"),
        outlineWidth: isUnitAActive ? 2.5 : 1.0,
      },
    });
    (roomACarpet as any)._bhuRoomId = `room-${cfg.unitAId.replace("unit-", "")}`;
    (roomACarpet as any)._bhuUnitId = cfg.unitAId;
    interiorEntitiesRef.current.push(roomACarpet);

    // E. Central Egress Corridor / Hall
    const isCorridorSelected = currentLevel === "CORRIDOR";
    const corridorEntity = viewer.entities.add({
      name: `${cfg.label} Egress Corridor`,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray([
          77.57207, 12.9991,
          77.57235, 12.9991,
          77.57235, 12.9997,
          77.57207, 12.9997,
          77.57207, 12.9991,
        ]),
        height: zBase + 0.36,
        extrudedHeight: zBase + 0.40,
        material: isCorridorSelected
          ? Cesium.Color.fromCssColorString("#C47B50").withAlpha(0.35)
          : Cesium.Color.fromCssColorString("#64748B").withAlpha(0.22),
        outline: true,
        outlineColor: isCorridorSelected
          ? Cesium.Color.fromCssColorString("#C47B50")
          : Cesium.Color.fromCssColorString("#94A3B8"),
        outlineWidth: 1.5,
      },
    });
    (corridorEntity as any)._bhuCorridorId = `corridor-${cfg.code.toLowerCase()}`;
    interiorEntitiesRef.current.push(corridorEntity);

    // F. Door Elements: Door B (e.g. door-302) and Door A
    const isDoorBSelected = selectedElementId === cfg.doorBId;
    const doorBEntity = viewer.entities.add({
      name: cfg.doorBLabel,
      corridor: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          77.57222, 12.9990,
          77.57226, 12.9990,
        ]),
        width: 0.18,
        height: zBase + 0.35,
        extrudedHeight: zBase + 2.40,
        material: isDoorBSelected
          ? Cesium.Color.fromCssColorString("#C47B50").withAlpha(0.95)
          : Cesium.Color.fromCssColorString("#C47B50").withAlpha(0.70),
        outline: true,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2.0,
      },
    });
    (doorBEntity as any)._bhuElementId = cfg.doorBId;
    interiorEntitiesRef.current.push(doorBEntity);

    // G. Windows: Facade Glazing Window (e.g. window-302)
    const isWindowBSelected = selectedElementId === cfg.windowBId;
    const windowBEntity = viewer.entities.add({
      name: `${cfg.code} Facade Window Unit East`,
      corridor: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          77.57235, 12.99850,
          77.57235, 12.99890,
        ]),
        width: 0.12,
        height: zBase + 0.90,
        extrudedHeight: zBase + 2.50,
        material: isWindowBSelected
          ? Cesium.Color.fromCssColorString("#38BDF8").withAlpha(0.95)
          : Cesium.Color.fromCssColorString("#0284C7").withAlpha(0.55),
        outline: true,
        outlineColor: isWindowBSelected ? Cesium.Color.WHITE : Cesium.Color.fromCssColorString("#38BDF8"),
        outlineWidth: 2.0,
      },
    });
    (windowBEntity as any)._bhuElementId = cfg.windowBId;
    interiorEntitiesRef.current.push(windowBEntity);

    // H. Structural Columns (C-1, C-2)
    [
      [77.57214, 12.9990],
      [77.57228, 12.9990],
    ].forEach(([cLng, cLat], idx) => {
      const colEntity = viewer.entities.add({
        name: `Structural Column C-${idx + 1}`,
        cylinder: {
          length: zCeil - zBase,
          topRadius: 0.25,
          bottomRadius: 0.25,
          material: Cesium.Color.fromCssColorString("#64748B"),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString("#94A3B8"),
        },
        position: Cesium.Cartesian3.fromDegrees(cLng, cLat, zBase + (zCeil - zBase) / 2),
      });
      interiorEntitiesRef.current.push(colEntity);
    });

    // I. Unit Centroid 3D Point Markers
    [
      { id: cfg.unitAId, no: cfg.unitALabel.split(" · ")[0], lng: 77.572135, lat: 12.9987 },
      { id: cfg.unitBId, no: cfg.unitBLabel.split(" · ")[0], lng: 77.572285, lat: 12.9987 },
    ].forEach((u) => {
      const isThisUnitActive =
        currentLevel === "UNIT"
          ? (selectedUnitId === u.id || selectedRoomId === u.id)
          : (selectedRoomId === (u.id === cfg.unitAId ? `room-${cfg.unitAId.replace("unit-", "")}` : `room-${cfg.unitBId.replace("unit-", "")}`));

      const unitEntity = viewer.entities.add({
        name: u.no,
        position: Cesium.Cartesian3.fromDegrees(u.lng, u.lat, zBase + 1.2),
        point: {
          pixelSize: isThisUnitActive ? 13 : 9,
          color: isThisUnitActive
            ? Cesium.Color.fromCssColorString(u.id === cfg.unitAId ? "#23847D" : "#C47B50")
            : Cesium.Color.fromCssColorString("#64748B"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: u.no,
          font: isThisUnitActive ? "bold 12px monospace" : "10px monospace",
          fillColor: isThisUnitActive ? Cesium.Color.WHITE : Cesium.Color.fromCssColorString("#94A3B8"),
          showBackground: true,
          backgroundColor: isThisUnitActive
            ? Cesium.Color.fromCssColorString("#090E17").withAlpha(0.95)
            : Cesium.Color.fromCssColorString("#111827").withAlpha(0.75),
          pixelOffset: new Cesium.Cartesian2(0, -18),
        },
      });
      (unitEntity as any)._bhuUnitId = u.id;
      interiorEntitiesRef.current.push(unitEntity);
    });
  }, [currentLevel, selectedBuildingId, selectedFloorId, selectedUnitId, selectedRoomId, selectedElementId, explodeFloors, isolateFloor]);

  // 7.5 In-Scene 3D Spatial Callout Leader Pins (Elevated Glassmorphic Badges & Centroid Leaders)
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = CesiumRef.current;
    if (!viewer || !Cesium) return;

    spatialCalloutsRef.current.forEach((e) => viewer.entities.remove(e));
    spatialCalloutsRef.current = [];

    // Only render high-fidelity callout pins in BUILDING, FLOOR, or UNIT levels
    const isDetailView =
      currentLevel === "BUILDING" ||
      currentLevel === "FLOOR" ||
      currentLevel === "UNIT" ||
      currentLevel === "ROOM" ||
      currentLevel === "ELEMENT";

    if (!isDetailView || !selectedBuildingId) return;

    const zBase = explodeFloors ? 14.0 : 3.6;

    const callouts = [
      {
        id: "unit-302",
        name: "Callout: Unit 302",
        x: 77.572285,
        y: 12.99870,
        zGround: zBase + 0.5,
        zElevated: zBase + 8.5,
        title: "UNIT 302 · EXECUTIVE SUITE | 24.8 m²",
        subtitle: "Meridian Capital · Verified PostGIS Cadastral Unit",
        color: "#F97316",
        isActive: selectedUnitId === "unit-302" || selectedRoomId === "room-302",
      },
      {
        id: "unit-301",
        name: "Callout: Unit 301",
        x: 77.572135,
        y: 12.99870,
        zGround: zBase + 0.5,
        zElevated: zBase + 8.5,
        title: "UNIT 301 · CONFERENCE HALL | 32.5 m²",
        subtitle: "Occupancy: 28 Persons · Active Commercial Lease",
        color: "#00F0FF",
        isActive: selectedUnitId === "unit-301" || selectedRoomId === "room-301",
      },
      {
        id: "solar-array",
        name: "Callout: Solar Array",
        x: 77.57224,
        y: 12.99970,
        zGround: 14.5 + 0.5,
        zElevated: 14.5 + 5.5,
        title: "PHOTOVOLTAIC SOLAR ARRAY | 14.2 kWp",
        subtitle: "Net-Metered Microgrid · BBMP Bylaw Compliant",
        color: "#38BDF8",
        isActive: false,
      },
    ];

    callouts.forEach((c) => {
      // 1. Sleek Vertical Leader Polyline
      const leader = viewer.entities.add({
        name: `${c.name} Leader`,
        polyline: {
          positions: [
            Cesium.Cartesian3.fromDegrees(c.x, c.y, c.zGround),
            Cesium.Cartesian3.fromDegrees(c.x, c.y, c.zElevated),
          ],
          width: c.isActive ? 2.0 : 1.2,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString(c.color).withAlpha(c.isActive ? 0.95 : 0.70),
            dashLength: 8.0,
          }),
        },
      });
      spatialCalloutsRef.current.push(leader);

      // 2. Base Centroid Anchor Node
      const baseNode = viewer.entities.add({
        name: `${c.name} Anchor`,
        position: Cesium.Cartesian3.fromDegrees(c.x, c.y, c.zGround),
        point: {
          pixelSize: c.isActive ? 8 : 5,
          color: Cesium.Color.fromCssColorString(c.color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1.5,
        },
      });
      spatialCalloutsRef.current.push(baseNode);

      // 3. Elevated Glassmorphic Callout Billboard Badge
      const calloutBadge = viewer.entities.add({
        name: `${c.name} Badge`,
        position: Cesium.Cartesian3.fromDegrees(c.x, c.y, c.zElevated),
        point: {
          pixelSize: c.isActive ? 9 : 6,
          color: Cesium.Color.fromCssColorString(c.color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2.0,
        },
        label: {
          text: `${c.title}\n${c.subtitle}`,
          font: c.isActive ? "bold 11px monospace" : "10px monospace",
          fillColor: Cesium.Color.WHITE,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString("#090E17").withAlpha(c.isActive ? 0.95 : 0.85),
          backgroundPadding: new Cesium.Cartesian2(8, 5),
          pixelOffset: new Cesium.Cartesian2(0, -22),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        },
      });
      (calloutBadge as any)._bhuUnitId = c.id;
      spatialCalloutsRef.current.push(calloutBadge);
    });
  }, [currentLevel, selectedBuildingId, selectedUnitId, selectedRoomId, explodeFloors]);

  // 8. Smooth Camera Transitions for Multi-Level Spatial Navigation
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = CesiumRef.current;
    if (!viewer || !Cesium) return;

    if (cameraPreset) {
      if (cameraPreset === "CITY") {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(77.5680, 12.9920, 480.0),
          orientation: {
            heading: Cesium.Math.toRadians(35.0),
            pitch: Cesium.Math.toRadians(-35.0),
            roll: 0.0,
          },
          duration: 1.5,
        });
      } else if (cameraPreset === "PARCEL") {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(77.5710, 12.9970, 140.0),
          orientation: {
            heading: Cesium.Math.toRadians(38.0),
            pitch: Cesium.Math.toRadians(-30.0),
            roll: 0.0,
          },
          duration: 1.5,
        });
      } else if (cameraPreset === "BUILDING") {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(77.57121, 12.99820, 42.0),
          orientation: {
            heading: Cesium.Math.toRadians(36.0),
            pitch: Cesium.Math.toRadians(-22.0),
            roll: 0.0,
          },
          duration: 1.5,
        });
      } else if (cameraPreset === "FLOOR") {
        const floorNum = selectedFloorId
          ? parseInt(selectedFloorId.replace("FL-0", "").replace("FL-", "")) || 3
          : 3;
        const floorIndex = Math.max(0, Math.min(6, floorNum - 1));
        const floorMidZ = floorIndex * 4.0 + 2.0;
        const camZ = explodeFloors ? floorIndex * 6.0 + 14.0 : floorMidZ + 14.0;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(77.57121, 12.99840, camZ),
          orientation: {
            heading: Cesium.Math.toRadians(38.0),
            pitch: Cesium.Math.toRadians(-28.0),
            roll: 0.0,
          },
          duration: 1.4,
        });
      } else if (cameraPreset === "ROOM") {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(77.57195, 12.99865, 18.0),
          orientation: {
            heading: Cesium.Math.toRadians(45.0),
            pitch: Cesium.Math.toRadians(-38.0),
            roll: 0.0,
          },
          duration: 1.5,
        });
      } else if (cameraPreset === "UNIT") {
        const isUnit301 = selectedUnitId === "unit-301" || selectedRoomId === "unit-301";
        const targetLng = isUnit301 ? 77.572135 : 77.572285;
        const targetLat = 12.99870;
        const camZ = explodeFloors ? 28.0 : 22.0;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(targetLng - 0.00025, targetLat - 0.00030, camZ),
          orientation: {
            heading: Cesium.Math.toRadians(38.0),
            pitch: Cesium.Math.toRadians(-32.0),
            roll: 0.0,
          },
          duration: 1.2,
        });
      } else if (cameraPreset === "TOP_DOWN") {
        const carto = Cesium.Cartographic.fromCartesian(viewer.camera.position);
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromRadians(
            carto.longitude,
            carto.latitude,
            Math.max(carto.height, 140.0)
          ),
          orientation: {
            heading: 0.0,
            pitch: Cesium.Math.toRadians(-89.9),
            roll: 0.0,
          },
          duration: 1.2,
        });
      } else if (cameraPreset === "NORTH") {
        viewer.camera.flyTo({
          destination: viewer.camera.position,
          orientation: {
            heading: 0.0,
            pitch: viewer.camera.pitch,
            roll: 0.0,
          },
          duration: 0.8,
        });
      } else if (cameraPreset === "FIT") {
        if (selectedBuildingId) {
          const bEntity = entitiesMapRef.current.get(selectedBuildingId);
          if (bEntity) {
            viewer.flyTo(bEntity, {
              offset: new Cesium.HeadingPitchRange(
                Cesium.Math.toRadians(35.0),
                Cesium.Math.toRadians(-30.0),
                75.0
              ),
              duration: 1.2,
            });
          }
        }
      }
    }
  }, [cameraPreset, explodeFloors, selectedUnitId, selectedRoomId, selectedBuildingId]);

  // Automatically respond to currentLevel changes
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = CesiumRef.current;
    if (!viewer || !Cesium) return;

    if (currentLevel === "CITY") {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(77.5680, 12.9920, 480.0),
        orientation: {
          heading: Cesium.Math.toRadians(35.0),
          pitch: Cesium.Math.toRadians(-35.0),
          roll: 0.0,
        },
        duration: 1.5,
      });
    } else if (currentLevel === "REGION") {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(77.5700, 12.9950, 260.0),
        orientation: {
          heading: Cesium.Math.toRadians(36.0),
          pitch: Cesium.Math.toRadians(-32.0),
          roll: 0.0,
        },
        duration: 1.5,
      });
    } else if (currentLevel === "PARCEL") {
      let targetLng = 77.5710;
      let targetLat = 12.9970;
      let targetAlt = 140.0;
      if (selectedParcelId) {
        const pcl = getUrbanParcelById(selectedParcelId);
        if (pcl) {
          targetLng = pcl.centroid[0];
          targetLat = pcl.centroid[1];
          targetAlt = Math.max(Math.sqrt(pcl.areaSqm) * 2.2, 110.0);
        }
      }
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(targetLng - 0.0008, targetLat - 0.0010, targetAlt),
        orientation: {
          heading: Cesium.Math.toRadians(36.0),
          pitch: Cesium.Math.toRadians(-32.0),
          roll: 0.0,
        },
        duration: 1.4,
      });
    } else if (currentLevel === "BUILDING") {
      let targetLng = 77.57221;
      let targetLat = 12.99910;
      let targetAlt = 42.0;
      if (selectedBuildingId) {
        const bld = getUrbanBuildingById(selectedBuildingId);
        if (bld) {
          targetLng = bld.centroid[0];
          targetLat = bld.centroid[1];
          // Close-up inspection distance: ~2× building height, min 32m
          targetAlt = Math.max(bld.height * 2.0, 32.0);
        }
      }
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(targetLng - 0.00055, targetLat - 0.00070, targetAlt),
        orientation: {
          heading: Cesium.Math.toRadians(36.0),
          pitch: Cesium.Math.toRadians(-22.0),
          roll: 0.0,
        },
        duration: 1.4,
      });
    } else if (currentLevel === "FLOOR") {
      // Camera dynamically targets the specific floor (FL-01 to FL-07)
      const floorNum = selectedFloorId
        ? parseInt(selectedFloorId.replace("FL-0", "").replace("FL-", "")) || 3
        : 3;
      const floorIndex = Math.max(0, Math.min(6, floorNum - 1));
      const floorMidZ = floorIndex * 4.0 + 2.0;
      const camZ = explodeFloors ? floorIndex * 6.0 + 14.0 : floorMidZ + 14.0;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(77.57121, 12.99840, camZ),
        orientation: {
          heading: Cesium.Math.toRadians(38.0),
          pitch: Cesium.Math.toRadians(-28.0),
          roll: 0.0,
        },
        duration: 1.4,
      });
    } else if (currentLevel === "UNIT") {
      const isUnit301 = selectedUnitId === "unit-301" || selectedRoomId === "unit-301";
      const targetLng = isUnit301 ? 77.572135 : 77.572285;
      const targetLat = 12.99870;
      const camZ = explodeFloors ? 28.0 : 22.0;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(targetLng - 0.00025, targetLat - 0.00030, camZ),
        orientation: {
          heading: Cesium.Math.toRadians(38.0),
          pitch: Cesium.Math.toRadians(-32.0),
          roll: 0.0,
        },
        duration: 1.2,
      });
    } else if (currentLevel === "ROOM" || currentLevel === "ELEMENT") {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(77.57195, 12.99865, 18.0),
        orientation: {
          heading: Cesium.Math.toRadians(45.0),
          pitch: Cesium.Math.toRadians(-38.0),
          roll: 0.0,
        },
        duration: 1.2,
      });
    }
  }, [currentLevel, selectedBuildingId, selectedParcelId, explodeFloors, selectedUnitId, selectedRoomId]);

  // Camera Zoom Controls
  const handleZoomIn = () => {
    if (viewerRef.current) viewerRef.current.camera.zoomIn(60);
  };
  const handleZoomOut = () => {
    if (viewerRef.current) viewerRef.current.camera.zoomOut(60);
  };
  const handleResetCamera = () => {
    if (viewerRef.current && CesiumRef.current) {
      viewerRef.current.camera.flyTo({
        destination: CesiumRef.current.Cartesian3.fromDegrees(77.57140, 12.99820, 68.0),
        orientation: {
          heading: CesiumRef.current.Math.toRadians(38.0),
          pitch: CesiumRef.current.Math.toRadians(-28.0),
          roll: 0.0,
        },
        duration: 1.5,
      });
    }
  };

  if (webGLError) {
    return (
      <WebGLFallback
        reason={webGLError}
        selectedParcelId={selectedParcelId}
        onRetry={() => {
          setWebGLError(null);
          setIsLoading(true);
        }}
      />
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#0F1210]/95 backdrop-blur-md flex items-center justify-center z-30">
          <SpatialLoadingRoller
            size="lg"
            label="INITIALIZING BHUSETU 3D DIGITAL TWIN"
            subtitle="Streaming 3D tiles, building envelopes & terrain elevation model..."
          />
        </div>
      )}

      {/* Floating Inspection Mode Prompts & Exit Actions */}
      <div className="absolute top-28 inset-x-0 z-20 flex flex-col items-center gap-2 pointer-events-none select-none">
        {isolateFloor && (
          <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-[10px] bg-[#141816]/95 backdrop-blur-md border border-[#B56E48]/60 text-[#C47B50] text-xs font-mono shadow-2xl animate-in fade-in slide-in-from-top-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C47B50] animate-ping" />
            <span className="font-bold tracking-wider">FLOOR ISOLATION ACTIVE</span>
            <span className="text-[#A2B3A8]">· Selected slab 100% visible, non-selected levels ghosted</span>
            {onToggleIsolateFloor && (
              <button
                onClick={onToggleIsolateFloor}
                className="ml-2 px-2.5 py-1 rounded-[6px] bg-[#B56E48] text-[#F4F0E8] text-[11px] font-bold hover:bg-[#C47B50] transition-all"
              >
                Exit Isolation
              </button>
            )}
          </div>
        )}

        {explodeFloors && (
          <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-[10px] bg-[#141816]/95 backdrop-blur-md border border-[#23847D]/60 text-[#23847D] text-xs font-mono shadow-2xl animate-in fade-in slide-in-from-top-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#23847D] animate-ping" />
            <span className="font-bold tracking-wider">3D EXPLODED FLOOR INSPECTION</span>
            <span className="text-[#A2B3A8]">· Visual vertical separation only (PostGIS geometry unaltered)</span>
            {onToggleExplodeFloors && (
              <button
                onClick={onToggleExplodeFloors}
                className="ml-2 px-2.5 py-1 rounded-[6px] bg-[#23847D] text-[#0F1210] text-[11px] font-bold hover:bg-[#2EB8B0] transition-all"
              >
                Reset Building
              </button>
            )}
          </div>
        )}

        {isolateBuilding && (
          <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-[10px] bg-[#141816]/95 backdrop-blur-md border border-[#23847D]/60 text-[#23847D] text-xs font-mono shadow-2xl animate-in fade-in slide-in-from-top-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#23847D] animate-ping" />
            <span className="font-bold tracking-wider">BUILDING ISOLATION ACTIVE</span>
            <span className="text-[#A2B3A8]">· Surrounding urban matrix subdued</span>
            {onToggleIsolateBuilding && (
              <button
                onClick={onToggleIsolateBuilding}
                className="ml-2 px-2.5 py-1 rounded-[6px] bg-[#23847D] text-[#0F1210] text-[11px] font-bold hover:bg-[#2EB8B0] transition-all"
              >
                Exit Isolation
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Camera Toolbar - dynamically coordinated with right inspector safe zone */}
      <div
        className={`absolute top-[68px] z-20 flex flex-col gap-1.5 bg-[#141816]/95 backdrop-blur-md p-1.5 rounded-[10px] border border-[rgba(244,240,232,0.10)] shadow-2xl transition-all duration-300 ${
          isRightPanelOpen ? "right-[436px]" : "right-4"
        }`}
      >
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-[6px] hover:bg-[#1A201D] text-[#D9D2C5] hover:text-[#C47B50] transition-all"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-[6px] hover:bg-[#1A201D] text-[#D9D2C5] hover:text-[#C47B50] transition-all"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCamera}
          className="p-2 rounded-[6px] hover:bg-[#1A201D] text-[#D9D2C5] hover:text-[#C47B50] transition-all"
          title="Reset Camera (Focus Building)"
        >
          <Compass className="w-4 h-4" />
        </button>
        <button
          onClick={renderBuildings}
          className="p-2 rounded-[6px] hover:bg-[#1A201D] text-[#D9D2C5] hover:text-[#C47B50] transition-all"
          title="Refresh 3D Scene"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Quick Inspection Mode Toggles */}
        {onToggleExplodeFloors && (
          <button
            onClick={onToggleExplodeFloors}
            className={`p-2 rounded-[6px] transition-all ${
              explodeFloors
                ? "bg-[#23847D] text-[#0F1210] font-bold shadow-md"
                : "hover:bg-[#1A201D] text-[#D9D2C5] hover:text-[#23847D]"
            }`}
            title={explodeFloors ? "Collapse Floors (Reset Building)" : "Explode Floors (Vertical Separation)"}
          >
            <Layers className="w-4 h-4" />
          </button>
        )}

        {onToggleIsolateFloor && (
          <button
            onClick={onToggleIsolateFloor}
            className={`p-2 rounded-[6px] transition-all ${
              isolateFloor
                ? "bg-[#B56E48] text-[#F4F0E8] font-bold shadow-md"
                : "hover:bg-[#1A201D] text-[#D9D2C5] hover:text-[#C47B50]"
            }`}
            title={isolateFloor ? "Exit Floor Isolation" : "Isolate Current Floor"}
          >
            <Box className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Floating Floor Selector Rail (Visible during Building / Floor Inspection) */}
      {(currentLevel === "BUILDING" ||
        currentLevel === "FLOOR" ||
        currentLevel === "UNIT" ||
        currentLevel === "ROOM" ||
        currentLevel === "ELEMENT" ||
        currentLevel === "CORRIDOR") && selectedBuildingId && (
        <div
          className={`absolute top-[260px] z-20 flex flex-col bg-[#141816]/95 backdrop-blur-md rounded-[10px] border border-[rgba(244,240,232,0.10)] shadow-2xl transition-all duration-300 overflow-hidden w-36 select-none ${
            isRightPanelOpen ? "right-[436px]" : "right-4"
          }`}
        >
          {/* Header */}
          <div className="px-2.5 py-1.5 bg-[#0F1210] border-b border-[rgba(244,240,232,0.08)] flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#A2B3A8] uppercase tracking-wider">
              FLOORS
            </span>
            <span className="text-[9px] font-mono text-[#C47B50] font-bold">7 LEVELS</span>
          </div>

          {/* Floor Items (Rendered top to bottom: FL-07 down to FL-01) */}
          <div className="flex flex-col p-1 gap-0.5 max-h-[340px] overflow-y-auto">
            {[
              {
                id: "FL-07",
                label: "Floor 07",
                sublabel: "Sky Lounge",
                badge: "DEMO",
                badgeColor: "bg-[#23847D]/20 text-[#2EB8B0]",
              },
              {
                id: "FL-06",
                label: "Floor 06",
                sublabel: "R&D Studios",
                badge: "DEMO",
                badgeColor: "bg-[#23847D]/20 text-[#2EB8B0]",
              },
              {
                id: "FL-05",
                label: "Floor 05",
                sublabel: "Corporate Advisory",
                badge: "DEMO",
                badgeColor: "bg-[#23847D]/20 text-[#2EB8B0]",
              },
              {
                id: "FL-04",
                label: "Floor 04",
                sublabel: "Tech Workstations",
                badge: "DEMO",
                badgeColor: "bg-[#23847D]/20 text-[#2EB8B0]",
              },
              {
                id: "FL-03",
                label: "Floor 03",
                sublabel: "Executive Suite",
                badge: "+3m AUTH",
                badgeColor: "bg-rose-900/70 text-rose-200 font-bold",
              },
              {
                id: "FL-02",
                label: "Floor 02",
                sublabel: "Commercial Banking",
                badge: "DEMO",
                badgeColor: "bg-[#23847D]/20 text-[#2EB8B0]",
              },
              {
                id: "FL-01",
                label: "Floor 01",
                sublabel: "Ground Lobby",
                badge: "DEMO",
                badgeColor: "bg-[#23847D]/20 text-[#2EB8B0]",
              },
            ].map((fl) => {
              const isSelected = selectedFloorId === fl.id;
              return (
                <button
                  key={fl.id}
                  onClick={() => onSelectLevel("FLOOR", fl.id)}
                  className={`px-2 py-1 rounded-[5px] text-left transition-all flex items-center justify-between group ${
                    isSelected
                      ? "bg-[#C47B50] text-[#F4F0E8] shadow-md font-bold"
                      : "hover:bg-[#1A201D] text-[#D9D2C5]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono font-semibold">{fl.label}</span>
                      <span
                        className={`text-[8px] font-mono px-1 rounded ${fl.badgeColor}`}
                      >
                        {fl.badge}
                      </span>
                    </div>
                    <span
                      className={`text-[8.5px] block truncate ${
                        isSelected ? "text-[#F4F0E8]/80" : "text-[#77867C]"
                      }`}
                    >
                      {fl.sublabel}
                    </span>
                  </div>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isSelected
                        ? "bg-white"
                        : fl.id === "FL-03"
                        ? "bg-rose-400"
                        : "bg-[#23847D]"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick mode toggles */}
          <div className="px-1.5 py-1 bg-[#0F1210] border-t border-[rgba(244,240,232,0.06)] flex items-center justify-between text-[9px] font-mono">
            {onToggleIsolateFloor && (
              <button
                onClick={onToggleIsolateFloor}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  isolateFloor
                    ? "bg-[#C47B50] text-white font-bold"
                    : "text-[#77867C] hover:text-[#D9D2C5]"
                }`}
                title="Isolate selected floor"
              >
                {isolateFloor ? "ISOLATED" : "ISOLATE"}
              </button>
            )}
            {onToggleExplodeFloors && (
              <button
                onClick={onToggleExplodeFloors}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  explodeFloors
                    ? "bg-[#23847D] text-[#0F1210] font-bold"
                    : "text-[#77867C] hover:text-[#D9D2C5]"
                }`}
                title="Explode all floors vertically"
              >
                {explodeFloors ? "COLLAPSE" : "EXPLODE"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Measurement Mode Prompt Bar (Fallback when onMeasurementUpdate not supplied) */}
      {measurementActive && !onMeasurementUpdate && (
        <div className="absolute top-20 inset-x-0 z-30 flex justify-center pointer-events-none">
          <div className="pointer-events-auto px-4 py-2.5 rounded-[10px] bg-[#141816]/95 backdrop-blur-md border border-[#B56E48]/50 shadow-2xl text-xs font-mono text-[#F4F0E8] flex items-center gap-2">
            <Ruler className="w-4 h-4 text-[#C47B50] animate-pulse" />
            <span>Click any two 3D vertices to compute Euclidean distance & height delta.</span>
          </div>
        </div>
      )}

      {/* Bottom Telemetry Bar */}
      <div className="absolute bottom-0 inset-x-0 h-8 bg-[#0F1210] border-t border-[rgba(244,240,232,0.08)] px-4 flex items-center justify-between z-20 text-[11px] font-mono text-[#6F7772]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-[#23847D]" />
            <span>3D Buildings:</span>
            <span className="text-[#F4F0E8] font-bold">{totalBuildingsCount}</span>
          </span>
          <span className="text-[#6F7772]/40">|</span>
          <span className="text-[#C47B50] font-semibold">
            <span>Level: {currentLevel}</span>
          </span>
          <span className="text-[#6F7772]/40">|</span>
          <span>Altitude: {cameraAltitude} m</span>
          <span className="text-[#6F7772]/40">|</span>
          <span className="text-[#6F7772]">CRS: EPSG:4326 (WGS 84)</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Discreet 3D Source Indicator (Phase 1 Requirement) */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#141816] border border-[rgba(244,240,232,0.12)] text-[10px]"
            title={sourceStatus.message}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                sourceStatus.sourceType === "HYBRID"
                  ? "bg-amber-400"
                  : sourceStatus.sourceType === "BHUSETU_NATIVE"
                  ? "bg-[#23847D]"
                  : sourceStatus.sourceType === "EXTERNAL_PROVIDER"
                  ? "bg-sky-400"
                  : "bg-[#6F7772]"
              }`}
            />
            <span className="text-[#D9D2C5] font-semibold uppercase">
              3D SOURCE: {sourceStatus.label}
            </span>
            {sourceStatus.attribution && (
              <span className="text-[#6F7772] text-[9px] hidden md:inline">
                ({sourceStatus.attribution})
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
            <span className="text-[#23847D] font-semibold uppercase">CesiumJS Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
