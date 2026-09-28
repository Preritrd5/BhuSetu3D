"use client";

/**
 * BhuSetu 3D Map Telemetry & Status Footer
 */
import React from "react";
import { Database, Crosshair, Layers, ZoomIn } from "lucide-react";

interface MapStatusFooterProps {
  lng: number | null;
  lat: number | null;
  zoom: number;
  featureCount: number;
  isLoading: boolean;
}

export const MapStatusFooter: React.FC<MapStatusFooterProps> = ({
  lng,
  lat,
  zoom,
  featureCount,
  isLoading,
}) => {
  return (
    <footer className="h-8 bg-[#0F1210] border-t border-[rgba(244,240,232,0.08)] px-4 flex items-center justify-between text-[11px] font-mono text-[#6F7772] select-none z-10">
      {/* Left: Spatial Coordinates & Viewport Metrics */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[#D9D2C5]">
          <Crosshair className="w-3.5 h-3.5 text-[#23847D]" />
          <span>
            {lat !== null && lng !== null
              ? `${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`
              : "Move cursor over map"}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1 border-l border-[rgba(244,240,232,0.08)] pl-4">
          <ZoomIn className="w-3.5 h-3.5 text-[#6F7772]" />
          <span>ZOOM: {zoom.toFixed(1)}</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 border-l border-[rgba(244,240,232,0.08)] pl-4">
          <Layers className="w-3.5 h-3.5 text-[#23847D]" />
          <span>PARCELS IN VIEW: <strong className="text-[#F4F0E8]">{featureCount}</strong></span>
        </div>
      </div>

      {/* Right: Live Database Source & Network Status */}
      <div className="flex items-center gap-3">
        {isLoading && (
          <div className="flex items-center gap-1.5 text-[#C47B50]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B56E48] animate-ping" />
            <span>QUERYING POSTGIS...</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[#23847D]">
          <Database className="w-3.5 h-3.5 text-[#176C68]" />
          <span className="hidden sm:inline">POSTGIS 3.4 ENGINE</span>
          <span className="text-[10px] px-1 rounded-[3px] bg-[#141816] border border-[rgba(244,240,232,0.08)] text-[#6F7772]">
            EPSG:4326
          </span>
        </div>
      </div>
    </footer>
  );
};
