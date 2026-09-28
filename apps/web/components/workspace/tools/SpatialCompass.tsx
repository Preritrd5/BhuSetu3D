"use client";

import React from "react";
import { Compass, Navigation } from "lucide-react";

interface SpatialCompassProps {
  heading: number; // In degrees (0 = North, 90 = East, 180 = South, 270 = West)
  onResetNorth: () => void;
  className?: string;
}

export const SpatialCompass: React.FC<SpatialCompassProps> = ({
  heading,
  onResetNorth,
  className = "",
}) => {
  return (
    <div className={`select-none pointer-events-auto ${className}`}>
      <button
        onClick={onResetNorth}
        className="group relative flex items-center justify-center w-9 h-9 rounded-full bg-slate-950/85 backdrop-blur-[40px] saturate-[200%] border border-slate-700/80 shadow-[0_4px_16px_rgba(15,23,42,0.2)] hover:border-brand-primary/60 transition-all hover:scale-105 active:scale-95"
        title="Orient camera to True North (Click to reset)"
        aria-label="Orient to North"
      >
        {/* Dynamic Rotating Needle */}
        <div
          className="transition-transform duration-100 ease-out flex items-center justify-center"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          <div className="relative w-5 h-5 flex flex-col items-center justify-center">
            {/* Red North pointer */}
            <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[9px] border-b-rose-500 mb-[1px]" />
            {/* White South pointer */}
            <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[9px] border-t-slate-300" />
          </div>
        </div>

        <span className="absolute -top-1 font-mono text-[8px] font-bold text-rose-500 select-none">
          N
        </span>
      </button>
    </div>
  );
};
