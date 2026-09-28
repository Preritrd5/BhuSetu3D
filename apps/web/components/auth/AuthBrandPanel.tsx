"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Layers,
  FileCheck2,
  Sparkles,
  UserCheck,
  ShieldCheck,
  Compass,
} from "lucide-react";

interface AuthBrandPanelProps {
  mode: "SIGN_IN" | "SIGN_UP";
}

export const AuthBrandPanel: React.FC<AuthBrandPanelProps> = ({ mode }) => {
  const isSignIn = mode === "SIGN_IN";

  return (
    <div className="relative w-full md:w-[42%] lg:w-[40%] bg-[#0E1210] text-[#F4F0E8] p-8 lg:p-10 flex flex-col justify-between overflow-hidden select-none border-b md:border-b-0 md:border-r border-[rgba(244,240,232,0.08)]">
      {/* Background Decorative Spatial Grid & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(244,240,232,0.05)_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#B56E48]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#176C68]/8 rounded-full blur-3xl pointer-events-none" />

      {/* Top Section: Brand Identity & Mode Pill */}
      <div className="relative z-10 space-y-6">
        {/* Brand Header */}
        <Link href="/" className="inline-flex items-center gap-3.5 group">
          <div className="relative w-11 h-11 rounded-[8px] overflow-hidden shrink-0 shadow-sm group-hover:scale-[1.02] transition-transform duration-200">
            <Image
              src="/brand/bhusetu-logo.webp"
              alt="BhuSetu 3D Official Brand Logo"
              width={44}
              height={44}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-xl font-bold tracking-tight text-[#F4F0E8]">
                BhuSetu 3D
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#23847D] animate-pulse" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#77867C] block font-medium">
              Evidence-Backed Spatial Intelligence
            </span>
          </div>
        </Link>

        {/* Context Pill Badge */}
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A201D] border border-[rgba(244,240,232,0.1)] text-[11px] font-mono text-[#D9D2C5] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#23847D] animate-pulse" />
            <span>{isSignIn ? "Spatial Workspace Access" : "Workspace Onboarding"}</span>
          </span>
        </div>

        {/* Hero Copy */}
        <div className="space-y-2 pt-1">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#F4F0E8] leading-tight font-sans">
            {isSignIn ? (
              <>
                Enter the <span className="text-[#B56E48]">Spatial</span> Workspace.
              </>
            ) : (
              <>
                Build Your <span className="text-[#B56E48]">Spatial</span> Workspace.
              </>
            )}
          </h1>
          <p className="text-xs lg:text-[13px] text-[#77867C] leading-relaxed font-sans">
            {isSignIn
              ? "Explore connected 3D property data, spatial intelligence, multi-sensor evidence and investigation in one unified workspace."
              : "Create your BhuSetu account for connected 3D property intelligence, cadastral modeling, and evidence-backed verification."}
          </p>
        </div>

        {/* Subtle Spatial Isometric Graphic */}
        <div className="relative py-2 hidden sm:block">
          <div className="w-full h-28 rounded-[12px] bg-[#0B0E0C] border border-[rgba(244,240,232,0.08)] p-3 relative overflow-hidden flex items-center justify-between">
            {/* Ambient Graphic Visual: Isometric Cadastral Mesh */}
            <svg
              className="w-full h-full opacity-80"
              viewBox="0 0 320 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Cadastral Base Grid Lines */}
              <path
                d="M40 80 L160 30 L280 80 L160 98 Z"
                stroke="rgba(244,240,232,0.1)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <path
                d="M100 55 L220 55"
                stroke="rgba(244,240,232,0.06)"
                strokeWidth="1"
              />
              {/* Parcel Boundary Polygon */}
              <polygon
                points="70,70 160,35 250,70 160,92"
                fill="rgba(23, 108, 104, 0.12)"
                stroke="#176C68"
                strokeWidth="1.5"
              />
              {/* 3D Extruded Building Massing */}
              <polygon
                points="120,55 160,38 200,55 160,72"
                fill="rgba(181, 110, 72, 0.3)"
                stroke="#B56E48"
                strokeWidth="1.5"
              />
              <polygon
                points="120,55 160,72 160,25 120,12"
                fill="rgba(181, 110, 72, 0.18)"
                stroke="#B56E48"
                strokeWidth="1.2"
              />
              <polygon
                points="160,72 200,55 200,12 160,25"
                fill="rgba(181, 110, 72, 0.4)"
                stroke="#B56E48"
                strokeWidth="1.2"
              />
              {/* Roof Slabs / Floor Slices */}
              <line x1="120" y1="40" x2="160" y2="54" stroke="#B56E48" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="160" y1="54" x2="200" y2="40" stroke="#B56E48" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="120" y1="26" x2="160" y2="39" stroke="#B56E48" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="160" y1="39" x2="200" y2="26" stroke="#B56E48" strokeWidth="0.8" strokeDasharray="2 2" />
              {/* Elevation Coordinate Callout */}
              <circle cx="160" cy="12" r="3" fill="#23847D" />
              <text x="170" y="16" fill="#23847D" fontSize="9" fontFamily="monospace">
                +14.5m MSL
              </text>
              <text x="80" y="90" fill="#77867C" fontSize="8" fontFamily="monospace">
                KA-BLR-2026-P102
              </text>
            </svg>
          </div>
        </div>

        {/* 4 Compact Informational Highlights */}
        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.1)] flex items-center justify-center text-[#23847D] shrink-0 mt-0.5">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#F4F0E8]">
                3D Property Hierarchy
              </div>
              <div className="text-[11px] text-[#77867C] font-mono">
                Parcel → Building → Floor → Unit
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.1)] flex items-center justify-center text-[#B56E48] shrink-0 mt-0.5">
              <FileCheck2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#F4F0E8]">
                Evidence + Provenance
              </div>
              <div className="text-[11px] text-[#77867C] font-mono">
                Drone UAV · LiDAR · Satellite fusion
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.1)] flex items-center justify-center text-[#C47B50] shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#F4F0E8]">
                Spatial Intelligence
              </div>
              <div className="text-[11px] text-[#77867C] font-mono">
                Automated setback & height variance rules
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.1)] flex items-center justify-center text-[#176C68] shrink-0 mt-0.5">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#F4F0E8]">
                Statutory Verification
              </div>
              <div className="text-[11px] text-[#77867C] font-mono">
                Evidence-backed human review workflows
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Trust / Technology Statement */}
      <div className="relative z-10 pt-6 mt-6 border-t border-[rgba(244,240,232,0.08)] flex items-center justify-between text-[11px] font-mono text-[#77867C]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#23847D]" />
          <span>Protected by Supabase Authentication</span>
        </div>
        <span className="text-[#6F7772] text-[10px]">v2.0.0 · EPSG:32643</span>
      </div>
    </div>
  );
};
