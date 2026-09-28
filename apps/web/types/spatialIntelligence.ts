/**
 * BhuSetu 3D PostGIS Spatial Intelligence & Digital Twin Types
 * Authoritative Spatial Calculations, Provenance & Geometric Metrics
 */

export interface CentroidPoint {
  longitude: number;
  latitude: number;
}

export interface SpatialSourceProvenance {
  provenance_status: "AUTHORITATIVE" | "ILLUSTRATIVE";
  source_type: "DEMO_SYNTHETIC" | "SURVEY_GROUND_TRUTH";
  confidence_score: number;
  crs: string;
  authority: string;
  disclaimer: string;
}

export interface NearbyBuildingItem {
  id: string;
  building_code: string;
  name: string;
  building_type: string;
  distance_meters: number;
}

export interface NearbyParcelItem {
  id: string;
  ulpin: string;
  survey_number: string;
  land_use: string;
  distance_meters: number;
}

export interface ParentParcelIntelligence {
  parcel_id: string;
  ulpin: string;
  survey_number: string;
  parcel_area_sqm: number;
  is_contained: boolean;
  setback_distance_meters: number;
  encroachment_status: "COMPLIANT" | "ENCROACHING";
}

export interface BuildingSpatialIntelligence {
  building_id: string;
  building_code: string;
  name: string;
  typology: string;
  centroid: CentroidPoint;
  footprint_area_sqm: number;
  building_height: number;
  sanctioned_floors: number;
  detected_floors: number;
  has_conflict: boolean;
  parent_parcel?: ParentParcelIntelligence | null;
  nearby_buildings: NearbyBuildingItem[];
  spatial_source: SpatialSourceProvenance;
}

export interface ParcelSpatialIntelligence {
  parcel_id: string;
  ulpin: string;
  survey_number: string;
  land_use: string;
  centroid: CentroidPoint;
  computed_area_sqm: number;
  recorded_area_sqm: number;
  area_discrepancy_sqm: number;
  buildings_count: number;
  building_codes: string[];
  nearby_parcels: NearbyParcelItem[];
  spatial_source: SpatialSourceProvenance;
}

export interface ViewportSpatialSummary {
  bbox: number[];
  parcels_count: number;
  buildings_count: number;
  parcels: any[];
  buildings: any[];
  spatial_source: SpatialSourceProvenance;
}
