/**
 * BhuSetu 3D Property & Spatial Hierarchy Types
 * PostGIS Spatial Digital Twin Property Models
 */
export type { SpatialLevel } from "@/components/workspace/WorkspaceBreadcrumb";

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

export interface CityDetail extends CitySummary {
  regions?: RegionSummary[];
  created_at?: string;
  updated_at?: string;
}

export interface RegionDetail extends RegionSummary {
  boundary_geojson?: Record<string, any>;
  parcels?: ParcelSummary[];
  created_at?: string;
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

export interface ParcelDetail extends ParcelSummary {
  geom_2d_geojson?: Record<string, any>;
  buildings?: BuildingSummary[];
  infrastructure_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface BuildingDetail extends BuildingSummary {
  footprint_geojson?: Record<string, any>;
  geom_3d_geojson?: Record<string, any>;
  floors?: FloorSummary[];
  created_at?: string;
  updated_at?: string;
}

export interface FloorDetail extends FloorSummary {
  floor_label?: string | null;
  geom_3d_geojson?: Record<string, any>;
  units?: UnitSummary[];
  created_at?: string;
}

export interface UnitDetail extends UnitSummary {
  unit_label?: string | null;
  spatial_centroid_geojson?: Record<string, any>;
  geom_3d_geojson?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Spatial Hierarchy Tree Types
// ============================================================================

export interface SpatialElementNode {
  id: string;
  name: string;
  type: "ROOM" | "HALL" | "CORRIDOR" | "DOOR" | "WINDOW" | string;
  area_sqm?: number | null;
  dimensions?: string | null;
  material?: string | null;
  fire_rating?: string | null;
  glazing?: string | null;
  elements?: SpatialElementNode[] | null;
}

export interface UnitHierarchyNode {
  id: string;
  floor_id: string;
  building_id: string;
  parcel_id: string;
  ulpin_3d: string;
  unit_number: string;
  unit_label?: string | null;
  unit_type: string;
  carpet_area_sqm: number;
  built_up_area_sqm?: number | null;
  verification_status: string;
  status_3d?: string;
  spatial_elements: SpatialElementNode[];
}

export interface FloorHierarchyNode {
  id: string;
  building_id: string;
  floor_number: number;
  floor_code: string;
  floor_label?: string | null;
  base_elevation: number;
  ceiling_elevation: number;
  floor_height: number;
  floor_area_sqm: number;
  status_3d?: string;
  is_unsanctioned: boolean;
  units: UnitHierarchyNode[];
}

export interface BuildingHierarchyNode {
  id: string;
  parcel_id: string;
  building_code: string;
  name: string;
  building_type: string;
  ground_elevation: number;
  building_height: number;
  detected_floors: number;
  sanctioned_floors: number;
  has_discrepancy: boolean;
  status_3d?: string;
  floors: FloorHierarchyNode[];
}

export interface ParcelHierarchyNode {
  id: string;
  city_id: string;
  region_id: string;
  ulpin_2d: string;
  survey_number: string;
  land_use: string;
  recorded_area_sqm: number;
  computed_area_sqm: number;
  elevation_base: number;
  buildings: BuildingHierarchyNode[];
}

export interface RegionHierarchyNode {
  id: string;
  city_id: string;
  code: string;
  name: string;
  parcels: ParcelHierarchyNode[];
}

export interface CityHierarchyNode {
  id: string;
  code: string;
  name: string;
  state: string;
  country: string;
  regions: RegionHierarchyNode[];
}

export interface SpatialHierarchyTreeResponse {
  city: CityHierarchyNode;
  total_parcels: number;
  total_buildings: number;
  total_floors: number;
  total_units: number;
}

