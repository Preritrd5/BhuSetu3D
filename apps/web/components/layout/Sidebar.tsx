"use client";

/**
 * BhuSetu 3D Role-Aware Sidebar Navigation
 * Evidence-Backed 3D Property Intelligence Platform
 */
import React, { useState } from "react";
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
  Lock,
  Info,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { AppRole } from "@/types/auth";

interface NavItemDef {
  id: string;
  label: string;
  icon: React.ElementType;
  isImplemented: boolean;
  allowedRoles: (AppRole | "*")[];
  description: string;
  href?: string;
}

const NAV_ITEMS: NavItemDef[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    isImplemented: true,
    allowedRoles: ["*"],
    description: "Authenticated workspace & live system telemetry.",
    href: "/overview",
  },
  {
    id: "city-3d",
    label: "3D City Twin",
    icon: Building2,
    isImplemented: true,
    allowedRoles: ["*"],
    description: "Cesium 3D building envelopes, floor cutaways & cadastral boundaries.",
    href: "/3d-city",
  },
  {
    id: "properties",
    label: "Properties",
    icon: MapPin,
    isImplemented: true,
    allowedRoles: ["*"],
    description: "2D Cadastral parcels & 3D ULPIN registry.",
    href: "/properties",
  },
  {
    id: "spatial-analysis",
    label: "Spatial Analysis",
    icon: Layers,
    isImplemented: true,
    allowedRoles: ["*"],
    description: "Topological relationships & 3D spatial geometry validation.",
    href: "/spatial-analysis",
  },
  {
    id: "conflicts",
    label: "Discrepancy Engine",
    icon: AlertTriangle,
    isImplemented: true,
    allowedRoles: ["*"],
    description: "Automated setback & vertical height encroachment detection.",
    href: "/conflicts",
  },
  {
    id: "spatial-investigator",
    label: "AI Spatial Investigator",
    icon: Sparkles,
    isImplemented: true,
    allowedRoles: ["*"],
    description: "Natural-language spatial queries & grounded AI investigation.",
    href: "/spatial-investigator",
  },
  {
    id: "evidence",
    label: "Cryptographic Vault",
    icon: FileCheck2,
    isImplemented: true,
    allowedRoles: ["*"],
    description: "Sensor datasets, lineage graph & SHA-256 confidence tracking.",
    href: "/evidence",
  },
  {
    id: "verification",
    label: "Review Queue",
    icon: UserCheck,
    isImplemented: true,
    allowedRoles: ["*"],
    description: "Statutory review queue & cryptographically chained audit trail.",
    href: "/verification",
  },
  {
    id: "history",
    label: "4D History Scrubber",
    icon: History,
    isImplemented: true,
    allowedRoles: ["*"],
    description: "4D temporal property history, change detection & infrastructure intelligence.",
    href: "/history",
  },
  {
    id: "analytics",
    label: "Analytics & Quality",
    icon: BarChart3,
    isImplemented: true,
    allowedRoles: ["*"],
    description: "Explainable data quality scoring, record completeness & enterprise spatial metrics.",
    href: "/analytics",
  },
  {
    id: "settings",
    label: "GIS Parameters",
    icon: Settings,
    isImplemented: false,
    allowedRoles: ["ADMIN"],
    description: "Coordinate system & municipal boundary parameters.",
  },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedItemInfo, setSelectedItemInfo] = useState<NavItemDef | null>(null);
  const { user } = useAuth();

  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes("ADMIN");

  const hasRolePermission = (allowedRoles: (AppRole | "*")[]) => {
    if (isAdmin) return true;
    if (allowedRoles.includes("*")) return true;
    return allowedRoles.some((role) => userRoles.includes(role as AppRole));
  };

  return (
    <aside className="w-64 border-r border-[rgba(244,240,232,0.08)] bg-[#0F1210] flex flex-col justify-between h-[calc(100vh-3.5rem)] sticky top-14 select-none">
      {/* Navigation List */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-[#6F7772] font-semibold flex items-center justify-between">
          <span>PLATFORM MODULES</span>
          <span className="text-[9px] text-[#23847D] font-bold bg-[#141816] border border-[rgba(244,240,232,0.12)] px-2 py-0.5 rounded-[4px]">
            10 MODULES
          </span>
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.href ? pathname === item.href : false;
          const isPermitted = hasRolePermission(item.allowedRoles);

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isImplemented && item.href) {
                  setSelectedItemInfo(null);
                  router.push(item.href);
                } else {
                  setSelectedItemInfo(item);
                }
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-xs font-mono transition-all group relative border",
                isActive
                  ? "bg-[#141816] border-[rgba(244,240,232,0.15)] text-[#F4F0E8] font-bold shadow-sm"
                  : isPermitted
                  ? "text-[#6F7772] hover:text-[#F4F0E8] hover:bg-[#141816] border-transparent hover:border-[rgba(244,240,232,0.08)]"
                  : "text-[#6F7772]/50 hover:text-[#6F7772] hover:bg-[#141816]/40 border-transparent"
              )}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0 transition-colors",
                    isActive
                      ? "text-[#C47B50]"
                      : isPermitted
                      ? "text-[#6F7772] group-hover:text-[#D9D2C5]"
                      : "text-[#6F7772]/40"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {/* Status / Role Badge */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!isPermitted ? (
                  <span
                    title="Access restricted"
                    className="p-1 rounded-[4px] bg-[#141816] text-[#6F7772] border border-[rgba(244,240,232,0.08)]"
                  >
                    <Lock className="w-3 h-3" />
                  </span>
                ) : item.isImplemented ? (
                  <span
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0.5 rounded-[4px] border font-bold",
                      isActive
                        ? "bg-[#B56E48]/20 text-[#C47B50] border-[#B56E48]/40"
                        : "bg-[#141816] text-[#6F7772] border-[rgba(244,240,232,0.08)]"
                    )}
                  >
                    Active
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[#141816] text-[#6F7772] border border-[rgba(244,240,232,0.08)]">
                    Config
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Information Drawer for Configuration Items */}
      {selectedItemInfo && (
        <div className="p-3 mx-3 mb-3 bg-[#141816] border border-[rgba(244,240,232,0.12)] rounded-[8px] text-left animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-[#C47B50] text-xs font-mono mb-1">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-semibold uppercase truncate">
              {selectedItemInfo.label}
            </span>
          </div>
          <p className="text-[11px] text-[#D9D2C5] leading-relaxed mb-2 font-sans">
            {selectedItemInfo.description}
          </p>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#6F7772] border-t border-[rgba(244,240,232,0.08)] pt-1.5">
            <span>Access:</span>
            <span className="text-[#F4F0E8] font-semibold">
              {selectedItemInfo.allowedRoles.includes("*")
                ? "All Roles"
                : selectedItemInfo.allowedRoles.join(", ")}
            </span>
          </div>
        </div>
      )}

      {/* Bottom Footer Information */}
      <div className="p-3 border-t border-[rgba(244,240,232,0.08)] bg-[#0F1210] flex items-center justify-between text-[11px] text-[#6F7772] font-mono">
        <span>SECURITY LEVEL</span>
        <span className="text-[#23847D] font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
          ACTIVE
        </span>
      </div>
    </aside>
  );
}
