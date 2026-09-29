/**
 * BhuSetu 3D Spatial Analytics API Client
 * Enterprise 3D Cadastral Intelligence Platform
 */
import {
  AnalyticsOverviewResponse,
  AnalyticsPropertiesResponse,
  AnalyticsQualityResponse,
  AnalyticsConflictsResponse,
  AnalyticsVerificationResponse,
  AnalyticsChangesResponse,
  AnalyticsInfrastructureResponse,
} from "@/types/analytics";

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

export async function getAnalyticsOverview(
  params?: { city_id?: string; region_id?: string },
  token?: string | null
): Promise<AnalyticsOverviewResponse> {
  const query = new URLSearchParams();
  if (params?.city_id) query.append("city_id", params.city_id);
  if (params?.region_id) query.append("region_id", params.region_id);

  const res = await fetch(`${API_BASE}/analytics/overview?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch analytics overview: ${res.statusText}`);
  }
  return res.json();
}

export async function getAnalyticsProperties(
  params?: { city_id?: string; region_id?: string },
  token?: string | null
): Promise<AnalyticsPropertiesResponse> {
  const query = new URLSearchParams();
  if (params?.city_id) query.append("city_id", params.city_id);
  if (params?.region_id) query.append("region_id", params.region_id);

  const res = await fetch(`${API_BASE}/analytics/properties?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch property analytics: ${res.statusText}`);
  }
  return res.json();
}

export async function getAnalyticsQuality(
  params?: { city_id?: string; region_id?: string },
  token?: string | null
): Promise<AnalyticsQualityResponse> {
  const query = new URLSearchParams();
  if (params?.city_id) query.append("city_id", params.city_id);
  if (params?.region_id) query.append("region_id", params.region_id);

  const res = await fetch(`${API_BASE}/analytics/quality?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch quality analytics: ${res.statusText}`);
  }
  return res.json();
}

export async function getAnalyticsConflicts(
  params?: { city_id?: string; region_id?: string },
  token?: string | null
): Promise<AnalyticsConflictsResponse> {
  const query = new URLSearchParams();
  if (params?.city_id) query.append("city_id", params.city_id);
  if (params?.region_id) query.append("region_id", params.region_id);

  const res = await fetch(`${API_BASE}/analytics/conflicts?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch conflict analytics: ${res.statusText}`);
  }
  return res.json();
}

export async function getAnalyticsVerification(
  params?: { city_id?: string; region_id?: string },
  token?: string | null
): Promise<AnalyticsVerificationResponse> {
  const query = new URLSearchParams();
  if (params?.city_id) query.append("city_id", params.city_id);
  if (params?.region_id) query.append("region_id", params.region_id);

  const res = await fetch(`${API_BASE}/analytics/verification?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch verification analytics: ${res.statusText}`);
  }
  return res.json();
}

export async function getAnalyticsChanges(
  params?: { city_id?: string; region_id?: string },
  token?: string | null
): Promise<AnalyticsChangesResponse> {
  const query = new URLSearchParams();
  if (params?.city_id) query.append("city_id", params.city_id);
  if (params?.region_id) query.append("region_id", params.region_id);

  const res = await fetch(`${API_BASE}/analytics/changes?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch changes analytics: ${res.statusText}`);
  }
  return res.json();
}

export async function getAnalyticsInfrastructure(
  params?: { city_id?: string; region_id?: string },
  token?: string | null
): Promise<AnalyticsInfrastructureResponse> {
  const query = new URLSearchParams();
  if (params?.city_id) query.append("city_id", params.city_id);
  if (params?.region_id) query.append("region_id", params.region_id);

  const res = await fetch(`${API_BASE}/analytics/infrastructure?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch infrastructure analytics: ${res.statusText}`);
  }
  return res.json();
}
