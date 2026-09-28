/**
 * BhuSetu 3D Enterprise Spatial Analytics Types
 * Team: TANTRAKATHA | SIH 2026 (SIH26011)
 * Phase 13: Analytics + Quality Scoring + UI/UX Polish
 */
import { QualityComponentScores } from "./quality";

export interface AnalyticsOverviewResponse {
  scope: string;
  scope_id?: string | null;
  timestamp: string;
  parcels_count: number;
  buildings_count: number;
  floors_count: number;
  units_count: number;
  avg_quality_score: number;
  evidence_coverage_percent: number;
  verification_coverage_percent: number;
  open_conflicts_count: number;
  total_changes_count: number;
  infrastructure_assets_count: number;
}

export interface AnalyticsPropertiesResponse {
  scope: string;
  parcels_total: number;
  buildings_total: number;
  parcels_by_land_use: Record<string, number>;
  buildings_by_type: Record<string, number>;
  average_building_height_m: number;
  average_detected_floors: number;
  total_parcel_area_sqm: number;
}

export interface AnalyticsQualityResponse {
  scope: string;
  average_score: number;
  component_averages: QualityComponentScores;
  distribution: {
    high: number;
    moderate: number;
    fair: number;
    needs_attention: number;
  };
  top_missing_attributes: {
    field: string;
    count: number;
  }[];
  total_evaluated: number;
}

export interface AnalyticsConflictsResponse {
  scope: string;
  total_conflicts: number;
  open_conflicts: number;
  resolved_conflicts: number;
  by_conflict_type: Record<string, number>;
  by_severity: Record<string, number>;
}

export interface AnalyticsVerificationResponse {
  scope: string;
  total_reviews: number;
  confirmed_count: number;
  rejected_count: number;
  in_review_count: number;
  pending_count: number;
  escalated_count: number;
  average_review_time_hours: number;
}

export interface AnalyticsChangesResponse {
  scope: string;
  total_changes: number;
  by_change_type: Record<string, number>;
  by_severity: Record<string, number>;
  buildings_with_vertical_expansions: number;
  parcels_with_boundary_modifications: number;
}

export interface AnalyticsInfrastructureResponse {
  scope: string;
  total_infrastructure_assets: number;
  by_type: Record<string, number>;
  active_corridor_buffers_monitored: number;
  properties_intersecting_corridors: number;
}
