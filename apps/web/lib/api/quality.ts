/**
 * BhuSetu 3D Data Quality API Client
 * Enterprise 3D Cadastral Intelligence Platform
 */
import {
  QualityScoreResponse,
  QualityHistoryResponse,
  QualityIssuesListResponse,
  QualityIssueItem,
  QualityRecalculateRequest,
  QualityRecalculateResponse,
} from "@/types/quality";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function getEntityQuality(
  entityType: "PARCEL" | "BUILDING",
  entityId: string,
  recalculate: boolean = false,
  token?: string | null
): Promise<QualityScoreResponse> {
  const query = new URLSearchParams({ recalculate: String(recalculate) });
  const res = await fetch(`${API_BASE}/quality/${entityType}/${entityId}?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch quality score: ${res.statusText}`);
  }
  return res.json();
}

export async function recalculateQuality(
  payload: QualityRecalculateRequest,
  token?: string | null
): Promise<QualityRecalculateResponse> {
  const res = await fetch(`${API_BASE}/quality/recalculate`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to recalculate quality: ${res.statusText}`);
  }
  return res.json();
}

export async function getEntityQualityHistory(
  entityType: "PARCEL" | "BUILDING",
  entityId: string,
  limit: number = 20,
  token?: string | null
): Promise<QualityHistoryResponse> {
  const query = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`${API_BASE}/quality/${entityType}/${entityId}/history?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch quality history: ${res.statusText}`);
  }
  return res.json();
}

export async function getQualityIssues(
  params?: {
    entity_type?: string;
    entity_id?: string;
    category?: string;
    severity?: string;
    status?: string;
    limit?: number;
    offset?: number;
  },
  token?: string | null
): Promise<QualityIssuesListResponse> {
  const query = new URLSearchParams();
  if (params?.entity_type) query.append("entity_type", params.entity_type);
  if (params?.entity_id) query.append("entity_id", params.entity_id);
  if (params?.category) query.append("category", params.category);
  if (params?.severity) query.append("severity", params.severity);
  if (params?.status) query.append("status", params.status);
  if (params?.limit) query.append("limit", String(params.limit));
  if (params?.offset) query.append("offset", String(params.offset));

  const res = await fetch(`${API_BASE}/quality/issues?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch quality issues: ${res.statusText}`);
  }
  return res.json();
}

export async function updateQualityIssue(
  issueId: string,
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "WONT_FIX",
  token?: string | null
): Promise<QualityIssueItem> {
  const query = new URLSearchParams({ status });
  const res = await fetch(`${API_BASE}/quality/issues/${issueId}?${query.toString()}`, {
    method: "PATCH",
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to update quality issue: ${res.statusText}`);
  }
  return res.json();
}
