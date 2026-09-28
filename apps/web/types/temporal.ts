/**
 * BhuSetu 3D 4D Temporal Property History & Infrastructure Intelligence Types
 * Team: TANTRAKATHA | SIH 2026 (SIH26011)
 * Phase 12: 4D Property History + Infrastructure Intelligence
 */

export type ChangeType =
  | "GEOMETRY_CHANGED"
  | "BUILDING_ADDED"
  | "BUILDING_REMOVED"
  | "BUILDING_EXPANDED"
  | "BUILDING_REDUCED"
  | "FLOOR_COUNT_CHANGED"
  | "HEIGHT_CHANGED"
  | "PARCEL_GEOMETRY_CHANGED"
  | "UNIT_CHANGED"
  | "INFRASTRUCTURE_ADDED"
  | "INFRASTRUCTURE_REMOVED"
  | "INFRASTRUCTURE_MOVED"
  | "INFRASTRUCTURE_GEOMETRY_CHANGED"
  | "RELATIONSHIP_CHANGED"
  | "ATTRIBUTE_CHANGED";

export type InfrastructureRelationshipType =
  | "NEAR"
  | "SPATIALLY_INTERSECTS"
  | "WITHIN"
  | "CROSSES"
  | "ADJACENT"
  | "CONNECTED";

export type ChangeVerificationStatus =
  | "UNREVIEWED"
  | "VERIFIED"
  | "REJECTED"
  | "NEEDS_MORE_EVIDENCE";

export interface PropertyStateVersionItem {
  id: string;
  entity_type: string;
  entity_id: string;
  version_number: number;
  observed_at: string;
  valid_from?: string | null;
  valid_to?: string | null;
  observed_interval: string;
  source_dataset_id?: string | null;
  source_name?: string | null;
  geom_geojson?: Record<string, any> | null;
  attributes_snapshot: Record<string, any>;
  evidence_reference: Record<string, any>;
  confidence_score: number;
  verification_status: string;
  created_at: string;
}

export interface ChangeEventItem {
  id: string;
  entity_type: string;
  entity_id: string;
  change_type: ChangeType;
  previous_version_id?: string | null;
  new_version_id?: string | null;
  observed_at: string;
  measured_change: Record<string, any>;
  change_geom_geojson?: Record<string, any> | null;
  description: string;
  evidence_reference: Record<string, any>;
  confidence_score: number;
  verification_status: string;
  status: string;
  analysis_version: string;
  created_at: string;
}

export interface PropertyHistoryTimelineResponse {
  entity_type: string;
  entity_id: string;
  entity_identifier?: string | null;
  current_state?: Record<string, any> | null;
  versions: PropertyStateVersionItem[];
  change_events: ChangeEventItem[];
  observation_dates: string[];
}

export interface TemporalCompareRequest {
  entity_type: string;
  entity_id: string;
  from_version_id?: string;
  to_version_id?: string;
  from_date?: string;
  to_date?: string;
}

export interface TemporalCompareResponse {
  entity_type: string;
  entity_id: string;
  from_version?: PropertyStateVersionItem | null;
  to_version?: PropertyStateVersionItem | null;
  detected_changes: ChangeEventItem[];
  comparison_metrics: {
    area_difference_sqm?: number;
    percentage_change?: number;
    floor_difference?: number;
    height_difference_m?: number;
    [key: string]: any;
  };
  is_identical: boolean;
  evidence_chain: Array<Record<string, any>>;
  provenance_trace: Record<string, any>;
  disclaimer_notice: string;
}

export interface TemporalAnalyzeRequest {
  entity_type: string;
  entity_id: string;
  tolerance_percentage?: number;
  minimum_area_diff_sqm?: number;
  persist_events?: boolean;
}

export interface NearbyInfrastructureItem {
  id: string;
  name: string;
  utility_category: string;
  relationship_type: InfrastructureRelationshipType;
  distance_meters: number;
  is_subsurface: boolean;
  depth_meters: number;
  is_connected: boolean;
  observation_date?: string | null;
  geom_geojson?: Record<string, any> | null;
  evidence_source_type: string;
}

export interface PropertyInfrastructureResponse {
  property_id: string;
  property_type: string;
  observation_epoch?: string | null;
  nearby_infrastructure: NearbyInfrastructureItem[];
  is_historical_aligned: boolean;
  temporal_notice?: string | null;
}

export interface InfrastructureNearbyPropertyItem {
  entity_type: string;
  entity_id: string;
  identifier?: string;
  distance_meters: number;
  area_sqm?: number | null;
  land_use?: string | null;
}
