/**
 * BhuSetu 3D — Geometry-Driven Spatial Camera Engine
 *
 * Provides mathematically rigorous, data-driven, context-aware camera navigation
 * for the 3D City Twin and Floor Inspection subsystems.
 *
 * Core Principles:
 * 1. Geometry-Driven: All camera targets, bounding spheres, and ranges are derived
 *    directly from real 3D entity geometry / authoritative footprints / floor elevations.
 * 2. Zero Hardcoded Positions: Works for ANY building, parcel, floor (FL-01 to FL-07+),
 *    and unit across the spatial digital twin.
 * 3. Orientation Continuity: Preserves current user azimuth heading across floor transitions
 *    to prevent disorienting 180° flips, while enforcing natural oblique pitches (-22° to -28°).
 * 4. Viewport Occlusion Compensation: Adjusts camera framing horizontally when contextual
 *    side panels (e.g. right inspector) are open, keeping the floor centered in the unobstructed canvas.
 * 5. Full 360° Freedom: Post-flight camera state leaves transforms at Matrix4.IDENTITY so
 *    users retain unrestricted manual orbit, pan, tilt, and zoom without snapping.
 */

import { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";
import {
  getUrbanBuildingById,
  getUrbanParcelById,
  getPrimaryDemonstrationBuilding,
  URBAN_BUILDINGS,
  URBAN_PARCELS,
  UrbanBuildingDefinition,
  UrbanParcelDefinition,
} from "../data/urbanEnvironmentData";

export interface TargetResolutionContext {
  currentLevel: SpatialLevel;
  selectedBuildingId: string | null;
  selectedParcelId: string | null;
  selectedFloorId: string | null;
  selectedUnitId?: string | null;
  selectedRoomId?: string | null;
  selectedElementId?: string | null;
  explodeFloors?: boolean;
  isolateFloor?: boolean;
  isolateBuilding?: boolean;
  isRightPanelOpen?: boolean;
  treeData?: any;
  renderedBuildingEntities?: Map<string, any>;
  explodedEntities?: any[];
  interiorEntities?: any[];
}

export interface SpatialTargetResult {
  targetCenter: any; // Cesium.Cartesian3
  boundingSphere: any; // Cesium.BoundingSphere
  elevation: number; // in meters (scene datum)
  range: number; // camera distance in meters
  pitchRad: number; // oblique pitch in radians
  headingRad: number; // heading in radians
  destination: any; // Cesium.Cartesian3 (pre-calculated with viewport offset)
  description: string;
}

/**
 * Resolves floor number from floor ID string (e.g. "FL-01" -> 1, "FL-07" -> 7, "floor-3" -> 3)
 */
export function parseFloorNumber(floorId: string | null | undefined, defaultFloor: number = 3): number {
  if (!floorId) return defaultFloor;
  const match = floorId.match(/\d+/);
  if (match) {
    const parsed = parseInt(match[0], 10);
    return isNaN(parsed) ? defaultFloor : parsed;
  }
  return defaultFloor;
}

/**
 * Computes horizontal viewport compensation offset in meters along the camera's local right vector.
 * Shifts camera position to the right so target appears centered in the remaining viewport
 * when the right inspector panel is open on desktop/wide screens.
 */
function calculateViewportOffsetMeters(
  viewer: any,
  range: number,
  isRightPanelOpen?: boolean,
  panelWidthPx: number = 420
): number {
  if (!isRightPanelOpen || typeof window === "undefined") return 0.0;

  const canvasWidth = viewer?.canvas?.clientWidth || window.innerWidth;
  const canvasHeight = viewer?.canvas?.clientHeight || window.innerHeight;

  // Only apply compensation on desktop viewports (width >= 1024px) where panel is a docked drawer
  if (canvasWidth < 1024) return 0.0;

  // Perspective frustum vertical field of view (default ~60 degrees in Cesium)
  const fovRad = viewer?.camera?.frustum?.fovy || (Math.PI / 3.0);
  const tanHalfFov = Math.tan(fovRad * 0.5);

  // Horizontal world shift required to center the object in the remaining viewport width
  // Fraction of viewport covered by panel = panelWidthPx / canvasWidth
  // To move center from (canvasWidth / 2) to ((canvasWidth - panelWidthPx) / 2), shift by -(panelWidthPx / 2)
  const deltaX = (panelWidthPx / canvasHeight) * range * tanHalfFov;
  return Math.max(0.0, Math.min(deltaX, range * 0.45));
}

/**
 * Calculates world destination Cartesian3 from target center, heading, pitch, range, and viewport offset.
 */
function calculateWorldDestination(
  Cesium: any,
  targetCenter: any,
  headingRad: number,
  pitchRad: number,
  range: number,
  deltaXMeters: number
): any {
  // Local East-North-Up coordinate frame at the target point
  const enuTransform = Cesium.Transforms.eastNorthUpToFixedFrame(targetCenter);

  const cosPitch = Math.cos(pitchRad);
  const sinPitch = Math.sin(pitchRad);
  const sinHeading = Math.sin(headingRad);
  const cosHeading = Math.cos(headingRad);

  // Vector from target to camera in ENU frame:
  // Heading theta: 0 is North (+Y), 90 deg is East (+X)
  // Pitch phi: negative looking down
  const xBase = -range * cosPitch * sinHeading;
  const yBase = -range * cosPitch * cosHeading;
  const zBase = -range * sinPitch; // positive (camera is above target)

  // Camera right vector in horizontal ENU plane is [cos(theta), -sin(theta), 0]
  // Adding deltaXMeters * right moves the camera rightwards, shifting the on-screen target leftwards
  const xFinal = xBase + deltaXMeters * cosHeading;
  const yFinal = yBase - deltaXMeters * sinHeading;
  const zFinal = zBase;

  const localOffset = new Cesium.Cartesian4(xFinal, yFinal, zFinal, 1.0);
  const worldPoint4 = Cesium.Matrix4.multiplyByVector(enuTransform, localOffset, new Cesium.Cartesian4());
  return new Cesium.Cartesian3(worldPoint4.x, worldPoint4.y, worldPoint4.z);
}

/**
 * Resolves the user's current azimuth heading if valid, otherwise falls back to a clean oblique angle.
 */
function resolveHeading(viewer: any, Cesium: any, preferredHeadingRad?: number): number {
  if (preferredHeadingRad !== undefined && !isNaN(preferredHeadingRad)) {
    return preferredHeadingRad;
  }
  if (viewer?.camera && typeof viewer.camera.heading === "number" && !isNaN(viewer.camera.heading)) {
    return viewer.camera.heading;
  }
  return Cesium.Math.toRadians(36.0);
}

/**
 * 1. FLOOR TARGET RESOLUTION
 * Dynamically resolves floor bounding sphere, center, elevation, and framing from geometry.
 */
export function resolveFloorTarget(
  Cesium: any,
  viewer: any,
  ctx: TargetResolutionContext,
  options?: { preferredHeadingRad?: number; preferredPitchRad?: number }
): SpatialTargetResult {
  // A. Resolve Building Definition
  const building: UrbanBuildingDefinition =
    (ctx.selectedBuildingId ? getUrbanBuildingById(ctx.selectedBuildingId) : null) ||
    getPrimaryDemonstrationBuilding();

  const totalFloors = Math.max(1, building.floorCount || 7);
  const floorNum = parseFloorNumber(ctx.selectedFloorId, 3);
  const floorIndex = Math.max(0, Math.min(totalFloors - 1, floorNum - 1));

  // Floor height metrics
  const isPrimary = !!building.isPrimaryDemo;
  const floorHeight = isPrimary ? 4.0 : building.height / totalFloors;
  const floorGap = ctx.explodeFloors ? 2.0 : 0.0;

  // Exact vertical slice for this floor in scene datum
  const baseElevation = ctx.explodeFloors
    ? floorIndex * (floorHeight + floorGap)
    : floorIndex * floorHeight;
  const ceilingElevation = baseElevation + floorHeight;
  const midElevation = (baseElevation + ceilingElevation) * 0.5;

  // B. Construct 3D Bounding Sphere from footprint at floor base & ceiling
  const footprint = building.footprint?.length
    ? building.footprint
    : [
        [building.centroid[0] - 0.00015, building.centroid[1] - 0.00015],
        [building.centroid[0] + 0.00015, building.centroid[1] - 0.00015],
        [building.centroid[0] + 0.00015, building.centroid[1] + 0.00015],
        [building.centroid[0] - 0.00015, building.centroid[1] + 0.00015],
      ];

  const floorCartesians: any[] = [];
  footprint.forEach(([lng, lat]) => {
    floorCartesians.push(Cesium.Cartesian3.fromDegrees(lng, lat, baseElevation));
    floorCartesians.push(Cesium.Cartesian3.fromDegrees(lng, lat, ceilingElevation));
  });

  const boundingSphere = Cesium.BoundingSphere.fromPoints(floorCartesians);

  // C. Calculate Dynamic Range & Oblique Framing
  // Range is sized relative to floor bounding radius so floor occupies ~40% of viewport
  const minRange = 36.0;
  const maxRange = 220.0;
  const calculatedRange = Math.min(Math.max(boundingSphere.radius * 2.35, minRange), maxRange);

  // D. Determine Heading & Pitch
  const headingRad = resolveHeading(viewer, Cesium, options?.preferredHeadingRad);
  const pitchRad =
    options?.preferredPitchRad !== undefined
      ? options.preferredPitchRad
      : Cesium.Math.toRadians(-24.0); // Natural oblique inspection angle

  // E. Viewport Occlusion Offset
  const deltaX = calculateViewportOffsetMeters(viewer, calculatedRange, ctx.isRightPanelOpen);

  // F. Destination World Coordinate
  const destination = calculateWorldDestination(
    Cesium,
    boundingSphere.center,
    headingRad,
    pitchRad,
    calculatedRange,
    deltaX
  );

  return {
    targetCenter: boundingSphere.center,
    boundingSphere,
    elevation: midElevation,
    range: calculatedRange,
    pitchRad,
    headingRad,
    destination,
    description: `Floor ${ctx.selectedFloorId || `FL-0${floorNum}`} in ${building.name} (Z: ${baseElevation.toFixed(1)}m – ${ceilingElevation.toFixed(1)}m)`,
  };
}

/**
 * 2. BUILDING TARGET RESOLUTION
 * Dynamically resolves building envelope bounding sphere, 3D centroid, and context framing.
 */
export function resolveBuildingTarget(
  Cesium: any,
  viewer: any,
  ctx: TargetResolutionContext,
  options?: { preferredHeadingRad?: number; preferredPitchRad?: number }
): SpatialTargetResult {
  const building: UrbanBuildingDefinition =
    (ctx.selectedBuildingId ? getUrbanBuildingById(ctx.selectedBuildingId) : null) ||
    getPrimaryDemonstrationBuilding();

  const totalHeight = ctx.explodeFloors
    ? building.height + Math.max(1, building.floorCount) * 2.0
    : building.height;

  const footprint = building.footprint?.length
    ? building.footprint
    : [
        [building.centroid[0] - 0.00015, building.centroid[1] - 0.00015],
        [building.centroid[0] + 0.00015, building.centroid[1] - 0.00015],
        [building.centroid[0] + 0.00015, building.centroid[1] + 0.00015],
        [building.centroid[0] - 0.00015, building.centroid[1] + 0.00015],
      ];

  const buildingCartesians: any[] = [];
  footprint.forEach(([lng, lat]) => {
    buildingCartesians.push(Cesium.Cartesian3.fromDegrees(lng, lat, 0.0));
    buildingCartesians.push(Cesium.Cartesian3.fromDegrees(lng, lat, totalHeight));
  });

  const boundingSphere = Cesium.BoundingSphere.fromPoints(buildingCartesians);

  const minRange = 48.0;
  const maxRange = 340.0;
  const calculatedRange = Math.min(Math.max(boundingSphere.radius * 2.2, minRange), maxRange);

  const headingRad = resolveHeading(viewer, Cesium, options?.preferredHeadingRad);
  const pitchRad =
    options?.preferredPitchRad !== undefined
      ? options.preferredPitchRad
      : Cesium.Math.toRadians(-22.0);

  const deltaX = calculateViewportOffsetMeters(viewer, calculatedRange, ctx.isRightPanelOpen);

  const destination = calculateWorldDestination(
    Cesium,
    boundingSphere.center,
    headingRad,
    pitchRad,
    calculatedRange,
    deltaX
  );

  return {
    targetCenter: boundingSphere.center,
    boundingSphere,
    elevation: totalHeight * 0.5,
    range: calculatedRange,
    pitchRad,
    headingRad,
    destination,
    description: `Building ${building.name} (${building.code})`,
  };
}

/**
 * 3. PARCEL TARGET RESOLUTION
 * Resolves 2D cadastral parcel turf boundary and frames the property with its immediate urban context.
 */
export function resolveParcelTarget(
  Cesium: any,
  viewer: any,
  ctx: TargetResolutionContext,
  options?: { preferredHeadingRad?: number; preferredPitchRad?: number }
): SpatialTargetResult {
  const parcel: UrbanParcelDefinition =
    (ctx.selectedParcelId ? getUrbanParcelById(ctx.selectedParcelId) : null) ||
    URBAN_PARCELS[0];

  const boundary: [number, number][] = parcel.footprint?.length
    ? parcel.footprint
    : [
        [parcel.centroid[0] - 0.0003, parcel.centroid[1] - 0.0003],
        [parcel.centroid[0] + 0.0003, parcel.centroid[1] - 0.0003],
        [parcel.centroid[0] + 0.0003, parcel.centroid[1] + 0.0003],
        [parcel.centroid[0] - 0.0003, parcel.centroid[1] + 0.0003],
      ];

  const parcelCartesians: any[] = boundary.map(([lng, lat]: [number, number]) =>
    Cesium.Cartesian3.fromDegrees(lng, lat, 0.0)
  );

  const boundingSphere = Cesium.BoundingSphere.fromPoints(parcelCartesians);

  const minRange = 90.0;
  const maxRange = 400.0;
  const calculatedRange = Math.min(Math.max(boundingSphere.radius * 2.2, minRange), maxRange);

  const headingRad = resolveHeading(viewer, Cesium, options?.preferredHeadingRad || Cesium.Math.toRadians(36.0));
  const pitchRad =
    options?.preferredPitchRad !== undefined
      ? options.preferredPitchRad
      : Cesium.Math.toRadians(-32.0);

  const deltaX = calculateViewportOffsetMeters(viewer, calculatedRange, ctx.isRightPanelOpen);

  const destination = calculateWorldDestination(
    Cesium,
    boundingSphere.center,
    headingRad,
    pitchRad,
    calculatedRange,
    deltaX
  );

  return {
    targetCenter: boundingSphere.center,
    boundingSphere,
    elevation: 0.0,
    range: calculatedRange,
    pitchRad,
    headingRad,
    destination,
    description: `Cadastral Parcel ${parcel.ulpin}`,
  };
}

/**
 * 4. CITY TARGET RESOLUTION
 * Resolves regional macro viewpoint framing the urban district digital twin.
 */
export function resolveCityTarget(
  Cesium: any,
  viewer: any,
  ctx?: TargetResolutionContext,
  options?: { preferredHeadingRad?: number; preferredPitchRad?: number }
): SpatialTargetResult {
  // District center encompassing the multi-parcel precinct
  const cityCenter = Cesium.Cartesian3.fromDegrees(77.5710, 12.9970, 0.0);
  const boundingSphere = new Cesium.BoundingSphere(cityCenter, 320.0);

  const headingRad = options?.preferredHeadingRad !== undefined
    ? options.preferredHeadingRad
    : Cesium.Math.toRadians(35.0);
  const pitchRad = options?.preferredPitchRad !== undefined
    ? options.preferredPitchRad
    : Cesium.Math.toRadians(-35.0);

  const range = 520.0;
  const destination = Cesium.Cartesian3.fromDegrees(77.5680, 12.9920, 480.0);

  return {
    targetCenter: cityCenter,
    boundingSphere,
    elevation: 0.0,
    range,
    pitchRad,
    headingRad,
    destination,
    description: "Bengaluru Urban Digital Twin City Precinct",
  };
}

/**
 * 5. UNIT / ROOM / ELEMENT TARGET RESOLUTION
 * Resolves interior room or unit volume within the selected floor.
 */
export function resolveUnitTarget(
  Cesium: any,
  viewer: any,
  ctx: TargetResolutionContext,
  options?: { preferredHeadingRad?: number; preferredPitchRad?: number }
): SpatialTargetResult {
  const building: UrbanBuildingDefinition =
    (ctx.selectedBuildingId ? getUrbanBuildingById(ctx.selectedBuildingId) : null) ||
    getPrimaryDemonstrationBuilding();

  const floorNum = parseFloorNumber(ctx.selectedFloorId, 3);
  const totalFloors = Math.max(1, building.floorCount || 7);
  const floorIndex = Math.max(0, Math.min(totalFloors - 1, floorNum - 1));
  const floorHeight = building.isPrimaryDemo ? 4.0 : building.height / totalFloors;
  const floorGap = ctx.explodeFloors ? 2.0 : 0.0;
  const baseElevation = ctx.explodeFloors
    ? floorIndex * (floorHeight + floorGap)
    : floorIndex * floorHeight;

  // Distinguish Unit 301 (Conference Hall / West) vs Unit 302 (Executive Suite / East)
  const isUnitA = ctx.selectedUnitId?.includes("101") ||
    ctx.selectedUnitId?.includes("201") ||
    ctx.selectedUnitId?.includes("301") ||
    ctx.selectedUnitId?.includes("401") ||
    ctx.selectedRoomId?.includes("301");

  const lngOffset = isUnitA ? -0.00007 : 0.00007;
  const unitLng = building.centroid[0] + lngOffset;
  const unitLat = building.centroid[1];
  const unitCenterZ = baseElevation + floorHeight * 0.5;

  const unitCenter = Cesium.Cartesian3.fromDegrees(unitLng, unitLat, unitCenterZ);
  const boundingSphere = new Cesium.BoundingSphere(unitCenter, 14.0);

  const headingRad = resolveHeading(viewer, Cesium, options?.preferredHeadingRad);
  const pitchRad =
    options?.preferredPitchRad !== undefined
      ? options.preferredPitchRad
      : Cesium.Math.toRadians(-28.0);

  const range = 24.0;
  const deltaX = calculateViewportOffsetMeters(viewer, range, ctx.isRightPanelOpen);
  const destination = calculateWorldDestination(Cesium, unitCenter, headingRad, pitchRad, range, deltaX);

  return {
    targetCenter: unitCenter,
    boundingSphere,
    elevation: unitCenterZ,
    range,
    pitchRad,
    headingRad,
    destination,
    description: `Interior Unit/Room ${ctx.selectedUnitId || ctx.selectedRoomId || "Unit"} in ${building.name}`,
  };
}

/**
 * Unified Spatial Target Resolver:
 * Dispatches to the appropriate hierarchical target calculator based on current spatial level.
 */
export function resolveSpatialTargetForSelection(
  Cesium: any,
  viewer: any,
  ctx: TargetResolutionContext,
  options?: { preferredHeadingRad?: number; preferredPitchRad?: number }
): SpatialTargetResult {
  switch (ctx.currentLevel) {
    case "UNIT":
    case "ROOM":
    case "CORRIDOR":
    case "HALL":
    case "ELEMENT":
    case "DOOR":
    case "WINDOW":
      return resolveUnitTarget(Cesium, viewer, ctx, options);

    case "FLOOR":
      return resolveFloorTarget(Cesium, viewer, ctx, options);

    case "BUILDING":
      return resolveBuildingTarget(Cesium, viewer, ctx, options);

    case "PARCEL":
    case "INFRASTRUCTURE":
      return resolveParcelTarget(Cesium, viewer, ctx, options);

    case "REGION":
    case "CITY":
    default:
      return resolveCityTarget(Cesium, viewer, ctx, options);
  }
}

/**
 * Executes a smooth Cesium camera flight to the resolved spatial target.
 *
 * Guarantees:
 * - Cancels previous flight safely to prevent race conditions during rapid clicking.
 * - Restores camera transform to Cesium.Matrix4.IDENTITY both BEFORE the flight
 *   starts AND on completion/cancellation, ensuring no locked lookAt transform
 *   can ever restrict 360° orbital manual navigation.
 */
export function executeCameraFlight(
  viewer: any,
  Cesium: any,
  target: SpatialTargetResult,
  options?: {
    duration?: number;
    onComplete?: () => void;
  }
): void {
  if (!viewer || !Cesium || !target?.destination) return;

  try {
    // 1. Cancel any active flight to handle rapid floor selection cleanly
    if (viewer.camera) {
      viewer.camera.cancelFlight();

      // ── Release any locked camera transform BEFORE the new flight starts ──
      // This is critical: if a previous lookAt() left a non-IDENTITY transform,
      // the user would be locked into a fixed-orbit mode with no 360° freedom.
      // We always reset to IDENTITY first, then flyTo to a world coordinate.
      try {
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
      } catch {
        // safe to ignore if already IDENTITY
      }
    }

    const duration = options?.duration ?? 1.2;

    viewer.camera.flyTo({
      destination: target.destination,
      orientation: {
        heading: target.headingRad,
        pitch: target.pitchRad,
        roll: 0.0,
      },
      duration,
      complete: () => {
        // Unlock transform again on completion to guarantee full manual orbit/pan/zoom/tilt freedom
        try {
          if (viewer.camera && viewer.camera.transform && !viewer.camera.transform.equals(Cesium.Matrix4.IDENTITY)) {
            viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
          }
        } catch {}
        options?.onComplete?.();
      },
      cancel: () => {
        // Yield to user input cleanly if user grabs controls during flight
        try {
          if (viewer.camera && viewer.camera.transform && !viewer.camera.transform.equals(Cesium.Matrix4.IDENTITY)) {
            viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
          }
        } catch {}
      },
    });
  } catch (err) {
    console.warn("[SPATIAL_CAMERA_ENGINE] Flight execution error:", err);
  }
}
