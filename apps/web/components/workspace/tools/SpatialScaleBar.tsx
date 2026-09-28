"use client";

import React, { useMemo } from "react";

interface SpatialScaleBarProps {
  altitude: number; // Camera altitude in meters
  pitch?: number; // Camera pitch angle
  className?: string;
}

export const SpatialScaleBar: React.FC<SpatialScaleBarProps> = ({
  altitude,
  pitch = -45,
  className = "",
}) => {
  // Approximate scale bar calculation:
  // In a perspective camera with ~60 deg FOV, visible ground span at nadir is roughly ~ altitude * tan(FOV/2) * 2.
  // We compute a round reference distance for a 64px bar.
  const { scaleText, barWidthPx } = useMemo(() => {
    const rawGroundDistance = (altitude || 400) * 0.25;

    // Pick round metric numbers: 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000
    const candidateScales = [
      5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000,
    ];

    let chosenScale = candidateScales[0];
    for (const scale of candidateScales) {
      if (rawGroundDistance >= scale * 0.6) {
        chosenScale = scale;
      } else {
        break;
      }
    }

    const scaleText =
      chosenScale >= 1000
        ? `${(chosenScale / 1000).toFixed(0)} km`
        : `${chosenScale} m`;

    return { scaleText, barWidthPx: 64 };
  }, [altitude]);

  return (
    <div
      className={`select-none pointer-events-none flex flex-col items-center font-mono text-[9px] text-slate-400 bg-slate-950/70 backdrop-blur-md px-2 py-1 rounded-[8px] border border-slate-800/80 shadow-sm ${className}`}
    >
      <span className="leading-none mb-0.5">{scaleText}</span>
      <div
        className="h-1 border-b-2 border-l-2 border-r-2 border-slate-300"
        style={{ width: `${barWidthPx}px` }}
      />
    </div>
  );
};
