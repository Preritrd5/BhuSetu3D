/**
 * BhuSetu 3D Spatial Intelligence, Evidence Vault & AI Investigation Types
 * Phase 8: BhuSetu Intelligence Integrated into 3D
 */

export type DiscrepancySeverity = "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type DiscrepancyStatus = "OPEN" | "REVIEW_REQUIRED" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";

export type EvidenceClassification =
  | "AUTHORITATIVE"
  | "OBSERVED"
  | "DERIVED"
  | "AI-DERIVED"
  | "AI_ASSISTED"
  | "INFERRED"
  | "ILLUSTRATIVE"
  | "UNVERIFIED"
  | "UNKNOWN";

export interface ConflictItem {
  id: string;
  conflict_type: string;
  severity: DiscrepancySeverity;
  rule_id?: string;
  rule_name?: string;
  entity_type: string;
  entity_id: string;
  related_entity_type?: string;
  related_entity_id?: string;
  parcel_id?: string;
  building_id?: string;
  measured_value?: number;
  threshold_value?: number;
  measured_unit?: string;
  deviation_value?: number;
  explanation: string;
  discrepancy_details?: Record<string, any>;
  evidence_reference?: Record<string, any>;
  confidence_score: number;
  status: DiscrepancyStatus;
  verification_status?: string;
  assigned_reviewer_id?: string;
  assigned_reviewer_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface ConflictSummary {
  total: number;
  open_count: number;
  review_required_count: number;
  resolved_count: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
}

export interface ConflictListResponse {
  items: ConflictItem[];
  total: number;
  page: number;
  limit: number;
  summary: ConflictSummary;
}

export interface EvidenceItem {
  id: string;
  entity_type: string;
  entity_id: string;
  dataset_id?: string;
  dataset_name?: string;
  dataset_type?: string;
  source_id?: string;
  source_name?: string;
  source_type: string;
  source_classification: EvidenceClassification;
  confidence_score: number;
  status: string;
  processing_method?: string;
  model_version?: string;
  notes?: string;
  supporting_factors?: string[];
  limiting_factors?: string[];
  evidence_metadata?: Record<string, any>;
  created_at: string;
}

export interface MissingEvidenceNotice {
  entity_type: string;
  required_classification: string;
  reason: string;
}

export interface PropertyEvidenceResponse {
  property_id: string;
  ulpin_2d?: string;
  evidence_count: number;
  coverage_percentage: number;
  composite_confidence: number;
  verification_status: string;
  evidence_items: EvidenceItem[];
  missing_evidence?: MissingEvidenceNotice[];
}

export interface ProvenanceNode {
  id: string;
  target_entity_type: string;
  target_entity_id: string;
  source_entity_type?: string;
  source_entity_id?: string;
  operation_type: string;
  operation_name: string;
  operation_version?: string;
  performed_by: string;
  execution_timestamp: string;
  input_reference?: Record<string, any>;
  output_reference?: Record<string, any>;
  metadata_json?: Record<string, any>;
  created_at: string;
}

export interface ProvenanceChainResponse {
  target_entity_type: string;
  target_entity_id: string;
  chain: ProvenanceNode[];
  lineage_summary: string;
}

export interface ConfidenceBreakdownResponse {
  property_id: string;
  composite_confidence: number;
  geometric_accuracy: number;
  attribute_consistency: number;
  provenance_completeness: number;
  source_credibility: number;
  supporting_factors: string[];
  limiting_factors: string[];
  governance_notice: string;
}

export interface NearbyInfrastructureItem {
  id: string;
  type: string;
  name: string;
  code?: string;
  distance_meters: number;
  clearance_warning: boolean;
  buffer_zone_meters: number;
  classification?: EvidenceClassification;
  metadata?: Record<string, any>;
}

export interface NearbyInfrastructureResponse {
  property_id: string;
  search_radius_meters: number;
  corridors_count: number;
  features: NearbyInfrastructureItem[];
}

export interface InvestigationResultItem {
  entity_id: string;
  entity_type: string;
  entity_code?: string;
  title: string;
  subtitle?: string;
  finding_type?: string;
  measured_value?: number;
  measured_unit?: string;
  deviation_value?: number;
  confidence_score?: number;
  evidence_count?: number;
  evidence_summary?: string;
  has_discrepancy?: boolean;
  explanation?: string;
  geom_geojson?: Record<string, any>;
  bbox?: number[];
  metadata?: Record<string, any>;
}

export interface InvestigationExplanation {
  summary: string;
  why_flagged?: string;
  evidence_context?: string;
  provenance_context?: string;
  confidence_explanation?: string;
  limitations_notice: string;
  governance_notice: string;
}

export interface MapActionDirective {
  action_type: string;
  target_ids: string[];
  primary_id?: string;
  zoom_level?: number;
  highlight_features?: Array<Record<string, any>>;
}

export interface SpatialInvestigationRequest {
  question: string;
  context_entity_type?: string;
  context_entity_id?: string;
  context_map_extent?: number[];
  session_id?: string;
}

export interface SpatialInvestigationResponse {
  request_id: string;
  question: string;
  interpreted_intent?: any;
  status: "SUCCESS" | "CLARIFICATION_NEEDED" | "NO_RESULTS" | "UNSUPPORTED" | "ERROR";
  results_count: number;
  results: InvestigationResultItem[];
  explanation: InvestigationExplanation;
  map_directive?: MapActionDirective;
  execution_trace?: Record<string, any>;
}

export interface SuggestedQuestion {
  id: string;
  category: string;
  question: string;
  description: string;
  requires_property_context: boolean;
}

/**
 * Compact intelligence summary displayed in Contextual Inspector
 */
export interface EntityIntelligenceSummary {
  verificationStatus: string;
  evidenceCount: number;
  conflictsCount: number;
  changeCount: number;
  compositeConfidence: number;
  hasDiscrepancy: boolean;
  isAiAvailable: boolean;
}
