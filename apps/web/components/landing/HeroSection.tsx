"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";
import { Hero3DPropertyVisual } from "./Hero3DPropertyVisual";
import { BlackHoleHeroSection } from "./BlackHoleHeroSection";

export function HeroSection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* ============================================================ */}
      {/* 1. HERO SECTION (Full-Viewport Left Editorial + Right WebGL) */}
      {/* ============================================================ */}
      <section className="relative w-full h-[calc(100vh-4.875rem)] min-h-[660px] max-h-[1100px] flex items-center bg-[#0F1210] overflow-hidden">
        {/* Subtle Geodetic Coordinate Grid Background */}
        <div className="absolute inset-0 bg-geodetic-grid opacity-30 pointer-events-none" />

        {/* Ambient environmental radial illumination */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(23,108,104,0.06)_0%,transparent_70%)] pointer-events-none" />

        {/* ============================================================ */}
        {/* RIGHT SIDE: BLACK HOLE IMMERSIVE VISUAL FIELD                */}
        {/* ============================================================ */}
        <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[56%] xl:w-[54%] z-10 overflow-hidden pointer-events-none select-none">
          <div className="relative w-full h-full">
            <BlackHoleHeroSection
              distance={23}
              elevation={-5.5}
              azimuth={0}
              orbitSpeed={0}
              roll={-20}
              fov={40}
              brightness={1.05}
              glow={1.1}
              spinSpeed={0.05}
              steps={isMobile ? 180 : 280}
              resolution={isMobile ? 0.55 : 0.72}
              maxDpr={isMobile ? 1.25 : 1.5}
              focus={[0.54, 0.48]}
              scrim="left"
              scrimStrength={0.85}
              className="w-full h-full pointer-events-auto"
            />

            {/* Seamless Edge Blending Overlays */}
            <div className="absolute inset-y-0 left-0 w-32 sm:w-56 bg-gradient-to-r from-[#0F1210] via-[#0F1210]/80 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0F1210] via-[#0F1210]/60 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0F1210] via-[#0F1210]/60 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0F1210] via-[#0F1210]/50 to-transparent pointer-events-none z-10" />
          </div>
        </div>

        {/* ============================================================ */}
        {/* LEFT SIDE: PRODUCT CONTENT — DIRECT LEFT ALIGNMENT           */}
        {/* ============================================================ */}
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 relative z-20 py-8 lg:py-12">
          <div className="w-full max-w-[580px] lg:max-w-[620px] xl:max-w-[680px] flex flex-col justify-center text-left">
            {/* 1. EYEBROW / Geodetic Datum & Station Line */}
            <div className="inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-mono tracking-wider text-[#77867C] border-l-2 border-[#B56E48] pl-3 py-1 mb-5 sm:mb-6">
              <span className="text-[#D9D2C5] font-semibold">BENGALURU URBAN CADASTRE</span>
              <span className="text-[#6F7772]">·</span>
              <span>EPSG:32643 UTM 43N</span>
              <span className="hidden sm:inline text-[#6F7772]">·</span>
              <span className="hidden sm:inline">12°59&apos;56.8&quot;N 77°34&apos;19.9&quot;E</span>
            </div>

            {/* 2. HEADLINE / Monumental Editorial Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[48px] xl:text-[56px] font-sans font-bold tracking-tight text-[#F4F0E8] leading-[1.08] mb-5 sm:mb-6">
              Evidence-Backed 3D Cadastral Intelligence for the Built Environment.
            </h1>

            {/* 3. DESCRIPTION / Value Proposition */}
            <p className="text-sm sm:text-base lg:text-[17px] text-[#D9D2C5] font-sans leading-relaxed mb-7 sm:mb-8 max-w-xl">
              Unifying physical parcels, volumetric building massing, stratified floor slabs, and
              registered 3D ULPIN units with verifiable multi-sensor sensor proof.
            </p>

            {/* 4. CTA GROUP / Architectural Action CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 mb-8">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-[6px] bg-[#B56E48] hover:bg-[#A35E39] text-[#F4F0E8] text-xs font-semibold tracking-wide shadow-[0_2px_12px_rgba(181,110,72,0.25)] hover:shadow-[0_4px_20px_rgba(181,110,72,0.4)] transition-all duration-200 flex items-center gap-2 group"
              >
                <span>Explore 3D Cadastre</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>

            </div>

            {/* 5. SUBTLE SUPPORTING CONTEXT */}
            <div className="pt-6 border-t border-[rgba(244,240,232,0.08)] flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] font-mono text-[#77867C]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
                <span className="text-[#D9D2C5] font-medium">8-Tier Continuum</span>
                <span className="text-[#6F7772]">·</span>
                <span>Parcel → Floor → 3D Unit</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B56E48]" />
                <span className="text-[#D9D2C5] font-medium">Multi-Sensor Audit</span>
                <span className="text-[#6F7772]">·</span>
                <span>LiDAR + Drone Photogrammetry</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. LOWER CADASTRAL VISUALIZATION SECTION (Below the Fold)    */}
      {/* ============================================================ */}
      <section className="relative border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210] px-6 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 overflow-hidden">
        {/* Subtle Geodetic Coordinate Grid Background */}
        <div className="absolute inset-0 bg-geodetic-grid opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-[500px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(181,110,72,0.04)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col gap-12 lg:gap-14">
          {/* Integrated 3D Property Cutaway (Unboxed Spatial Model) */}
          <div className="w-full">
            <Hero3DPropertyVisual />
          </div>

          {/* Architectural Baseline Telemetry Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-[rgba(244,240,232,0.08)]">
            <div className="border-l border-[rgba(244,240,232,0.12)] pl-4">
              <div className="text-xl font-bold font-mono text-[#176C68]">8-Tier Continuity</div>
              <div className="text-xs text-[#77867C] font-mono mt-0.5">
                Region → Parcel → Building → Floor → 3D ULPIN Unit
              </div>
            </div>

            <div className="border-l border-[rgba(244,240,232,0.12)] pl-4">
              <div className="text-xl font-bold font-mono text-[#B56E48]">Multi-Sensor Audit</div>
              <div className="text-xs text-[#77867C] font-mono mt-0.5">
                Airborne LiDAR Altimetry + High-Res Drone Photogrammetry
              </div>
            </div>

            <div className="border-l border-[rgba(244,240,232,0.12)] pl-4">
              <div className="text-xl font-bold font-mono text-[#D9D2C5]">PostGIS Conformal</div>
              <div className="text-xs text-[#77867C] font-mono mt-0.5">
                Mathematical Coordinate Consistency in UTM Zone 43N
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
