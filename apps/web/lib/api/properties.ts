/**
 * BhuSetu 3D Property & Spatial Hierarchy API Client
 * PostGIS Property Domain & Digital Twin Integration
 * Hardened with in-memory TTL caching and request deduplication.
 */
import {
  SpatialHierarchyTreeResponse,
  ParcelDetail,
  BuildingDetail,
  FloorDetail,
  UnitDetail,
  CityDetail,
  RegionDetail,
} from "@/types/property";
import {
  BuildingSpatialIntelligence,
  ParcelSpatialIntelligence,
  ViewportSpatialSummary,
} from "@/types/spatialIntelligence";

import { getApiBaseUrl } from "./config";

const API_BASE = getApiBaseUrl();

// In-memory LRU TTL Cache to avoid duplicate network hammering on repeated selections
const propertiesApiCache = new Map<string, { data: any; timestamp: number }>();

function getCached<T>(key: string, ttlMs: number = 30000): T | null {
  const item = propertiesApiCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > ttlMs) {
    propertiesApiCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCached<T>(key: string, data: T): void {
  // Cap cache size to avoid unbounded memory growth
  if (propertiesApiCache.size > 100) {
    const oldestKey = propertiesApiCache.keys().next().value;
    if (oldestKey) propertiesApiCache.delete(oldestKey);
  }
  propertiesApiCache.set(key, { data, timestamp: Date.now() });
}

export function clearPropertiesCache(): void {
  propertiesApiCache.clear();
}

function resolveToken(token?: string | null): string | null {
  if (token) return token;
  if (typeof window !== "undefined") {
    return localStorage.getItem("bhusetu_token");
  }
  return null;
}

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const activeToken = resolveToken(token);
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }
  return headers;
}

import { URBAN_PARCELS, URBAN_BUILDINGS } from "../cesium/data/urbanEnvironmentData";

export function buildFallbackSpatialHierarchyTree(): SpatialHierarchyTreeResponse {
  const parcels = URBAN_PARCELS.map((p) => {
    const blds = URBAN_BUILDINGS.filter((b) => b.parcelId === p.parcelId || b.legacyParcelId === p.legacyId);
    const mappedBuildings = blds.map((b) => {
      const isAura = b.isPrimaryDemo || b.code === "BLD-KA-BLR-102";
      const floorCount = b.floorCount || 2;
      const floors = Array.from({ length: floorCount }, (_, i) => {
        const num = i + 1;
        const code = `FL-0${num}`;
        const isUnsanctioned = isAura && num === 3;
        return {
          id: `fl-${b.buildingId}-${num}`,
          building_id: b.legacyId || b.buildingId,
          floor_number: num,
          floor_code: code,
          floor_label: `Floor 0${num}`,
          base_elevation: 920.0 + i * 3.5,
          ceiling_elevation: 920.0 + (i + 1) * 3.5,
          floor_height: 3.5,
          floor_area_sqm: 220.0,
          status_3d: "AVAILABLE",
          is_unsanctioned: isUnsanctioned,
          units: [],
        };
      });

      return {
        id: b.legacyId || b.buildingId,
        parcel_id: p.legacyId || p.parcelId,
        building_code: b.code,
        name: b.name,
        building_type: b.typologyLabel || "Commercial",
        ground_elevation: 920.0,
        building_height: b.height,
        detected_floors: b.floorCount,
        sanctioned_floors: Math.max(1, b.floorCount - (b.hasConflict ? 1 : 0)),
        has_discrepancy: Boolean(b.hasConflict),
        status_3d: "VERIFIED",
        floors,
      };
    });

    return {
      id: p.legacyId || p.parcelId,
      city_id: "11111111-1111-4000-8000-000000000001",
      region_id: "22222222-2222-4000-8000-000000000001",
      ulpin_2d: p.ulpin,
      survey_number: p.surveyNumber,
      land_use: p.category,
      recorded_area_sqm: p.areaSqm,
      computed_area_sqm: p.areaSqm,
      elevation_base: 920.0,
      buildings: mappedBuildings,
    };
  });

  return {
    city: {
      id: "11111111-1111-4000-8000-000000000001",
      code: "BLR",
      name: "Bengaluru Municipal Corporation",
      state: "Karnataka",
      country: "India",
      regions: [
        {
          id: "22222222-2222-4000-8000-000000000001",
          city_id: "11111111-1111-4000-8000-000000000001",
          code: "W-101",
          name: "Malleshwaram Zone",
          parcels,
        },
      ],
    },
    total_parcels: parcels.length,
    total_buildings: URBAN_BUILDINGS.length,
    total_floors: parcels.reduce((acc, p) => acc + p.buildings.reduce((bAcc, b) => bAcc + b.floors.length, 0), 0),
    total_units: 0,
  };
}

/**
 * Retrieves the complete spatial hierarchy outliner tree:
 * City -> Regions -> Parcels -> Buildings -> Floors -> Units -> Spatial Elements
 * Cached with 30-second TTL unless forceRefresh is true.
 */
export async function getSpatialHierarchyTree(
  cityId?: string,
  token?: string | null,
  forceRefresh: boolean = false
): Promise<SpatialHierarchyTreeResponse> {
  const cacheKey = `tree:${cityId || "default"}`;
  if (!forceRefresh) {
    const cached = getCached<SpatialHierarchyTreeResponse>(cacheKey, 30000);
    if (cached) return cached;
  }

  const url = new URL(`${API_BASE}/properties/hierarchy/tree`);
  if (cityId) url.searchParams.append("city_id", cityId);

  try {
    const res = await fetch(url.toString(), {
      headers: getHeaders(token),
    });

    if (!res.ok) {
      console.warn(`[BHUSETU_3D] Hierarchy tree API returned status ${res.status}, falling back to static hierarchy.`);
      return buildFallbackSpatialHierarchyTree();
    }
    const data = await res.json();
    setCached(cacheKey, data);
    return data;
  } catch (err) {
    console.warn("[BHUSETU_3D] Network error fetching hierarchy tree, falling back to static hierarchy:", err);
    return buildFallbackSpatialHierarchyTree();
  }
}

/**
 * Retrieves full PostGIS parcel details with 2D polygon geometry and associated buildings.
 * Cached with 60-second TTL.
 */
export async function getParcelDetail(
  parcelId: string,
  token?: string | null
): Promise<ParcelDetail> {
  const cacheKey = `parcel:${parcelId}`;
  const cached = getCached<ParcelDetail>(cacheKey, 60000);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/properties/parcels/${parcelId}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch parcel: ${res.statusText}`);
  }
  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

/**
 * Retrieves full 3D building details with ground elevation, height, floor breakdown, and discrepancy.
 * Cached with 60-second TTL.
 */
export async function getBuildingDetail(
  buildingId: string,
  token?: string | null
): Promise<BuildingDetail> {
  const cacheKey = `building:${buildingId}`;
  const cached = getCached<BuildingDetail>(cacheKey, 60000);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/properties/buildings/${buildingId}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch building: ${res.statusText}`);
  }
  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

/**
 * Retrieves floor slab details with base/ceiling elevation and units.
 */
export async function getFloorDetail(
  floorId: string,
  token?: string | null
): Promise<FloorDetail> {
  const cacheKey = `floor:${floorId}`;
  const cached = getCached<FloorDetail>(cacheKey, 60000);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/properties/floors/${floorId}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch floor: ${res.statusText}`);
  }
  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

/**
 * Retrieves 3D unit details with 3D centroid coordinates and verification status.
 */
export async function getUnitDetail(
  unitId: string,
  token?: string | null
): Promise<UnitDetail> {
  const cacheKey = `unit:${unitId}`;
  const cached = getCached<UnitDetail>(cacheKey, 60000);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/properties/units/${unitId}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch unit: ${res.statusText}`);
  }
  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

/**
 * Full-text search across parcels, survey numbers, and building codes.
 */
export async function searchProperties(
  query: string,
  token?: string | null
): Promise<any[]> {
  if (!query || query.trim().length === 0) return [];
  const cacheKey = `search:${query.trim().toLowerCase()}`;
  const cached = getCached<any[]>(cacheKey, 15000);
  if (cached) return cached;

  const res = await fetch(
    `${API_BASE}/properties/search?q=${encodeURIComponent(query.trim())}`,
    {
      headers: getHeaders(token),
    }
  );
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

/**
 * Evaluates PostGIS setback and boundary encroachment between building and parcel.
 */
export async function evaluateEncroachment(
  buildingId: string,
  parcelId: string,
  token?: string | null
): Promise<{
  has_encroachment: boolean;
  encroachment_area_sqm: number;
  encroachment_geojson?: Record<string, any> | null;
  severity: string;
}> {
  const res = await fetch(
    `${API_BASE}/properties/buildings/${buildingId}/encroachment/${parcelId}`,
    {
      headers: getHeaders(token),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to evaluate encroachment: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Retrieves complete vertical property hierarchy (Parcel -> Building -> Floor -> Unit).
 */
export async function getPropertyHierarchy(
  propertyId: string,
  token?: string | null
): Promise<any> {
  const res = await fetch(`${API_BASE}/properties/${propertyId}/hierarchy`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch hierarchy: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Phase 3: PostGIS Spatial Intelligence Methods
 */

/**
 * Retrieves live PostGIS spatial intelligence for a building:
 * Exact centroid, geodesic footprint area, containing parcel, setback distance, and nearby buildings.
 */
export async function getBuildingSpatialIntelligence(
  buildingId: string,
  token?: string | null
): Promise<BuildingSpatialIntelligence> {
  const cacheKey = `intel:building:${buildingId}`;
  const cached = getCached<BuildingSpatialIntelligence>(cacheKey, 30000);
  if (cached) return cached;

  const res = await fetch(
    `${API_BASE}/properties/buildings/${encodeURIComponent(buildingId)}/spatial-intelligence`,
    {
      headers: getHeaders(token),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch building spatial intelligence: ${res.statusText}`);
  }
  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

/**
 * Retrieves live PostGIS spatial intelligence for a parcel:
 * Exact centroid, geodesic area, area discrepancy against record, and nearby parcels within radius.
 */
export async function getParcelSpatialIntelligence(
  parcelId: string,
  token?: string | null
): Promise<ParcelSpatialIntelligence> {
  const cacheKey = `intel:parcel:${parcelId}`;
  const cached = getCached<ParcelSpatialIntelligence>(cacheKey, 30000);
  if (cached) return cached;

  const res = await fetch(
    `${API_BASE}/properties/parcels/${encodeURIComponent(parcelId)}/spatial-intelligence`,
    {
      headers: getHeaders(token),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch parcel spatial intelligence: ${res.statusText}`);
  }
  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

/**
 * Spatial viewport bounding-box query returning structured properties inside bbox.
 */
export async function getViewportSpatialSummary(
  bbox: string = "77.56,12.99,77.58,13.01",
  token?: string | null
): Promise<ViewportSpatialSummary> {
  const cacheKey = `viewport:${bbox}`;
  const cached = getCached<ViewportSpatialSummary>(cacheKey, 30000);
  if (cached) return cached;

  const res = await fetch(
    `${API_BASE}/properties/spatial/viewport?bbox=${encodeURIComponent(bbox)}`,
    {
      headers: getHeaders(token),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch viewport spatial summary: ${res.statusText}`);
  }
  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

