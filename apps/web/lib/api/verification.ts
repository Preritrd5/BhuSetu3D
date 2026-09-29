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

async function parseApiResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data.detail || data.message || data.error;
    } catch {
      // response body is not json
    }

    if (detail) {
      throw new Error(detail);
    }

    if (res.status === 401) {
      throw new Error("Authentication required. Your session may have expired. Please log in.");
    }
    if (res.status === 403) {
      throw new Error("Access forbidden. Your account does not have sufficient role permissions.");
    }
    if (res.status === 404) {
      throw new Error("Requested verification record not found.");
    }
    if (res.status === 422) {
      throw new Error("Validation error. Please verify input query parameters.");
    }
    if (res.status === 429) {
      throw new Error("Rate limit exceeded. Please wait before retrying.");
    }
    if (res.status >= 500) {
      throw new Error(`BhuSetu backend service error (HTTP ${res.status}). Please retry in a few moments.`);
    }

    throw new Error(`${fallbackMessage} (HTTP ${res.status}: ${res.statusText})`);
  }
  return res.json();
}

function handleFetchError(err: unknown, fallbackMessage: string): never {
  if (err instanceof TypeError && err.message.toLowerCase().includes("failed to fetch")) {
    throw new Error(
      "Unable to communicate with BhuSetu API service (https://bhusetu3d-backend.onrender.com). Please verify server health or check network connectivity."
    );
  }
  if (err instanceof Error) {
    throw err;
  }
  throw new Error(fallbackMessage);
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

  try {
    const res = await fetch(`${API_BASE}/verification/queue?${query.toString()}`, {
      headers: getHeaders(token),
    });
    return await parseApiResponse<VerificationQueueResponse>(res, "Failed to fetch verification queue");
  } catch (err) {
    handleFetchError(err, "Failed to load verification queue");
  }
}

export async function getVerificationSummary(
  token?: string | null
): Promise<VerificationQueueSummary> {
  try {
    const res = await fetch(`${API_BASE}/verification/queue/summary`, {
      headers: getHeaders(token),
    });
    return await parseApiResponse<VerificationQueueSummary>(res, "Failed to fetch queue summary");
  } catch (err) {
    handleFetchError(err, "Failed to fetch queue summary");
  }
}

export async function getEligibleReviewers(
  token?: string | null
): Promise<ReviewerInfo[]> {
  try {
    const res = await fetch(`${API_BASE}/verification/reviewers`, {
      headers: getHeaders(token),
    });
    return await parseApiResponse<ReviewerInfo[]>(res, "Failed to fetch reviewers");
  } catch (err) {
    handleFetchError(err, "Failed to fetch reviewers");
  }
}

export async function getVerificationDetail(
  conflictId: string,
  token?: string | null
): Promise<VerificationDetailResponse> {
  try {
    const res = await fetch(`${API_BASE}/verification/${conflictId}`, {
      headers: getHeaders(token),
    });
    return await parseApiResponse<VerificationDetailResponse>(res, "Failed to fetch verification detail");
  } catch (err) {
    handleFetchError(err, "Failed to fetch verification detail");
  }
}

export async function assignReviewer(
  conflictId: string,
  reviewerId: string,
  notes?: string,
  token?: string | null
): Promise<VerificationDetailResponse> {
  try {
    const res = await fetch(`${API_BASE}/verification/${conflictId}/assign`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({ reviewer_id: reviewerId, notes }),
    });
    return await parseApiResponse<VerificationDetailResponse>(res, "Failed to assign reviewer");
  } catch (err) {
    handleFetchError(err, "Failed to assign reviewer");
  }
}

export async function startReview(
  conflictId: string,
  notes?: string,
  token?: string | null
): Promise<VerificationDetailResponse> {
  try {
    const res = await fetch(`${API_BASE}/verification/${conflictId}/start`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({ notes }),
    });
    return await parseApiResponse<VerificationDetailResponse>(res, "Failed to start review");
  } catch (err) {
    handleFetchError(err, "Failed to start review");
  }
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
  try {
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
    return await parseApiResponse<VerificationDetailResponse>(res, "Failed to submit verification decision");
  } catch (err) {
    handleFetchError(err, "Failed to submit verification decision");
  }
}

export async function reopenVerification(
  conflictId: string,
  justification: string,
  notes?: string,
  token?: string | null
): Promise<VerificationDetailResponse> {
  try {
    const res = await fetch(`${API_BASE}/verification/${conflictId}/reopen`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({ justification, notes }),
    });
    return await parseApiResponse<VerificationDetailResponse>(res, "Failed to reopen verification");
  } catch (err) {
    handleFetchError(err, "Failed to reopen verification");
  }
}

export async function getFindingAuditTrail(
  conflictId: string,
  token?: string | null
): Promise<AuditLogItem[]> {
  try {
    const res = await fetch(`${API_BASE}/verification/${conflictId}/audit`, {
      headers: getHeaders(token),
    });
    return await parseApiResponse<AuditLogItem[]>(res, "Failed to fetch audit trail");
  } catch (err) {
    handleFetchError(err, "Failed to fetch audit trail");
  }
}

export async function verifyAuditChain(
  token?: string | null
): Promise<AuditChainVerificationResponse> {
  try {
    const res = await fetch(`${API_BASE}/verification/audit/verify-chain`, {
      method: "POST",
      headers: getHeaders(token),
    });
    return await parseApiResponse<AuditChainVerificationResponse>(res, "Failed to verify audit chain");
  } catch (err) {
    handleFetchError(err, "Failed to verify audit chain");
  }
}
