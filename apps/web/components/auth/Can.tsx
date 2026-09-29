"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppRole } from "@/types/auth";
import { Permission, hasPermission, hasRole } from "@/lib/auth/permissions";

interface CanProps {
  permission: Permission | Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children if current user has the specified permission.
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { user } = useAuth();
  const allowed = hasPermission(user, permission);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}

interface CanRoleProps {
  role: AppRole | AppRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children if current user has one of the specified roles.
 */
export function CanRole({ role, children, fallback = null }: CanRoleProps) {
  const { user } = useAuth();
  const allowed = hasRole(user, role);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
