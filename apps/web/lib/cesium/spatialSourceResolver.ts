/**
 * BhuSetu 3D Spatial Source Resolver
 * Recovery Phase 1: Provider-Aware 3D Foundation
 *
 * Source Priority Model:
 * 1. BhuSetu-owned spatial geometry, when actually available (from PostGIS/Supabase).
 * 2. External 3D provider, when BhuSetu-owned 3D geometry is unavailable for surrounding context.
 * 3. Clean Cesium fallback, if neither is available or external provider fails.
 * 4. HYBRID: BhuSetu property geometry layered on top of external 3D city context!
 */

import {
  Spatial3DSourceType,
  SourceLifecycleState,
  SpatialSourceStatus,
  External3DProviderConfig,
  PickedSpatialMetadata,
} from "./types";
import { External3DProviderManager } from "./external3DProvider";
import { BhuSetuNativeProviderManager } from "./bhuSetuNativeProvider";
import { SpatialHierarchyTreeResponse } from "@/types/property";

export class Spatial3DSourceResolver {
  private externalProviderMgr: External3DProviderManager;
  private nativeProviderMgr: BhuSetuNativeProviderManager;
  private currentStatus: SpatialSourceStatus;
  private statusListeners: Array<(status: SpatialSourceStatus) => void> = [];

  constructor() {
    this.externalProviderMgr = new External3DProviderManager();
    this.nativeProviderMgr = new BhuSetuNativeProviderManager();
    this.currentStatus = {
      sourceType: "FALLBACK",
      state: "INITIALIZING",
      externalProvider: "NONE",
      label: "Initializing 3D Engine...",
      message: "Establishing baseline spatial viewport...",
      hasNativeGeometry: false,
      hasExternalContext: false,
    };
  }

  public getStatus(): SpatialSourceStatus {
    return this.currentStatus;
  }

  public subscribeStatus(listener: (status: SpatialSourceStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private updateStatus(newStatus: Partial<SpatialSourceStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...newStatus };
    this.statusListeners.forEach((listener) => {
      try {
        listener(this.currentStatus);
      } catch (e) {
        console.error("[SOURCE_RESOLVER] Listener notification error:", e);
      }
    });
  }

  /**
   * Resolves and applies the optimal 3D source based on data availability and credentials.
   */
  public async resolveAndApplySource(
    viewer: any,
    Cesium: any,
    options: {
      treeData?: SpatialHierarchyTreeResponse | null;
      selectedBuildingId?: string | null;
      selectedParcelId?: string | null;
      config?: External3DProviderConfig;
    }
  ): Promise<SpatialSourceStatus> {
    this.updateStatus({ state: "LOADING", message: "Evaluating available spatial sources..." });

    // Step 1: Check if BhuSetu-owned PostGIS geometry is available
    const hasNative = this.nativeProviderMgr.hasAuthoritativeGeometry(
      options.treeData,
      options.selectedBuildingId,
      options.selectedParcelId
    );

    // Step 2: Attempt external 3D provider (e.g., Cesium OSM Buildings / Google 3D Tiles)
    const externalResult = await this.externalProviderMgr.loadExternal3DContext(
      viewer,
      Cesium,
      options.config || {}
    );

    const hasExternal = externalResult.success;

    // Step 3: Determine Active Source Type according to strict priority
    let sourceType: Spatial3DSourceType = "FALLBACK";
    let label = "Native Cesium Fallback";
    let message = "Clean baseline canvas (procedural dark studio).";

    if (hasNative && hasExternal) {
      sourceType = "HYBRID";
      label = `Hybrid (BhuSetu + ${externalResult.provider === "CESIUM_OSM_BUILDINGS" ? "OSM 3D" : "External 3D"})`;
      message = "BhuSetu verified property layered on external 3D urban context.";
    } else if (hasNative) {
      sourceType = "BHUSETU_NATIVE";
      label = "BhuSetu Spatial Data";
      message = "Rendering verified PostGIS cadastral geometry.";
    } else if (hasExternal) {
      sourceType = "EXTERNAL_PROVIDER";
      label = `External 3D (${externalResult.provider === "CESIUM_OSM_BUILDINGS" ? "Cesium OSM Buildings" : "Google 3D"})`;
      message = "Rendering rich external 3D city environment (context only).";
    } else {
      sourceType = "FALLBACK";
      label = "Native Cesium Fallback";
      message = "No external keys or proprietary city models; running clean Cesium scene.";
    }

    this.updateStatus({
      sourceType,
      state: "READY",
      externalProvider: externalResult.provider,
      label,
      message,
      hasNativeGeometry: hasNative,
      hasExternalContext: hasExternal,
      attribution: hasExternal
        ? externalResult.provider === "CESIUM_OSM_BUILDINGS"
          ? "Cesium OSM Buildings / OpenStreetMap ©"
          : "Google Photorealistic 3D Tiles ©"
        : hasNative
        ? this.nativeProviderMgr.getAttribution()
        : undefined,
    });

    console.log(
      `[SOURCE_RESOLVER] 3D Source Resolved: ${sourceType} (${label}) | State: READY`
    );

    return this.currentStatus;
  }

  /**
   * Evaluates any picked 3D object to determine whether it is a BhuSetu property or external context.
   */
  public inspectPickedObject(picked: any): PickedSpatialMetadata {
    if (!picked) {
      return { isExternalContext: false, isBhuSetuProperty: false };
    }

    // Check if the picked object belongs to an external 3D tileset
    if (picked._isExternal3DContext || picked.primitive?._isExternal3DContext) {
      return {
        isExternalContext: true,
        isBhuSetuProperty: false,
        displayName: "External 3D Building (Context Only)",
        sourceAttribution: picked.primitive?._externalAttribution || "External 3D Context",
      };
    }

    // Check if it is a BhuSetu property entity
    const isBhu = !!(
      picked._isBhuSetuProperty ||
      picked._bhuBuildingId ||
      picked._bhuParcelId ||
      picked._bhuFloorId ||
      picked._bhuUnitId ||
      picked._bhuRoomId ||
      picked._bhuElementId ||
      picked._bhuInfrastructureId
    );

    return {
      isExternalContext: false,
      isBhuSetuProperty: isBhu,
      bhuBuildingId: picked._bhuBuildingId,
      bhuParcelId: picked._bhuParcelId,
      bhuFloorId: picked._bhuFloorId,
      bhuUnitId: picked._bhuUnitId,
      bhuRoomId: picked._bhuRoomId,
      bhuElementId: picked._bhuElementId,
      bhuInfrastructureId: picked._bhuInfrastructureId,
      displayName: picked.name || (isBhu ? "BhuSetu Cadastral Entity" : undefined),
    };
  }

  public cleanup(viewer?: any): void {
    this.externalProviderMgr.cleanup(viewer);
    this.updateStatus({
      sourceType: "FALLBACK",
      state: "INITIALIZING",
      externalProvider: "NONE",
      hasNativeGeometry: false,
      hasExternalContext: false,
    });
  }
}
