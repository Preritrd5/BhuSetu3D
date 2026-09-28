"use client";

/**
 * BhuSetu 3D Application Shell TopBar
 * Evidence-Backed 3D Property Intelligence Platform
 */
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Globe2, Shield, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AppRole } from "@/types/auth";

export function TopBar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  // Hide navbar completely whenever session / auth is validating, or on dedicated full-screen views
  if (
    isLoading ||
    pathname === "/3d-city" ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup"
  ) {
    return null;
  }

  const getRoleBadgeStyle = (role: AppRole | string) => {
    switch (role) {
      case "ADMIN":
        return "bg-[#B56E48]/20 text-[#C47B50] border-[#B56E48]/40";
      case "GOVERNMENT_OFFICER":
        return "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/40";
      case "SURVEYOR":
        return "bg-[#1A201D] text-[#D9D2C5] border-[rgba(244,240,232,0.15)]";
      case "PLANNER":
        return "bg-[#1A201D] text-[#D9D2C5] border-[rgba(244,240,232,0.15)]";
      case "ANALYST":
        return "bg-[#176C68]/15 text-[#23847D] border-[#176C68]/30";
      default:
        return "bg-[#141816] text-[#6F7772] border-[rgba(244,240,232,0.08)]";
    }
  };

  const primaryRole = user?.roles?.[0] || "PUBLIC_USER";

  return (
    <header className="h-14 border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210]/95 backdrop-blur-md px-6 flex items-center justify-between z-30 sticky top-0 select-none">
      {/* Brand Identity */}
      <Link href="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity group">
        <div className="relative w-8 h-8 rounded-[6px] overflow-hidden shrink-0 shadow-sm group-hover:scale-[1.03] transition-transform">
          <Image
            src="/brand/bhusetu-logo.webp"
            alt="BhuSetu 3D Official Brand Logo"
            width={32}
            height={32}
            priority
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-sm text-[#F4F0E8] font-mono">
              BHUSETU 3D
            </span>
          </div>
          <span className="text-[11px] text-[#6F7772] truncate max-w-[200px] md:max-w-none font-sans">
            Evidence-Backed 3D Property Intelligence Platform
          </span>
        </div>
      </Link>


      {/* User Session & Actions */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            {/* User Details */}
            <div className="flex items-center gap-2.5 px-3 py-1 rounded-[6px] bg-[#141816] border border-[rgba(244,240,232,0.08)]">
              <div className="w-6 h-6 rounded-[4px] bg-[#1A201D] border border-[rgba(244,240,232,0.12)] flex items-center justify-center text-[#C47B50] text-xs font-bold">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-[#F4F0E8] leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-[#6F7772] font-mono leading-tight">
                  {user.email}
                </span>
              </div>
              {/* Dynamic Role Badge */}
              <span
                className={`ml-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded-[4px] border font-bold ${getRoleBadgeStyle(
                  primaryRole
                )}`}
              >
                {primaryRole}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => logout()}
              title="Sign Out of Session"
              className="p-1.5 rounded-[6px] border border-[rgba(244,240,232,0.08)] hover:border-red-500/40 bg-[#141816] hover:bg-red-950/20 text-[#6F7772] hover:text-red-400 transition-all flex items-center gap-1.5 text-xs font-mono"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-[6px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.2)] text-[#F4F0E8] text-xs font-mono font-medium transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/overview"
              className="px-3.5 py-1.5 rounded-[6px] bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] text-xs font-mono font-bold transition-all shadow-sm"
            >
              Launch Platform
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
