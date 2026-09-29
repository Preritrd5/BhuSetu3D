/**
 * BhuSetu 3D Centralized Authorization & Permission Model
 * Evidence-Backed 3D Property Intelligence Platform
 */
import { AppRole, AuthUser } from "@/types/auth";

export type Permission =
  // Property & Cadastral Registry
  | "property:view"
  | "property:create"
  | "property:edit"
  // Cadastral Survey & Field Operations
  | "survey:view"
  | "survey:capture"
  | "survey:submit"
  | "measurement:create"
  | "imagery:upload"
  // Evidence & Provenance
  | "evidence:view"
  | "evidence:upload"
  | "evidence:review"
  // Spatial Analysis & Investigation
  | "analysis:view"
  | "analysis:run"
  | "investigation:view"
  | "investigation:run"
  // Discrepancy & Conflicts
  | "conflict:view"
  | "conflict:review"
  | "conflict:resolve"
  // Statutory Verification
  | "verification:view"
  | "verification:submit"
  | "verification:review"
  | "verification:approve"
  // Temporal History & Analytics
  | "history:view"
  | "history:scrub"
  | "analytics:view"
  // Platform Administration
  | "admin:users"
  | "admin:roles"
  | "admin:audit"
  | "admin:settings";

/**
 * Canonical Role-to-Permission Mapping
 */
export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  ADMIN: [
    "property:view",
    "property:create",
    "property:edit",
    "survey:view",
    "survey:capture",
    "survey:submit",
    "measurement:create",
    "imagery:upload",
    "evidence:view",
    "evidence:upload",
    "evidence:review",
    "analysis:view",
    "analysis:run",
    "investigation:view",
    "investigation:run",
    "conflict:view",
    "conflict:review",
    "conflict:resolve",
    "verification:view",
    "verification:submit",
    "verification:review",
    "verification:approve",
    "history:view",
    "history:scrub",
    "analytics:view",
    "admin:users",
    "admin:roles",
    "admin:audit",
    "admin:settings",
  ],
  GOVERNMENT_OFFICER: [
    "property:view",
    "property:edit",
    "evidence:view",
    "evidence:review",
    "conflict:view",
    "conflict:review",
    "conflict:resolve",
    "verification:view",
    "verification:review",
    "verification:approve",
    "history:view",
    "analytics:view",
    "analysis:view",
  ],
  SURVEYOR: [
    "property:view",
    "survey:view",
    "survey:capture",
    "survey:submit",
    "measurement:create",
    "imagery:upload",
    "evidence:view",
    "evidence:upload",
    "verification:view",
    "verification:submit",
  ],
  ANALYST: [
    "property:view",
    "analysis:view",
    "analysis:run",
    "investigation:view",
    "investigation:run",
    "conflict:view",
    "conflict:review",
    "evidence:view",
    "history:view",
    "history:scrub",
    "analytics:view",
  ],
  PLANNER: [
    "property:view",
    "analysis:view",
    "history:view",
    "analytics:view",
    "conflict:view",
  ],
  PUBLIC_USER: [
    "property:view",
  ],
};

/**
 * Route-to-Role Mapping for Direct URL & Navigation Protection
 */
export const ROUTE_ACCESS_RULES: Record<string, { allowedRoles: AppRole[]; description: string }> = {
  "/overview": {
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "SURVEYOR", "ANALYST", "PLANNER", "PUBLIC_USER"],
    description: "Role-Specific Overview & Workspace Dashboard",
  },
  "/3d-city": {
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "SURVEYOR", "ANALYST", "PLANNER", "PUBLIC_USER"],
    description: "Cesium 3D Digital Twin & Volumetric Buildings",
  },
  "/properties": {
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "SURVEYOR", "ANALYST", "PLANNER", "PUBLIC_USER"],
    description: "2D Cadastral Parcels & 3D ULPIN Registry",
  },
  "/evidence": {
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "SURVEYOR", "ANALYST"],
    description: "Cryptographic Evidence Vault & Provenance Lineage",
  },
  "/verification": {
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "SURVEYOR"],
    description: "Human Verification Workflow & Statutory Review Queue",
  },
  "/conflicts": {
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "ANALYST"],
    description: "Spatial Discrepancy Engine & Setback Overlap Detection",
  },
  "/spatial-investigator": {
    allowedRoles: ["ADMIN", "ANALYST"],
    description: "AI Spatial Investigator & Natural-Language Geo Queries",
  },
  "/spatial-analysis": {
    allowedRoles: ["ADMIN", "ANALYST"],
    description: "Topological Analysis Engine & 3D Spatial Geometry Validation",
  },
  "/history": {
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "ANALYST"],
    description: "4D Temporal Cadastre History & Multi-Epoch Change Scrubber",
  },
  "/analytics": {
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "ANALYST"],
    description: "Spatial Quality Intelligence & Explainable Scoring",
  },
  "/admin": {
    allowedRoles: ["ADMIN"],
    description: "Platform Administration & System Controls",
  },
  "/admin/users": {
    allowedRoles: ["ADMIN"],
    description: "User Identity & Evaluator Persona Directory",
  },
  "/admin/roles": {
    allowedRoles: ["ADMIN"],
    description: "Role Capability Matrix & Privilege Assignments",
  },
  "/admin/audit": {
    allowedRoles: ["ADMIN"],
    description: "Security Audit Trail & Chained Hash Signatures",
  },
  "/admin/settings": {
    allowedRoles: ["ADMIN"],
    description: "GIS Engine Parameters & Municipal Boundary Settings",
  },
};

/**
 * Checks whether an authenticated user holds a specific permission.
 * ADMIN possesses universal authorization.
 */
export function hasPermission(
  user: AuthUser | null,
  permission: Permission | Permission[]
): boolean {
  if (!user || !user.roles || user.roles.length === 0) return false;
  if (user.roles.includes("ADMIN")) return true;

  const userPerms = new Set<Permission>();
  for (const role of user.roles) {
    const perms = ROLE_PERMISSIONS[role] || [];
    for (const p of perms) {
      userPerms.add(p);
    }
  }

  if (Array.isArray(permission)) {
    return permission.some((p) => userPerms.has(p));
  }
  return userPerms.has(permission);
}

/**
 * Checks whether an authenticated user matches required roles.
 * ADMIN has universal authorization.
 */
export function hasRole(
  user: AuthUser | null,
  role: AppRole | AppRole[]
): boolean {
  if (!user || !user.roles || user.roles.length === 0) return false;
  if (user.roles.includes("ADMIN")) return true;

  if (Array.isArray(role)) {
    return role.some((r) => user.roles.includes(r));
  }
  return user.roles.includes(role);
}

/**
 * Checks whether an authenticated user is authorized to access a pathname.
 */
export function canAccessRoute(
  pathname: string,
  user: AuthUser | null
): boolean {
  if (!user) return false;
  if (user.roles.includes("ADMIN")) return true;

  // Exact match
  if (ROUTE_ACCESS_RULES[pathname]) {
    return ROUTE_ACCESS_RULES[pathname].allowedRoles.some((role) =>
      user.roles.includes(role)
    );
  }

  // Prefix match (e.g. /conflicts/123 -> /conflicts)
  const baseRoute = Object.keys(ROUTE_ACCESS_RULES).find((route) => {
    if (route === "/admin" && pathname.startsWith("/admin")) return true;
    if (route !== "/overview" && route !== "/admin" && pathname.startsWith(route)) return true;
    return false;
  });

  if (baseRoute) {
    return ROUTE_ACCESS_RULES[baseRoute].allowedRoles.some((role) =>
      user.roles.includes(role)
    );
  }

  return true;
}
