"use client";

/**
 * BhuSetu 3D Protected Route Guard
 * Centralized Route Authorization & 403 Enforcement
 */
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AppRole } from "@/types/auth";
import { Permission } from "@/lib/auth/permissions";
import { AccessRestricted } from "@/components/auth/AccessRestricted";
import { SpatialLoadingRoller } from "@/components/common/SpatialLoadingRoller";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole | AppRole[];
  requiredPermission?: Permission | Permission[];
  moduleName?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  moduleName,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading state: prevents UI flashing of protected content to unauthenticated users
  if (isLoading) {
    return (
      <SpatialLoadingRoller
        fullScreen={true}
        label="Authenticating Session"
        subtitle="Validating BhuSetu 3D credentials & spatial permissions..."
      />
    );
  }

  // Not authenticated: render blank while redirect takes effect
  if (!isAuthenticated) {
    return null;
  }

  // 1. Role validation check
  if (requiredRole && !hasRole(requiredRole)) {
    const roleString = Array.isArray(requiredRole)
      ? requiredRole.join(", ")
      : requiredRole;
    return <AccessRestricted requiredRole={roleString} moduleName={moduleName} />;
  }

  // 2. Permission validation check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    const permString = Array.isArray(requiredPermission)
      ? requiredPermission.join(", ")
      : requiredPermission;
    return (
      <AccessRestricted
        requiredRole={`Requires permission '${permString}'`}
        moduleName={moduleName}
      />
    );
  }

  return <>{children}</>;
}
