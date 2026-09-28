/**
 * Hook for polling and refreshing real ASTATINE system telemetry
 * Team: TANTRAKATHA | SIH 2026 (SIH26011)
 * Phase 1: Project Foundation
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { SystemHealth } from "@/types";
import { apiClient, ApiError } from "@/services/api/client";

export function useSystemHealth(autoRefreshIntervalMs: number = 10000) {
  const [data, setData] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.getSystemHealth();
      setData(result);
    } catch (err: any) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not connect to ASTATINE backend API."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();

    if (autoRefreshIntervalMs > 0) {
      const interval = setInterval(fetchHealth, autoRefreshIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchHealth, autoRefreshIntervalMs]);

  return { data, isLoading, error, refetch: fetchHealth };
}
