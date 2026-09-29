"use client";

/**
 * BhuSetu 3D Application Shell TopBar
 * Evidence-Backed 3D Property Intelligence Platform
 */
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Globe2, Shield, LogOut, User as UserIcon, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigationDrawer } from "@/hooks/useNavigationDrawer";
import { AppRole } from "@/types/auth";

export function TopBar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { toggleDrawer } = useNavigationDrawer();

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
        return "bg-[#141816] text-[#8C988F] border-[rgba(244,240,232,0.08)]";
    }
  };

  const primaryRole = user?.roles?.[0] || "PUBLIC_USER";

  return (
    <header className="h-16 border-b border-[rgba(244,240,232,0.12)] bg-[#0C0F0D]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 select-none shadow-sm">
      {/* Brand Identity & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        {/* Mobile Navigation Drawer Toggle */}
        <button
          onClick={toggleDrawer}
          className="lg:hidden p-2 rounded-[6px] border border-[rgba(244,240,232,0.12)] bg-[#141816] text-[#F4F0E8] hover:bg-[#1A201D] transition-colors cursor-pointer shrink-0"
          title="Toggle Navigation Menu"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <Link href="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity group">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-[6px] overflow-hidden shrink-0 shadow-sm group-hover:scale-[1.03] transition-transform">
            <Image
              src="/brand/bhusetu-logo.webp"
              alt="BhuSetu 3D Official Brand Logo"
              width={40}
              height={40}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-base sm:text-lg text-[#F4F0E8] font-mono leading-none">
                BHUSETU 3D
              </span>
            </div>
            <span className="hidden md:block text-xs text-[#A7B3AB] truncate max-w-[280px] md:max-w-none font-sans mt-0.5">
              Evidence-Backed 3D Property Intelligence Platform
            </span>
          </div>
        </Link>
      </div>

      {/* User Session & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* User Details */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-[6px] bg-[#141816] border border-[rgba(244,240,232,0.10)]">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[4px] bg-[#1A201D] border border-[rgba(244,240,232,0.15)] flex items-center justify-center text-[#C47B50] text-xs font-bold shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden sm:flex flex-col text-left min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-[#F4F0E8] leading-tight truncate max-w-[140px]">
                  {user.name}
                </span>
                <span className="text-xs text-[#A7B3AB] font-mono leading-tight truncate max-w-[140px]">
                  {user.email}
                </span>
              </div>
              {/* Dynamic Role Badge */}
              <span
                className={`text-xs font-mono uppercase px-2.5 py-1 rounded-[4px] border font-bold shrink-0 ${getRoleBadgeStyle(
                  primaryRole
                )}`}
              >
                {primaryRole === "GOVERNMENT_OFFICER" ? "OFFICER" : primaryRole}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => logout()}
              title="Sign Out of Session"
              className="min-h-[38px] px-3 py-1.5 rounded-[6px] border border-[rgba(244,240,232,0.10)] hover:border-red-500/40 bg-[#141816] hover:bg-red-950/20 text-[#A7B3AB] hover:text-red-400 transition-all flex items-center justify-center gap-2 text-xs font-mono cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline font-semibold">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="px-4 py-2 rounded-[6px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.12)] hover:border-[rgba(244,240,232,0.25)] text-[#F4F0E8] text-xs sm:text-sm font-mono font-medium transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/overview"
              className="px-4 py-2 rounded-[6px] bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] text-xs sm:text-sm font-mono font-bold transition-all shadow-sm"
            >
              Launch Platform
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
