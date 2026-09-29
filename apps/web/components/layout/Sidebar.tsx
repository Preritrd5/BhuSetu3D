"use client";

/**
 * BhuSetu 3D Role-Governed Dynamic Sidebar Navigation
 * Evidence-Backed 3D Property Intelligence Platform
 */
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Layers,
  MapPin,
  AlertTriangle,
  FileCheck2,
  UserCheck,
  History,
  Settings,
  Sparkles,
  BarChart3,
  Users,
  Shield,
  ShieldAlert,
  Sliders,
  FileText,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigationDrawer } from "@/hooks/useNavigationDrawer";
import { AppRole } from "@/types/auth";
import { Permission, hasRole, hasPermission } from "@/lib/auth/permissions";

interface NavItemDef {
  id: string;
  label: string;
  icon: React.ElementType;
  allowedRoles: AppRole[];
  requiredPermission?: Permission;
  description: string;
  href: string;
  badge?: string;
  badgeColor?: string;
}

// 1. Core Platform Operational Modules
const ALL_OPERATIONAL_ITEMS: NavItemDef[] = [
  {
    id: "overview",
    label: "Workspace Overview",
    icon: LayoutDashboard,
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "SURVEYOR", "ANALYST", "PLANNER", "PUBLIC_USER"],
    description: "Role-specific mission overview & spatial telemetry.",
    href: "/overview",
  },
  {
    id: "verification",
    label: "Statutory Review Queue",
    icon: UserCheck,
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "SURVEYOR"],
    requiredPermission: "verification:view",
    description: "Statutory verification queue & cryptographically chained audit decisions.",
    href: "/verification",
    badge: "Official",
    badgeColor: "bg-[#176C68]/20 text-[#2EB8B0] border-[#176C68]/40",
  },
  {
    id: "spatial-investigator",
    label: "AI Spatial Investigator",
    icon: Sparkles,
    allowedRoles: ["ADMIN", "ANALYST"],
    requiredPermission: "investigation:view",
    description: "Natural-language spatial queries & grounded Gemini AI investigation.",
    href: "/spatial-investigator",
    badge: "Grounded AI",
    badgeColor: "bg-[#176C68]/20 text-[#2EB8B0] border-[#176C68]/40",
  },
  {
    id: "city-3d",
    label: "3D City Twin",
    icon: Building2,
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "SURVEYOR", "ANALYST", "PLANNER", "PUBLIC_USER"],
    description: "Cesium 3D building envelopes, multi-floor strata & cadastral parcels.",
    href: "/3d-city",
  },
  {
    id: "properties",
    label: "Cadastral Properties",
    icon: MapPin,
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "SURVEYOR", "ANALYST", "PLANNER", "PUBLIC_USER"],
    description: "2D Cadastral parcels, 3D ULPIN registry & spatial geometry.",
    href: "/properties",
  },
  {
    id: "conflicts",
    label: "Discrepancy Engine",
    icon: AlertTriangle,
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "ANALYST"],
    requiredPermission: "conflict:view",
    description: "Automated setback violations & vertical height deviation detection.",
    href: "/conflicts",
    badge: "Audited",
    badgeColor: "bg-[#B56E48]/20 text-[#E09F67] border-[#B56E48]/40",
  },
  {
    id: "spatial-analysis",
    label: "Spatial Analysis",
    icon: Layers,
    allowedRoles: ["ADMIN", "ANALYST"],
    requiredPermission: "analysis:view",
    description: "Topological relationships, buffer intersections & 3D geometry validation.",
    href: "/spatial-analysis",
  },
  {
    id: "evidence",
    label: "Cryptographic Vault",
    icon: FileCheck2,
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "SURVEYOR", "ANALYST"],
    requiredPermission: "evidence:view",
    description: "Sensor datasets, photogrammetry & SHA-256 confidence tracking.",
    href: "/evidence",
  },
  {
    id: "history",
    label: "4D History Scrubber",
    icon: History,
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "ANALYST"],
    requiredPermission: "history:view",
    description: "4D temporal property history, change detection & multi-epoch scans.",
    href: "/history",
  },
  {
    id: "analytics",
    label: "Analytics & Quality",
    icon: BarChart3,
    allowedRoles: ["ADMIN", "GOVERNMENT_OFFICER", "ANALYST"],
    requiredPermission: "analytics:view",
    description: "7-dimension explainable data quality scoring & spatial conformance.",
    href: "/analytics",
  },
];

// 2. Platform Administration Modules (ADMIN Only)
const ADMIN_MODULES: NavItemDef[] = [
  {
    id: "admin-users",
    label: "User Access Directory",
    icon: Users,
    allowedRoles: ["ADMIN"],
    requiredPermission: "admin:users",
    description: "Institutional user accounts, active sessions & persona management.",
    href: "/admin/users",
    badge: "Admin",
    badgeColor: "bg-[#B56E48]/20 text-[#E09F67] border-[#B56E48]/40",
  },
  {
    id: "admin-roles",
    label: "Role Capability Matrix",
    icon: Shield,
    allowedRoles: ["ADMIN"],
    requiredPermission: "admin:roles",
    description: "Canonical RBAC capability assignments & permission rules.",
    href: "/admin/roles",
    badge: "Admin",
    badgeColor: "bg-[#B56E48]/20 text-[#E09F67] border-[#B56E48]/40",
  },
  {
    id: "admin-audit",
    label: "Security Audit Trail",
    icon: FileText,
    allowedRoles: ["ADMIN"],
    requiredPermission: "admin:audit",
    description: "Chained cryptographic audit logs of all platform operations.",
    href: "/admin/audit",
    badge: "SecOps",
    badgeColor: "bg-[#B56E48]/20 text-[#E09F67] border-[#B56E48]/40",
  },
  {
    id: "admin-settings",
    label: "GIS Engine Settings",
    icon: Sliders,
    allowedRoles: ["ADMIN"],
    requiredPermission: "admin:settings",
    description: "Coordinate reference systems (EPSG:32643) & municipal parameters.",
    href: "/admin/settings",
    badge: "Config",
    badgeColor: "bg-[#B56E48]/20 text-[#E09F67] border-[#B56E48]/40",
  },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { isOpen, closeDrawer } = useNavigationDrawer();

  const userRole = user?.roles?.[0] || "PUBLIC_USER";
  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  // Filter operational items dynamically by authorized role and permission
  const authorizedOperationalItems = ALL_OPERATIONAL_ITEMS.filter((item) => {
    if (isAdmin) return true;
    if (item.requiredPermission && !hasPermission(user, item.requiredPermission)) {
      return false;
    }
    return hasRole(user, item.allowedRoles);
  });

  // Filter admin items strictly for ADMIN
  const authorizedAdminItems = isAdmin ? ADMIN_MODULES : [];

  const handleNavClick = (href: string) => {
    closeDrawer();
    router.push(href);
  };

  const renderNavContent = () => (
    <>
      {/* Navigation Scrollable Body */}
      <div className="p-3 space-y-4 overflow-y-auto flex-1">
        {/* Role Identity Card in Sidebar */}
        <div className="p-2.5 rounded-[8px] bg-[#121614] border border-[rgba(244,240,232,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-[4px] bg-[#161D1A] border border-[rgba(244,240,232,0.08)] flex items-center justify-center text-[#2EB8B0] font-mono text-xs font-bold shrink-0">
              {user?.name ? user.name.split(" ").map((n) => n[0]).join("") : "U"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#F4F0E8] font-mono truncate">
                {user?.name || "Evaluator"}
              </div>
              <div className="text-[11px] text-[#A7B3AB] font-mono truncate">
                {user?.department || "Cadastre Unit"}
              </div>
            </div>
          </div>
          <span
            className={cn(
              "text-[11px] font-mono px-2 py-0.5 rounded-[4px] border font-bold uppercase shrink-0",
              isAdmin
                ? "bg-[#B56E48]/20 text-[#E09F67] border-[#B56E48]/40"
                : userRole === "GOVERNMENT_OFFICER"
                ? "bg-[#176C68]/20 text-[#2EB8B0] border-[#176C68]/40"
                : userRole === "SURVEYOR"
                ? "bg-[#2A443B]/30 text-[#4ADE80] border-[#2A443B]/60"
                : "bg-[#253248]/30 text-[#60A5FA] border-[#253248]/60"
            )}
          >
            {userRole === "GOVERNMENT_OFFICER" ? "OFFICER" : userRole}
          </span>
        </div>

        {/* SECTION 1: ROLE-AUTHORIZED OPERATIONAL MODULES */}
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-[11px] font-mono uppercase tracking-widest text-[#94A3B8] font-semibold flex items-center justify-between">
            <span>AUTHORIZED WORKSPACE</span>
            <span className="text-[11px] text-[#2EB8B0] font-bold bg-[#141816] border border-[rgba(244,240,232,0.08)] px-1.5 py-0.5 rounded-[3px]">
              {authorizedOperationalItems.length} MODULES
            </span>
          </div>

          {authorizedOperationalItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/overview" && pathname.startsWith(item.href));

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] text-xs font-mono transition-all group border text-left cursor-pointer min-h-[40px]",
                  isActive
                    ? "bg-[#171D1A] border-[#23847D]/50 text-[#F4F0E8] font-semibold shadow-sm"
                    : "text-[#CBD5E1] hover:text-[#F4F0E8] hover:bg-[#141816] border-transparent hover:border-[rgba(244,240,232,0.06)]"
                )}
                title={item.description}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0 transition-colors",
                      isActive
                        ? "text-[#2EB8B0]"
                        : "text-[#94A3B8] group-hover:text-[#F4F0E8]"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      "text-[11px] font-mono px-1.5 py-0.5 rounded-[3px] border font-bold uppercase",
                      item.badgeColor || "bg-[#161B18] text-[#CBD5E1] border-[rgba(244,240,232,0.08)]"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* SECTION 2: PLATFORM ADMINISTRATION (ADMIN ONLY) */}
        {authorizedAdminItems.length > 0 && (
          <div className="space-y-1 pt-3 border-t border-[rgba(244,240,232,0.06)]">
            <div className="px-2 py-1.5 text-[11px] font-mono uppercase tracking-widest text-[#E09F67] font-semibold flex items-center justify-between">
              <span>ADMINISTRATION</span>
              <span className="text-[11px] text-[#E09F67] font-bold bg-[#1C1613] border border-[#B56E48]/35 px-1.5 py-0.5 rounded-[3px]">
                RESTRICTED
              </span>
            </div>

            {authorizedAdminItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] text-xs font-mono transition-all group border text-left cursor-pointer min-h-[40px]",
                    isActive
                      ? "bg-[#1C1613] border-[#B56E48]/50 text-[#F4F0E8] font-semibold shadow-sm"
                      : "text-[#CBD5E1] hover:text-[#F4F0E8] hover:bg-[#161311] border-transparent hover:border-[#B56E48]/20"
                  )}
                  title={item.description}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0 transition-colors",
                        isActive
                          ? "text-[#E09F67]"
                          : "text-[#B56E48]/80 group-hover:text-[#E09F67]"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "text-[11px] font-mono px-1.5 py-0.5 rounded-[3px] border font-bold uppercase",
                        item.badgeColor
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Footer Information */}
      <div className="p-3 border-t border-[rgba(244,240,232,0.06)] bg-[#0A0D0B] flex items-center justify-between text-xs text-[#CBD5E1] font-mono shrink-0">
        <span className="text-[11px] text-[#94A3B8]">RBAC Policy: Active</span>
        <span className="text-[#2EB8B0] font-semibold flex items-center gap-1.5 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
          Level 4 Clearance
        </span>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Fixed Structural Left Navigation Rail */}
      <aside className="hidden lg:flex w-64 border-r border-[rgba(244,240,232,0.06)] bg-[#0C0F0D] flex-col justify-between h-[calc(100vh-3.5rem)] sticky top-14 select-none shrink-0">
        {renderNavContent()}
      </aside>

      {/* Mobile/Tablet Slide-over Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Drawer Canvas */}
          <aside className="relative w-72 max-w-[85vw] bg-[#0C0F0D] border-r border-[rgba(244,240,232,0.08)] flex flex-col justify-between z-10 shadow-2xl h-full animate-in slide-in-from-left duration-200">
            {/* Drawer Header with Title and Close Trigger */}
            <div className="h-14 px-4 border-b border-[rgba(244,240,232,0.08)] flex items-center justify-between shrink-0 bg-[#0F1210]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#F4F0E8] tracking-wider">
                  BHUSETU 3D
                </span>
                <span className="text-[11px] font-mono text-[#8C988F]">MENU</span>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 rounded-[6px] bg-[#141816] hover:bg-[#1A201D] text-[#8C988F] hover:text-[#F4F0E8] border border-[rgba(244,240,232,0.08)] cursor-pointer"
                title="Close Navigation"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
}
