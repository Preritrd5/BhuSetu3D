/**
 * BhuSetu 3D Human Verification & Audit API Client
 * Enterprise 3D Cadastral Intelligence Platform
 */
import {
  VerificationQueueResponse,
  VerificationQueueSummary,
  VerificationDetailResponse,
  ReviewerInfo,
  AuditLogItem,
  AuditChainVerificationResponse,
  VerificationDecision,
} from "@/types/verification";

import { getApiBaseUrl } from "./config";

const API_BASE = getApiBaseUrl();

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function getVerificationQueue(
  params: {
    status?: string[];
    severity?: string;
    conflictType?: string;
    assignedReviewerId?: string;
    unassignedOnly?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
  },
  token?: string | null
): Promise<VerificationQueueResponse> {
  const query = new URLSearchParams();
  if (params.status && params.status.length > 0) {
    params.status.forEach((s) => query.append("status", s));
  }
  if (params.severity) query.append("severity", params.severity);
  if (params.conflictType) query.append("conflict_type", params.conflictType);
  if (params.assignedReviewerId) query.append("assigned_reviewer_id", params.assignedReviewerId);
  if (params.unassignedOnly) query.append("unassigned_only", "true");
  if (params.search) query.append("search", params.search);
  query.append("page", String(params.page || 1));
  query.append("page_size", String(params.pageSize || 20));

  const res = await fetch(`${API_BASE}/verification/queue?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch verification queue: ${res.statusText}`);
  }
  return res.json();
}

export async function getVerificationSummary(
  token?: string | null
): Promise<VerificationQueueSummary> {
  const res = await fetch(`${API_BASE}/verification/queue/summary`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch queue summary");
  }
  return res.json();
}

export async function getEligibleReviewers(
  token?: string | null
): Promise<ReviewerInfo[]> {
  const res = await fetch(`${API_BASE}/verification/reviewers`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch reviewers");
  }
  return res.json();
}

export async function getVerificationDetail(
  conflictId: string,
  token?: string | null
): Promise<VerificationDetailResponse> {
  const res = await fetch(`${API_BASE}/verification/${conflictId}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch verification detail");
  }
  return res.json();
}

export async function assignReviewer(
  conflictId: string,
  reviewerId: string,
  notes?: string,
  token?: string | null
): Promise<VerificationDetailResponse> {
  const res = await fetch(`${API_BASE}/verification/${conflictId}/assign`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ reviewer_id: reviewerId, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to assign reviewer");
  }
  return res.json();
}

export async function startReview(
  conflictId: string,
  notes?: string,
  token?: string | null
): Promise<VerificationDetailResponse> {
  const res = await fetch(`${API_BASE}/verification/${conflictId}/start`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to start review");
  }
  return res.json();
}

export async function submitVerificationDecision(
  conflictId: string,
  data: {
    decision: VerificationDecision;
    justification: string;
    evidenceReferences?: string[];
    notes?: string;
    expectedPreviousStatus?: string;
  },
  token?: string | null
): Promise<VerificationDetailResponse> {
  const res = await fetch(`${API_BASE}/verification/${conflictId}/decision`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({
      decision: data.decision,
      justification: data.justification,
      evidence_references: data.evidenceReferences || [],
      notes: data.notes,
      expected_previous_status: data.expectedPreviousStatus,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to submit verification decision");
  }
  return res.json();
}

export async function reopenVerification(
  conflictId: string,
  justification: string,
  notes?: string,
  token?: string | null
): Promise<VerificationDetailResponse> {
  const res = await fetch(`${API_BASE}/verification/${conflictId}/reopen`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ justification, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to reopen verification");
  }
  return res.json();
}

export async function getFindingAuditTrail(
  conflictId: string,
  token?: string | null
): Promise<AuditLogItem[]> {
  const res = await fetch(`${API_BASE}/verification/${conflictId}/audit`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch audit trail");
  }
  return res.json();
}

export async function verifyAuditChain(
  token?: string | null
): Promise<AuditChainVerificationResponse> {
  const res = await fetch(`${API_BASE}/verification/audit/verify-chain`, {
    method: "POST",
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to verify audit chain");
  }
  return res.json();
}
