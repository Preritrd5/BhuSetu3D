"use client";

import React from "react";

interface InspectorShellProps {
  children: React.ReactNode;
  onClose: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  className?: string;
}

/**
 * InspectorShell
 * Responsive host shell for all contextual property inspectors.
 * Architectural graphite container with 10px radius and hairline borders.
 */
export const InspectorShell: React.FC<InspectorShellProps> = ({
  children,
  onClose,
  onMinimize,
  isMinimized = false,
  className = "",
}) => {
  return (
    <div
      role="region"
      aria-label="Contextual Property Inspector"
      className={`absolute sm:top-[68px] sm:right-4 z-20 sm:w-[416px] max-w-[calc(100vw-1.5rem)] select-none transition-all duration-300 ease-out 
        max-sm:fixed max-sm:inset-x-2 max-sm:top-auto max-sm:bottom-16 max-sm:w-auto max-sm:max-h-[62vh]
        ${isMinimized ? "opacity-90" : "opacity-100"} 
        ${className}`}
    >
      <div className="bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.10)] rounded-[12px] max-sm:rounded-[10px] shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-6.5rem)] max-sm:max-h-[62vh] font-sans text-xs">
        {children}
      </div>
    </div>
  );
};
