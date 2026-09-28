/**
 * BhuSetu 3D Shared Contracts & Types
 * Team: TANTRAKATHA | Smart India Hackathon 2026 (SIH26011)
 * Phase 3: PostGIS Integration + Property Data Model
 */

export type ServiceStatus = "ok" | "degraded" | "error";

export type ConnectionStatus = "loading" | "connected" | "unavailable" | "error";

export interface HealthStatus {
  status: ServiceStatus;
  service: string;
  version: string;
  environment: string;
}

export interface DatabaseHealth {
  status: ConnectionStatus;
  connected: boolean;
  database_type: string;
  database_version?: string | null;
  postgis_enabled: boolean;
  postgis_version?: string | null;
  error?: string | null;
}

export interface SystemHealth {
  service: string;
  version: string;
  environment: string;
  api_status: ServiceStatus;
  database: DatabaseHealth;
  timestamp: string;
}

// ============================================================================
// Phase 2: Authentication & Authorization Types
// ============================================================================

export type AppRole =
  | "ADMIN"
  | "SURVEYOR"
  | "GOVERNMENT_OFFICER"
  | "PLANNER"
  | "ANALYST"
  | "PUBLIC_USER";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: AppRole[];
  department?: string | null;
  is_active: boolean;
  created_at?: string | null;
}

export interface AuthSessionState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ApiAuthError {
  detail: string;
  error_code?: string;
  status_code: number;
}

// ============================================================================
// Phase 3: Property Data Model Types
// ============================================================================

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CitySummary {
  id: string;
  code: string;
  name: string;
  state: string;
  country: string;
  default_srid: number;
}

export interface RegionSummary {
  id: string;
  city_id: string;
  code: string;
  name: string;
}

export interface ParcelSummary {
  id: string;
  city_id: string;
  region_id: string;
  ulpin_2d: string;
  survey_number: string;
  recorded_area_sqm: number;
  computed_area_sqm: number;
  land_use: string;
  elevation_base: number;
  buildings_count: number;
}

export interface BuildingSummary {
  id: string;
  parcel_id: string;
  building_code: string;
  name?: string | null;
  building_type: string;
  ground_elevation: number;
  building_height: number;
  detected_floors: number;
  sanctioned_floors: number;
}

export interface FloorSummary {
  id: string;
  building_id: string;
  floor_number: number;
  floor_code: string;
  base_elevation: number;
  ceiling_elevation: number;
  floor_height: number;
  floor_area_sqm: number;
}

export interface UnitSummary {
  id: string;
  floor_id: string;
  building_id: string;
  parcel_id: string;
  ulpin_3d: string;
  unit_number: string;
  unit_type: string;
  carpet_area_sqm: number;
  verification_status: string;
}

export interface InfrastructureSummary {
  id: string;
  city_id: string;
  name: string;
  utility_category: string;
  is_subsurface: boolean;
  depth_meters: number;
  evidence_source_type: string;
}
