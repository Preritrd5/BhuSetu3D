/**
 * BhuSetu 3D 4D Temporal Property History & Infrastructure API Client
 * Enterprise 3D Cadastral Intelligence Platform
 */
import {
  PropertyHistoryTimelineResponse,
  PropertyStateVersionItem,
  ChangeEventItem,
  TemporalCompareRequest,
  TemporalCompareResponse,
  TemporalAnalyzeRequest,
  PropertyInfrastructureResponse,
  InfrastructureNearbyPropertyItem,
} from "@/types/temporal";

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

export async function getPropertyHistory(
  propertyId: string,
  entityType: string = "BUILDING",
  token?: string | null
): Promise<PropertyHistoryTimelineResponse> {
  const query = new URLSearchParams({ entity_type: entityType });
  const res = await fetch(`${API_BASE}/properties/${propertyId}/history?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch property history: ${res.statusText}`);
  }
  return res.json();
}

export async function getPropertyVersion(
  propertyId: string,
  versionId: string,
  entityType: string = "BUILDING",
  token?: string | null
): Promise<PropertyStateVersionItem> {
  const query = new URLSearchParams({ entity_type: entityType });
  const res = await fetch(`${API_BASE}/properties/${propertyId}/history/${versionId}?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch property state version: ${res.statusText}`);
  }
  return res.json();
}

export async function getPropertyChanges(
  propertyId: string,
  entityType: string = "BUILDING",
  token?: string | null
): Promise<ChangeEventItem[]> {
  const query = new URLSearchParams({ entity_type: entityType });
  const res = await fetch(`${API_BASE}/properties/${propertyId}/changes?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch property changes: ${res.statusText}`);
  }
  return res.json();
}

export async function compareTemporalStates(
  payload: TemporalCompareRequest,
  token?: string | null
): Promise<TemporalCompareResponse> {
  const res = await fetch(`${API_BASE}/temporal/compare`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to compare temporal states: ${res.statusText}`);
  }
  return res.json();
}

export async function analyzeTemporalChanges(
  payload: TemporalAnalyzeRequest,
  token?: string | null
): Promise<{ success: boolean; count: number; events: ChangeEventItem[] }> {
  const res = await fetch(`${API_BASE}/temporal/analyze`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to analyze temporal changes: ${res.statusText}`);
  }
  return res.json();
}

export async function getChangeEvents(
  params: {
    entityType?: string;
    entityId?: string;
    changeType?: string;
    verificationStatus?: string;
    page?: number;
    pageSize?: number;
  },
  token?: string | null
): Promise<{ total: number; page: number; page_size: number; items: ChangeEventItem[] }> {
  const query = new URLSearchParams();
  if (params.entityType) query.append("entity_type", params.entityType);
  if (params.entityId) query.append("entity_id", params.entityId);
  if (params.changeType) query.append("change_type", params.changeType);
  if (params.verificationStatus) query.append("verification_status", params.verificationStatus);
  query.append("page", String(params.page || 1));
  query.append("page_size", String(params.pageSize || 20));

  const res = await fetch(`${API_BASE}/change-events?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch change events: ${res.statusText}`);
  }
  return res.json();
}

export async function getChangeEvent(
  id: string,
  token?: string | null
): Promise<ChangeEventItem> {
  const res = await fetch(`${API_BASE}/change-events/${id}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch change event: ${res.statusText}`);
  }
  return res.json();
}

export async function getPropertyNearbyInfrastructure(
  propertyId: string,
  params: {
    propertyType?: string;
    maxDistanceMeters?: number;
    observationDate?: string;
  },
  token?: string | null
): Promise<PropertyInfrastructureResponse> {
  const query = new URLSearchParams();
  if (params.propertyType) query.append("property_type", params.propertyType);
  if (params.maxDistanceMeters) query.append("max_distance_meters", String(params.maxDistanceMeters));
  if (params.observationDate) query.append("observation_date", params.observationDate);

  const res = await fetch(`${API_BASE}/properties/${propertyId}/infrastructure?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch nearby infrastructure: ${res.statusText}`);
  }
  return res.json();
}

export async function getInfrastructureNearbyProperties(
  infrastructureId: string,
  maxDistanceMeters: number = 50.0,
  token?: string | null
): Promise<InfrastructureNearbyPropertyItem[]> {
  const query = new URLSearchParams({ max_distance_meters: String(maxDistanceMeters) });
  const res = await fetch(`${API_BASE}/infrastructure/${infrastructureId}/nearby-properties?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch infrastructure nearby properties: ${res.statusText}`);
  }
  return res.json();
}
