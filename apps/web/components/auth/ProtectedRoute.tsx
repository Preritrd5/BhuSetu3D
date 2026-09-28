"use client";

/**
 * BhuSetu 3D Protected Route Guard
 */
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AppRole } from "@/types/auth";
import { AccessRestricted } from "@/components/auth/AccessRestricted";
import { SpatialLoadingRoller } from "@/components/common/SpatialLoadingRoller";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole | AppRole[];
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
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

  // Role validation check
  if (requiredRole && !hasRole(requiredRole)) {
    const roleString = Array.isArray(requiredRole)
      ? requiredRole.join(" or ")
      : requiredRole;
    return <AccessRestricted requiredRole={roleString} />;
  }

  return <>{children}</>;
}
