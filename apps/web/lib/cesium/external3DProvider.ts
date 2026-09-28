/**
 * BhuSetu 3D External 3D Provider Manager
 * Recovery Phase 1: Robust Provider Decoupling & Error Handling
 *
 * Responsibilities:
 * 1. Safely initialize external 3D Tilesets (Cesium OSM Buildings, Google Photorealistic 3D Tiles).
 * 2. Trap 401/403/quota/network failures cleanly without crashing Cesium or showing repeated "API KEY REQUIRED" error tiles.
 * 3. Tag external buildings strictly as EXTERNAL_CONTEXT (never as BhuSetu property records).
 * 4. Ensure complete cleanup on route changes to avoid memory leaks or duplicate tilesets.
 */

import { External3DProviderConfig, ExternalProviderType } from "./types";

export class External3DProviderManager {
  private activeTileset: any = null;
  private currentProvider: ExternalProviderType = "NONE";
  private isDestroyed: boolean = false;

  public async loadExternal3DContext(
    viewer: any,
    Cesium: any,
    config: External3DProviderConfig
  ): Promise<{ success: boolean; provider: ExternalProviderType; error?: string }> {
    this.isDestroyed = false;

    // Clean up any existing external tileset before loading a new one
    this.cleanup(viewer);

    const ionToken = (config.cesiumIonToken || process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || "").trim();
    const googleKey = (config.googleMapsApiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();

    // 1. Check if Cesium Ion Token is available for OSM 3D Buildings
    if (ionToken) {
      try {
        Cesium.Ion.defaultAccessToken = ionToken;
        console.log("[EXTERNAL_3D] Attempting to load Cesium OSM Buildings 3D Tileset...");

        if (typeof Cesium.createOsmBuildingsAsync === "function") {
          const tileset = await Cesium.createOsmBuildingsAsync();
          if (this.isDestroyed) {
            viewer.scene.primitives.remove(tileset);
            return { success: false, provider: "NONE", error: "Component unmounted" };
          }

          // Optional styling: Subdued architectural tint to match BhuSetu dark glassmorphic theme
          tileset.style = new Cesium.Cesium3DTileStyle({
            color: "color('#2A384C', 0.85)",
          });

          // Tag tileset so picking handlers recognize it as external context
          tileset._isExternal3DContext = true;
          tileset._externalAttribution = "Cesium OSM Buildings / OpenStreetMap ©";

          viewer.scene.primitives.add(tileset);
          this.activeTileset = tileset;
          this.currentProvider = "CESIUM_OSM_BUILDINGS";

          console.log("[EXTERNAL_3D] Cesium OSM Buildings 3D Tileset loaded successfully.");
          return { success: true, provider: "CESIUM_OSM_BUILDINGS" };
        }
      } catch (err: any) {
        console.warn(
          "[EXTERNAL_3D] Failed to load Cesium OSM Buildings (invalid token, quota, or network):",
          err?.message || err
        );
        this.cleanup(viewer);
      }
    }

    // 2. Check if Google Maps Platform API key is available for Google Photorealistic 3D Tiles
    if (googleKey) {
      try {
        console.log("[EXTERNAL_3D] Attempting to load Google Photorealistic 3D Tiles...");
        if (typeof Cesium.createGooglePhotorealistic3DTileset === "function") {
          const tileset = await Cesium.createGooglePhotorealistic3DTileset(googleKey);
          if (this.isDestroyed) {
            viewer.scene.primitives.remove(tileset);
            return { success: false, provider: "NONE", error: "Component unmounted" };
          }

          tileset._isExternal3DContext = true;
          tileset._externalAttribution = "Google Photorealistic 3D Tiles ©";

          viewer.scene.primitives.add(tileset);
          this.activeTileset = tileset;
          this.currentProvider = "GOOGLE_PHOTOREALISTIC_3D";

          console.log("[EXTERNAL_3D] Google Photorealistic 3D Tiles loaded successfully.");
          return { success: true, provider: "GOOGLE_PHOTOREALISTIC_3D" };
        }
      } catch (err: any) {
        console.warn(
          "[EXTERNAL_3D] Failed to load Google Photorealistic 3D Tiles:",
          err?.message || err
        );
        this.cleanup(viewer);
      }
    }

    // 3. Neither external provider succeeded or neither was configured
    console.log("[EXTERNAL_3D] No external 3D provider active. Falling back to clean native scene.");
    return {
      success: false,
      provider: "NONE",
      error: "No valid external 3D provider configured or provider unavailable.",
    };
  }

  public cleanup(viewer?: any): void {
    this.isDestroyed = true;
    if (this.activeTileset && viewer && viewer.scene && !viewer.isDestroyed()) {
      try {
        viewer.scene.primitives.remove(this.activeTileset);
      } catch (e) {
        // Silently catch removal errors on teardown
      }
    }
    this.activeTileset = null;
    this.currentProvider = "NONE";
  }

  public getActiveProvider(): ExternalProviderType {
    return this.currentProvider;
  }

  public hasActiveTileset(): boolean {
    return this.activeTileset !== null;
  }
}
