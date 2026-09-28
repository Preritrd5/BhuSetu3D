"use client";

import React from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProductStoryProgression } from "@/components/landing/ProductStoryProgression";
import { ProductPillarsSection } from "@/components/landing/ProductPillarsSection";
import { PropertyHierarchySection } from "@/components/landing/PropertyHierarchySection";
import { EvidenceTrustSection } from "@/components/landing/EvidenceTrustSection";
import { IntelligenceSection } from "@/components/landing/IntelligenceSection";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { ProductPreviewSection } from "@/components/landing/ProductPreviewSection";
// import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-[#0F1210] text-[#F4F0E8] flex flex-col selection:bg-[#B56E48]/30 selection:text-[#F4F0E8]">
      {/* Standalone Landing Page Header Navigation */}
      <LandingNavbar />

      {/* Main Product Presentation Narrative */}
      <main className="flex-1 flex flex-col">
        {/* 1. Hero Section: Headline, Value Proposition, Action CTAs, Isometric 3D Visual */}
        <HeroSection />

        {/* 2. Product Story Progression: 7-step lifecycle from raw data to human review */}
        <ProductStoryProgression />

        {/* 3. Product Pillars: MODEL, UNDERSTAND, INVESTIGATE, VERIFY */}
        <ProductPillarsSection />

        {/* 4. 5-Tier Property Hierarchy: Interactive 3D cadastre depth explorer */}
        <PropertyHierarchySection />

        {/* 5. Evidence & Trust: Multi-sensor fusion, Confidence != Verification */}
        <EvidenceTrustSection />

        {/* 6. AI Spatial Intelligence: Grounded PostGIS Q&A, Non-judicial governance */}
        <IntelligenceSection />

        {/* 7. Operational Workflow: Ingest to Statutory Human Review */}
        <WorkflowSection />

        {/* 8. Live Workspace Preview: Authentic visual walkthrough of 3D digital twin */}
        <ProductPreviewSection />

        {/* 9. Final Call to Action: Enter BhuSetu 3D */}
        {/* <CTASection /> */}
      </main>

      {/* Product Footer with direct navigational routes and geodetic colophon */}
      <Footer />
    </div>
  );
}
