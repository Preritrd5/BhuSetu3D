/**
 * ASTATINE Centralized API Client
 * Team: TANTRAKATHA | SIH 2026 (SIH26011)
 * Phase 1: Project Foundation
 */
import { HealthStatus, DatabaseHealth, SystemHealth } from "@/types";
import { getApiBaseUrl } from "@/lib/api/config";

export class ApiError extends Error {
  public status?: number;
  public details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    // Some health checks return HTTP 503 when the database is unavailable,
    // but still provide a valid SystemHealth / DatabaseHealth JSON payload.
    if (!response.ok && response.status !== 503) {
      throw new ApiError(
        data?.message || `API request failed with HTTP ${response.status}`,
        response.status,
        data
      );
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors (e.g. backend not running or connection refused)
    throw new ApiError(
      error.message || "Failed to communicate with the ASTATINE backend API.",
      0,
      error
    );
  }
}

export const apiClient = {
  /**
   * Fetches basic FastAPI operational health.
   */
  async getHealth(): Promise<HealthStatus> {
    return request<HealthStatus>("/health");
  },

  /**
   * Probes database connectivity and PostGIS status.
   */
  async getDatabaseHealth(): Promise<DatabaseHealth> {
    return request<DatabaseHealth>("/health/database");
  },

  /**
   * Fetches full combined telemetry for the system status component.
   */
  async getSystemHealth(): Promise<SystemHealth> {
    return request<SystemHealth>("/health/system");
  },
};
