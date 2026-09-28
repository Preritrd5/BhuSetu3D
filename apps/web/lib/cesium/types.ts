/**
 * BhuSetu 3D Spatial Source Resolution Types
 * Recovery Phase 1: Provider-Aware 3D Foundation
 */

export type Spatial3DSourceType =
  | "BHUSETU_NATIVE"       // Geometry owned and fetched from Supabase / PostGIS
  | "EXTERNAL_PROVIDER"    // External 3D provider (Cesium Ion OSM Buildings / Google 3D Tiles)
  | "HYBRID"               // BhuSetu property geometry layered on top of external 3D city context
  | "FALLBACK";            // Clean native Cesium scene (globe + studio baseline)

export type SourceLifecycleState =
  | "INITIALIZING"
  | "LOADING"
  | "READY"
  | "ERROR";

export type ExternalProviderType =
  | "CESIUM_OSM_BUILDINGS"
  | "GOOGLE_PHOTOREALISTIC_3D"
  | "NONE";

export interface SpatialSourceStatus {
  sourceType: Spatial3DSourceType;
  state: SourceLifecycleState;
  externalProvider: ExternalProviderType;
  label: string;
  message: string;
  hasNativeGeometry: boolean;
  hasExternalContext: boolean;
  attribution?: string;
}

export interface External3DProviderConfig {
  cesiumIonToken?: string;
  googleMapsApiKey?: string;
  preferredProvider?: ExternalProviderType;
}

export interface PickedSpatialMetadata {
  isExternalContext: boolean;
  isBhuSetuProperty: boolean;
  bhuBuildingId?: string;
  bhuParcelId?: string;
  bhuFloorId?: string;
  bhuUnitId?: string;
  bhuRoomId?: string;
  bhuElementId?: string;
  bhuInfrastructureId?: string;
  name?: string;
  displayName?: string;
  buildingType?: string;
  sourceAttribution?: string;
}
