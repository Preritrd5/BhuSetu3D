/**
 * BhuSetu 3D Verification Workflow & Audit Trail Types
 * Team: TANTRAKATHA | SIH 2026 (SIH26011)
 * Phase 11: Human Verification Workflow + Audit Trail
 */

export type VerificationStatus =
  | "UNREVIEWED"
  | "IN_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "NEEDS_MORE_EVIDENCE"
  | "ESCALATED";

export type VerificationDecision =
  | "CONFIRMED"
  | "NOT_CONFIRMED"
  | "INSUFFICIENT_EVIDENCE"
  | "ESCALATE";

export interface ReviewerInfo {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department?: string | null;
}

export interface VerificationRecordItem {
  id: string;
  conflict_id?: string | null;
  entity_type: string;
  entity_id: string;
  officer_id: string;
  officer_name?: string | null;
  action: string;
  decision?: string | null;
  justification: string;
  previous_status: string;
  new_status: string;
  evidence_references: string[];
  confidence_at_review?: number | null;
  notes?: string | null;
  created_at: string;
}

export interface VerificationQueueItem {
  id: string;
  conflict_type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  verification_status: VerificationStatus;
  rule_id?: string | null;
  rule_name?: string | null;
  entity_type: string;
  entity_id?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  parcel_id?: string | null;
  building_id?: string | null;
  unit_id?: string | null;
  measured_value?: number | null;
  threshold_value?: number | null;
  measured_unit: string;
  confidence_score: number;
  explanation?: string | null;
  assigned_reviewer?: ReviewerInfo | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at: string;
  updated_at: string;
  evidence_count: number;
  verification_history_count: number;
}

export interface VerificationQueueSummary {
  total: number;
  unreviewed: number;
  in_review: number;
  verified: number;
  rejected: number;
  needs_more_evidence: number;
  escalated: number;
  by_severity: Record<string, number>;
}

export interface VerificationQueueResponse {
  items: VerificationQueueItem[];
  total: number;
  page: number;
  page_size: number;
  summary: VerificationQueueSummary;
}

export interface AssociatedEvidenceItem {
  id: string;
  entity_type: string;
  entity_id: string;
  source_type: string;
  source_classification: string;
  confidence_score: number;
  status: string;
  supporting_factors: string[];
  limiting_factors: string[];
  created_at?: string | null;
}

export interface VerificationDetailResponse {
  item: VerificationQueueItem;
  history: VerificationRecordItem[];
  associated_evidence: AssociatedEvidenceItem[];
  ai_explanation?: string | null;
}

export interface AuditLogItem {
  id: number;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_state?: Record<string, any> | null;
  new_state?: Record<string, any> | null;
  ip_address?: string | null;
  prev_hash: string;
  current_hash: string;
  created_at: string;
}

export interface AuditChainVerificationResponse {
  is_valid: boolean;
  event_count: number;
  broken_log_id?: number | null;
  verified_at: string;
  genesis_hash: string;
  latest_hash?: string | null;
  message: string;
}
