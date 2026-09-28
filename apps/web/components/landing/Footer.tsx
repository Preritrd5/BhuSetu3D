"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full bg-[#0B0E0C] border-t border-[rgba(244,240,232,0.08)] text-[#77867C] font-sans select-none relative overflow-hidden">
      {/* Subtle Geodetic Grid Texture */}
      <div className="absolute inset-0 bg-geodetic-grid opacity-20 pointer-events-none" />

      {/* ============================================================ */}
      {/* ZONE A: MAIN FOOTER INFORMATION & NAVIGATION COLUMNS         */}
      {/* ============================================================ */}
      <div className="relative z-10 w-full px-6 sm:px-8 lg:px-12 xl:px-16 pt-16 lg:pt-20 pb-12 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* -------------------------------------------------------- */}
          {/* LEFT: BhuSetu 3D Brand Block (4–5 Columns)               */}
          {/* -------------------------------------------------------- */}
          <div className="lg:col-span-4 xl:col-span-5 flex flex-col items-start space-y-5 text-left">
            {/* Brand Identity */}
            <Link
              href="/"
              className="flex items-center gap-3.5 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B56E48] rounded-[6px]"
            >
              {/* Official BhuSetu 3D Brand Logo */}
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-[8px] overflow-hidden shrink-0 shadow-sm group-hover:scale-[1.02] transition-transform duration-200">
                <Image
                  src="/brand/bhusetu-logo.webp"
                  alt="BhuSetu 3D Official Brand Logo"
                  width={44}
                  height={44}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-sans text-xl font-bold tracking-tight text-[#F4F0E8] leading-tight">
                  BhuSetu 3D
                </span>
                <span className="text-xs text-[#77867C] font-mono tracking-tight leading-tight mt-0.5">
                  Evidence-Backed Spatial Intelligence
                </span>
              </div>
            </Link>

            {/* Product Positioning Statement */}
            <p className="text-sm text-[#9BA89F] font-sans leading-relaxed max-w-sm">
              Evidence-backed 3D property intelligence for connected spatial understanding, volumetric cadastral investigation, and statutory verification across the built environment.
            </p>

            {/* Meaningful Platform Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141816] border border-[rgba(244,240,232,0.1)] text-[11px] font-mono text-[#D9D2C5]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#23847D] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#23847D]" />
              </span>
              <span className="text-[#77867C]">Spatial Engine:</span>
              <span className="text-[#23847D] font-semibold">Active</span>
              <span className="text-[#6F7772]">·</span>
              <span className="text-[#77867C]">EPSG:32643 UTM 43N</span>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* RIGHT: Structured Navigation Columns (7–8 Columns)       */}
          {/* -------------------------------------------------------- */}
          <div className="lg:col-span-8 xl:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-10">
            {/* Column 1: PLATFORM */}
            <div className="space-y-4 text-left">
              <h3 className="text-xs font-mono font-semibold tracking-wider text-[#F4F0E8] uppercase">
                Platform
              </h3>
              <ul className="space-y-2.5 text-[13px] font-sans">
                <li>
                  <Link
                    href="/3d-city"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    3D Digital Twin
                  </Link>
                </li>
                <li>
                  <Link
                    href="/properties"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    Cadastral Registry
                  </Link>
                </li>
                <li>
                  <a
                    href="#hierarchy"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    3D Hierarchy
                  </a>
                </li>
                <li>
                  <Link
                    href="/overview"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    Workspace Overview
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: INTELLIGENCE */}
            <div className="space-y-4 text-left">
              <h3 className="text-xs font-mono font-semibold tracking-wider text-[#F4F0E8] uppercase">
                Intelligence
              </h3>
              <ul className="space-y-2.5 text-[13px] font-sans">
                <li>
                  <Link
                    href="/evidence"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    Evidence Vault
                  </Link>
                </li>
                <li>
                  <Link
                    href="/spatial-investigator"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    Spatial Investigator
                  </Link>
                </li>
                <li>
                  <Link
                    href="/conflicts"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    Discrepancy Matrix
                  </Link>
                </li>
                <li>
                  <Link
                    href="/analytics"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    Quality Analytics
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: WORKFLOWS */}
            <div className="space-y-4 text-left">
              <h3 className="text-xs font-mono font-semibold tracking-wider text-[#F4F0E8] uppercase">
                Workflows
              </h3>
              <ul className="space-y-2.5 text-[13px] font-sans">
                <li>
                  <Link
                    href="/spatial-analysis"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    Spatial Analysis
                  </Link>
                </li>
                <li>
                  <Link
                    href="/verification"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    Cadastral Verification
                  </Link>
                </li>
                <li>
                  <Link
                    href="/history"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    Audit Lineage
                  </Link>
                </li>
                <li>
                  <a
                    href="#workflow"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    Statutory Review
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: ACCESS & GOVERNANCE */}
            <div className="space-y-4 text-left">
              <h3 className="text-xs font-mono font-semibold tracking-wider text-[#F4F0E8] uppercase">
                Access & Docs
              </h3>
              <ul className="space-y-2.5 text-[13px] font-sans">
                <li>
                  <Link
                    href="/login"
                    className="text-[#B56E48] hover:text-[#A35E39] font-medium transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    Sign In to Platform
                  </Link>
                </li>
                <li>
                  <a
                    href="#platform"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    Continuity Lifecycle
                  </a>
                </li>
                <li>
                  <a
                    href="#pillars"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    Product Pillars
                  </a>
                </li>
                <li>
                  <a
                    href="#evidence"
                    className="text-[#D9D2C5] hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
                  >
                    Sensor Fusion Specs
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ZONE B: BOTTOM UTILITY & GOVERNANCE BAR                      */}
      {/* ============================================================ */}
      <div className="relative z-10 w-full border-t border-[rgba(244,240,232,0.08)] bg-[#080B09] px-6 sm:px-8 lg:px-12 xl:px-16 py-6">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#77867C]">
          {/* Left: Copyright & Technical Coordinate System */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-center sm:text-left">
            <span className="text-[#9BA89F]">© 2026 BhuSetu 3D. All rights reserved.</span>
            <span className="hidden md:inline text-[#6F7772]">·</span>
            <span className="hidden md:inline text-[#77867C]">PostGIS 3.4 · EPSG:32643 UTM 43N</span>
          </div>

          {/* Right: Governance & Security Anchors */}
          <div className="flex flex-wrap items-center gap-6 text-[#9BA89F]">
            <a
              href="#evidence"
              className="hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
            >
              Provenance & Audit
            </a>
            <a
              href="#platform"
              className="hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
            >
              Cadastral Accuracy
            </a>
            <Link
              href="/login"
              className="hover:text-[#F4F0E8] transition-colors focus-visible:outline-none focus-visible:text-[#B56E48]"
            >
              Role-Based Access
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
