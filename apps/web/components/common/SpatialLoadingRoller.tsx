"use client";

import React from "react";
import Image from "next/image";
import { Compass, Globe2 } from "lucide-react";

interface SpatialLoadingRollerProps {
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  subtitle?: string;
  showCoordinates?: boolean;
  className?: string;
}

export const SpatialLoadingRoller: React.FC<SpatialLoadingRollerProps> = ({
  fullScreen = false,
  size = fullScreen ? "lg" : "md",
  label = "Authenticating Session",
  subtitle = "Validating BhuSetu 3D credentials & spatial index...",
  showCoordinates = fullScreen,
  className = "",
}) => {
  // Dimensions based on size
  const outerSize = size === "lg" ? "w-20 h-20" : size === "md" ? "w-14 h-14" : "w-10 h-10";
  const midSize = size === "lg" ? "w-14 h-14" : size === "md" ? "w-10 h-10" : "w-7 h-7";
  const innerSize = size === "lg" ? "w-8 h-8" : size === "md" ? "w-6 h-6" : "w-4 h-4";
  const iconSize = size === "lg" ? "w-4 h-4" : size === "md" ? "w-3 h-3" : "w-2.5 h-2.5";

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* Central Multi-Tier Architectural Spatial Roller */}
      <div className={`relative ${outerSize} flex items-center justify-center mb-5`}>
        {/* Soft Radial Ambient Aura */}
        <div className="absolute inset-0 bg-[#B56E48]/15 rounded-full blur-xl animate-pulse pointer-events-none" />
        <div className="absolute inset-0 bg-[#176C68]/15 rounded-full blur-lg pointer-events-none" />

        {/* Ring 1 (Outer Gyroscope Track — Copper Arc) */}
        <div className="absolute inset-0 rounded-full border border-[rgba(244,240,232,0.08)] pointer-events-none" />
        <div
          className={`absolute inset-0 rounded-full border-2 border-transparent border-t-[#B56E48] border-r-[#C47B50] animate-spin`}
          style={{ animationDuration: "2.4s", animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
        />

        {/* Ring 2 (Middle Caliper Track — Deep Jade Arc, Reverse Rotation) */}
        <div className={`absolute ${midSize} rounded-full border border-[rgba(244,240,232,0.06)] pointer-events-none`} />
        <div
          className={`absolute ${midSize} rounded-full border-2 border-transparent border-b-[#23847D] border-l-[#176C68] animate-spin`}
          style={{ animationDuration: "1.6s", animationDirection: "reverse", animationTimingFunction: "ease-in-out" }}
        />

        {/* Cardinal Coordinate Ticks on Middle Ring (Lg / Md only) */}
        {size !== "sm" && (
          <div className={`absolute ${midSize} pointer-events-none`}>
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-[#B56E48]/60 rounded-full" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-[#23847D]/60 rounded-full" />
            <span className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-0.5 bg-[#77867C]/60 rounded-full" />
            <span className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-0.5 bg-[#77867C]/60 rounded-full" />
          </div>
        )}

        {/* Core Spatial Anchor Hub */}
        <div className={`relative ${innerSize} rounded-full overflow-hidden bg-[#141816] border border-[rgba(244,240,232,0.15)] flex items-center justify-center shadow-[0_0_15px_rgba(181,110,72,0.3)] z-10`}>
          <Image
            src="/brand/bhusetu-logo.webp"
            alt="BhuSetu 3D"
            width={32}
            height={32}
            className="w-full h-full object-contain rounded-full"
          />
        </div>
      </div>

      {/* Status Pill Badge */}
      {label && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A201D] border border-[rgba(244,240,232,0.1)] shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#23847D] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#23847D]" />
          </span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#F4F0E8] font-bold">
            {label}
          </span>
        </div>
      )}

      {/* Informative Subtitle */}
      {subtitle && (
        <p className="text-xs font-mono text-[#77867C] tracking-wide mt-2.5 max-w-sm leading-relaxed">
          {subtitle}
        </p>
      )}

      {/* Geodetic Telemetry Coordinates Footnote (Full Screen or Lg) */}
      {showCoordinates && (
        <div className="mt-6 pt-5 border-t border-[rgba(244,240,232,0.06)] flex items-center justify-center gap-2 text-[10px] font-mono text-[#6F7772]">
          <Globe2 className="w-3.5 h-3.5 text-[#23847D]" />
          <span>EPSG:32643 UTM 43N · BENGALURU URBAN CADASTRE</span>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0F1210] flex flex-col items-center justify-center p-6 select-none overflow-hidden font-sans">
        {/* Ambient Dark Geodetic Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(244,240,232,0.05)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-50" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#B56E48]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#176C68]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[220px] flex-1 flex flex-col items-center justify-center p-6 select-none font-sans">
      {content}
    </div>
  );
};
