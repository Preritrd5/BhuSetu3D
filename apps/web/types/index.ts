/**
 * ASTATINE Web Frontend Types
 * Team: TANTRAKATHA | SIH 2026 (SIH26011)
 * Phase 1: Project Foundation
 */

export type ServiceStatus = "ok" | "degraded" | "error";
export type ConnectionStatus = "loading" | "connected" | "unavailable" | "error";

export interface HealthStatus {
  status: ServiceStatus;
  service: string;
  version: string;
  environment: string;
}

export interface DatabaseHealth {
  status: ConnectionStatus;
  connected: boolean;
  database_type: string;
  database_version?: string | null;
  postgis_enabled: boolean;
  postgis_version?: string | null;
  error?: string | null;
}

export interface SystemHealth {
  service: string;
  version: string;
  environment: string;
  api_status: ServiceStatus;
  database: DatabaseHealth;
  timestamp: string;
}

export interface NavItem {
  id: string;
  label: string;
  iconName: string;
  targetPhase: number;
  isImplemented: boolean;
}
