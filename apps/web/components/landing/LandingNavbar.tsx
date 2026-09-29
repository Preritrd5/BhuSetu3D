"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Compass,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";

interface NavLinkItem {
  label: string;
  href: string;
  badge?: string;
}

const NAV_LINKS: NavLinkItem[] = [
  { label: "Platform", href: "#platform" },
  { label: "Capabilities", href: "#pillars" },
  { label: "3D Hierarchy", href: "#hierarchy", badge: "3D" },
  { label: "Evidence & Trust", href: "#evidence" },
  { label: "Investigation", href: "#intelligence" },
  { label: "Workflow", href: "#workflow" },
];

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("platform");

  // Track window scroll position for subtle background elevation (no hard borders or heavy shadows)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver to dynamically highlight the current section in view
  useEffect(() => {
    const sectionIds = ["platform", "pillars", "hierarchy", "evidence", "intelligence", "workflow"];
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    sectionElements.forEach((el) => observer.observe(el));

    return () => {
      sectionElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Smooth scroll handler for anchor links
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const offset = 76;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = targetElement.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
        setActiveSection(targetId);
      }
      setMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 select-none ${
        isScrolled
          ? "h-[74px] bg-[#0F1210]/95 backdrop-blur-md"
          : "h-[78px] bg-transparent"
      }`}
    >
      {/* 3-Zone Stable Desktop Layout: LEFT (Brand) · CENTER (Navigation) · RIGHT (Sign In) */}
      <div className="w-full h-full px-6 sm:px-8 lg:px-12 xl:px-16 grid grid-cols-[auto_1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* ============================================================ */}
        {/* ZONE 1 (LEFT): BhuSetu 3D Brand Anchor                       */}
        {/* ============================================================ */}
        <div className="flex items-center justify-start">
          <Link
            href="/"
            className="flex items-center gap-3.5 group shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B56E48] rounded-[6px]"
          >
            {/* Official BhuSetu 3D Brand Logo */}
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-[8px] overflow-hidden shrink-0 shadow-sm group-hover:scale-[1.02] transition-transform duration-200">
              <Image
                src="/brand/bhusetu-logo.webp"
                alt="BhuSetu 3D Official Brand Logo"
                width={44}
                height={44}
                priority
                className="w-full h-full object-contain"
              />
            </div>

            {/* Product Name & Institutional Descriptor */}
            <div className="flex flex-col text-left">
              <span className="font-sans text-xl sm:text-[22px] lg:text-[24px] font-bold tracking-tight text-[#F4F0E8] leading-tight">
                BhuSetu 3D
              </span>
              {/* <span className="text-xs sm:text-[13px] text-[#77867C] font-mono tracking-tight block leading-tight mt-0.5">
                Evidence-Backed Spatial Intelligence
              </span> */}
            </div>
          </Link>
        </div>

        {/* ============================================================ */}
        {/* ZONE 2 (CENTER): Centered Interactive Navigation             */}
        {/* ============================================================ */}
        <nav
          aria-label="Main Navigation"
          className="hidden lg:flex items-center justify-center gap-1.5 xl:gap-2"
        >
          {NAV_LINKS.map((link) => {
            const sectionTarget = link.href.replace("#", "");
            const isActive = activeSection === sectionTarget;

            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`relative px-3.5 py-2 rounded-[6px] text-[15px] xl:text-[16px] font-sans font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer border border-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B56E48] ${
                  isActive
                    ? "text-[#F4F0E8] bg-[#141816]/70 border-[rgba(244,240,232,0.1)]"
                    : "text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#141816]/80 hover:border-[rgba(244,240,232,0.1)] active:bg-[#1A201D]"
                }`}
              >
                <span>{link.label}</span>

                {/* Subtle Contextual Badge (e.g. 3D) */}
                {link.badge && (
                  <span
                    className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-[3px] ${
                      isActive
                        ? "bg-[#B56E48]/20 text-[#B56E48] border border-[#B56E48]/40"
                        : "bg-[#1A201D] text-[#77867C] border border-[rgba(244,240,232,0.08)]"
                    }`}
                  >
                    {link.badge}
                  </span>
                )}

                {/* Active Accent Indicator */}
                {isActive && (
                  <span className="absolute bottom-0.5 left-3.5 right-3.5 h-[2px] bg-[#B56E48] rounded-full" />
                )}
              </a>
            );
          })}
        </nav>

        {/* ============================================================ */}
        {/* ZONE 3 (RIGHT): Filled Sign In Button + Mobile Toggle        */}
        {/* ============================================================ */}
        <div className="flex items-center justify-end gap-3">
          {/* Filled Accent Sign In Button */}
          <Link
            href="/login"
            className="hidden sm:inline-flex h-[42px] px-5 sm:px-6 rounded-[6px] bg-[#B56E48] hover:bg-[#A35E39] active:bg-[#924E2B] text-[#F4F0E8] text-[15px] font-semibold tracking-wide transition-all duration-200 items-center justify-center shadow-[0_2px_10px_rgba(181,110,72,0.2)] hover:shadow-[0_4px_16px_rgba(181,110,72,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4F0E8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1210]"
          >
            Sign In
          </Link>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((p) => !p)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-2.5 rounded-[6px] bg-[#141816] border border-[rgba(244,240,232,0.1)] text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B56E48] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Mobile Drawer Navigation Menu                                */}
      {/* ============================================================ */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-[74px] left-0 w-full bg-[#0F1210]/98 backdrop-blur-xl border-b border-[rgba(244,240,232,0.1)] p-6 flex flex-col gap-4 animate-in fade-in duration-200 shadow-2xl z-50">
          <nav aria-label="Mobile Navigation" className="flex flex-col gap-1 font-sans text-sm">
            {NAV_LINKS.map((link) => {
              const sectionTarget = link.href.replace("#", "");
              const isActive = activeSection === sectionTarget;

              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`p-3 rounded-[6px] flex items-center justify-between transition-all duration-150 ${
                    isActive
                      ? "bg-[#1A201D] text-[#F4F0E8] font-semibold border-l-2 border-[#B56E48]"
                      : "text-[#D9D2C5] hover:text-[#F4F0E8] hover:bg-[#141816]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[15px]">{link.label}</span>
                    {link.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#141816] text-[#77867C] border border-[rgba(244,240,232,0.08)]">
                        {link.badge}
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-[rgba(244,240,232,0.08)] flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full text-center py-2.5 rounded-[6px] bg-[#B56E48] text-[#F4F0E8] text-[15px] font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
