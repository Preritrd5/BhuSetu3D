"use client";

/**
 * BhuSetu 3D Layer Control
 */
import React from "react";
import { Layers, Building, MapPin, Route, Eye, EyeOff } from "lucide-react";

export interface ActiveLayersState {
  parcels: boolean;
  buildings: boolean;
  regions: boolean;
  infrastructure: boolean;
}

interface LayerControlProps {
  layers: ActiveLayersState;
  onToggleLayer: (layerKey: keyof ActiveLayersState) => void;
  parcelCount: number;
}

export const LayerControl: React.FC<LayerControlProps> = ({
  layers,
  onToggleLayer,
  parcelCount,
}) => {
  return (
    <div className="bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.08)] rounded-[10px] p-3 shadow-2xl space-y-2 text-xs font-mono text-[#F4F0E8]">
      <div className="flex items-center gap-2 pb-2 border-b border-[rgba(244,240,232,0.06)] text-[11px] uppercase tracking-wider text-[#77867C] font-semibold">
        <Layers className="w-3.5 h-3.5 text-[#23847D]" />
        <span>Spatial Layers</span>
      </div>

      <div className="space-y-1.5 pt-0.5">
        {/* Parcels Layer */}
        <button
          onClick={() => onToggleLayer("parcels")}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
            layers.parcels
              ? "bg-[#23847D]/20 text-[#23847D] border border-[#23847D]/40"
              : "text-[#77867C] hover:bg-[#1A201D] hover:text-[#D9D2C5]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#23847D] border border-[#23847D]/50" />
            <span>Cadastral Parcels</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#77867C]">({parcelCount})</span>
            {layers.parcels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-[#77867C]" />}
          </div>
        </button>

        {/* Buildings Layer */}
        <button
          onClick={() => onToggleLayer("buildings")}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
            layers.buildings
              ? "bg-[#B56E48]/20 text-[#C47B50] border border-[#B56E48]/40"
              : "text-[#77867C] hover:bg-[#1A201D] hover:text-[#D9D2C5]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#B56E48] border border-[#C47B50]" />
            <span>Building Footprints</span>
          </div>
          {layers.buildings ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-[#77867C]" />}
        </button>

        {/* Regions Layer */}
        <button
          onClick={() => onToggleLayer("regions")}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
            layers.regions
              ? "bg-[#176C68]/20 text-[#2EB8B0] border border-[#176C68]/40"
              : "text-[#77867C] hover:bg-[#1A201D] hover:text-[#D9D2C5]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#176C68] border border-[#2EB8B0]" />
            <span>Wards / Regions</span>
          </div>
          {layers.regions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-[#77867C]" />}
        </button>

        {/* Infrastructure Layer */}
        <button
          onClick={() => onToggleLayer("infrastructure")}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
            layers.infrastructure
              ? "bg-[#23847D]/20 text-[#23847D] border border-[#23847D]/40"
              : "text-[#77867C] hover:bg-[#1A201D] hover:text-[#D9D2C5]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#23847D] border border-[#23847D]/50" />
            <span>Infrastructure</span>
          </div>
          {layers.infrastructure ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-[#77867C]" />}
        </button>
      </div>
    </div>
  );
};
