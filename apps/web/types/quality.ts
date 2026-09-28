/**
 * BhuSetu 3D Data Quality Scoring & Issue Tracking Types
 * Team: TANTRAKATHA | SIH 2026 (SIH26011)
 * Phase 13: Analytics + Quality Scoring + UI/UX Polish
 */

export type QualityCategory =
  | "COMPLETENESS"
  | "SPATIAL"
  | "ATTRIBUTE"
  | "PROVENANCE"
  | "EVIDENCE"
  | "VERIFICATION"
  | "TEMPORAL";

export type QualitySeverity = "INFO" | "WARNING" | "ERROR";

export type QualityIssueStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "WONT_FIX";

export interface RuleEvaluationResult {
  rule_code: string;
  rule_name: string;
  category: QualityCategory;
  status: "PASS" | "FAIL" | "NOT_APPLICABLE";
  score_contribution: number;
  max_contribution: number;
  message: string;
  details?: Record<string, any>;
}

export interface QualityComponentScores {
  completeness: number;
  spatial_validity: number;
  attribute_consistency: number;
  provenance_coverage: number;
  evidence_coverage: number;
  verification_coverage: number;
  temporal_coverage: number;
}

export interface QualityWeights {
  completeness: number;
  spatial_validity: number;
  attribute_consistency: number;
  provenance_coverage: number;
  evidence_coverage: number;
  verification_coverage: number;
  temporal_coverage: number;
}

export interface QualityIssueItem {
  id: string;
  entity_type: string;
  entity_id: string;
  category: QualityCategory;
  severity: QualitySeverity;
  rule_code: string;
  message: string;
  discrepancy_details?: Record<string, any>;
  evidence_reference?: Record<string, any>;
  status: QualityIssueStatus;
  action_url?: string | null;
  detected_at: string;
  resolved_at?: string | null;
}

export interface QualityScoreResponse {
  entity_type: string;
  entity_id: string;
  entity_identifier?: string | null;
  overall_score: number;
  quality_label: string;
  component_scores: QualityComponentScores;
  weights_used: QualityWeights;
  rules_evaluated: RuleEvaluationResult[];
  missing_fields: string[];
  active_issues: QualityIssueItem[];
  evidence_count: number;
  is_verified: boolean;
  scoring_version: string;
  calculated_at: string;
  disclaimer_notice: string;
}

export interface QualityHistoryItem {
  id: string;
  overall_score: number;
  component_scores: QualityComponentScores;
  missing_fields_count: number;
  scoring_version: string;
  calculated_at: string;
}

export interface QualityHistoryResponse {
  entity_type: string;
  entity_id: string;
  history_count: number;
  snapshots: QualityHistoryItem[];
}

export interface QualityIssuesListResponse {
  total_count: number;
  issues: QualityIssueItem[];
}

export interface QualityRecalculateRequest {
  entity_type: "PARCEL" | "BUILDING";
  entity_id: string;
  weights?: Partial<QualityWeights>;
  persist_snapshot?: boolean;
}

export interface QualityRecalculateResponse {
  message: string;
  score: QualityScoreResponse;
}
