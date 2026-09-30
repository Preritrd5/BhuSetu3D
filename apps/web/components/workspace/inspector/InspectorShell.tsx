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
      className={`z-30 select-none transition-all duration-300 ease-out
        /* Desktop & Tablet: floating right panel */
        md:absolute md:top-[74px] md:right-4 md:bottom-auto md:inset-x-auto
        md:w-[365px] lg:w-[380px] xl:w-[395px] max-w-[calc(100vw-2rem)]
        /* Mobile: bottom sheet */
        max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:w-full
        ${isMinimized ? "opacity-90 max-md:translate-y-[calc(100%-72px)]" : "opacity-100"} 
        ${className}`}
    >
      <div className="bg-[#141816]/98 backdrop-blur-md border border-[rgba(244,240,232,0.12)] md:rounded-[12px] max-md:rounded-t-[16px] max-md:border-b-0 shadow-2xl overflow-hidden flex flex-col md:max-h-[calc(100vh-5.5rem)] max-md:max-h-[70vh] font-sans text-xs">
        {/* Mobile Drag Handle Indicator */}
        <div className="md:hidden pt-2 pb-1 flex justify-center cursor-pointer" onClick={onMinimize}>
          <div className="w-10 h-1.5 rounded-full bg-[rgba(244,240,232,0.25)] hover:bg-[rgba(244,240,232,0.4)] transition-colors" />
        </div>
        {children}
      </div>
    </div>
  );
};
