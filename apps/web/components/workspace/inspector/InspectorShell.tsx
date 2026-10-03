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
 * Desktop: floating right panel at top-[64px], right-4, w-[380px].
 * Mobile: bottom sheet docked at bottom-[56px] (above mobile bottom nav), with drag handle and peeking state.
 */
export const InspectorShell: React.FC<InspectorShellProps> = ({
  children,
  onClose,
  onMinimize,
  isMinimized = false,
  className = "",
}) => {
  return (
    <>
      {/* Mobile scrim when inspector is expanded */}
      {!isMinimized && (
        <div
          className="md:hidden fixed inset-0 z-25 bg-black/40"
          onClick={onMinimize || onClose}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          aria-hidden="true"
        />
      )}

      <div
        role="region"
        aria-label="Contextual Property Inspector"
        className={`z-30 select-none transition-all duration-300 ease-out
          /* Desktop & Tablet: floating right panel */
          md:absolute md:top-[64px] md:right-4 md:bottom-auto md:inset-x-auto
          md:w-[365px] lg:w-[380px] xl:w-[395px] max-w-[calc(100vw-2rem)]
          /* Mobile: bottom sheet docked directly above the 56px bottom navigation bar */
          max-md:fixed max-md:inset-x-0 max-md:bottom-[56px] max-md:top-auto max-md:w-full
          ${isMinimized ? "opacity-95 max-md:translate-y-[calc(100%-52px)]" : "opacity-100 max-md:translate-y-0"} 
          ${className}`}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="bg-[#141816]/98 backdrop-blur-md border border-[rgba(244,240,232,0.12)] md:rounded-[12px] max-md:rounded-t-[16px] max-md:border-b-0 shadow-2xl overflow-hidden flex flex-col md:max-h-[calc(100vh-7.5rem)] max-md:max-h-[65vh] font-sans text-xs">
          {/* Mobile Drag Handle Indicator */}
          <div
            className="md:hidden pt-2.5 pb-1.5 flex justify-center cursor-pointer shrink-0 hover:bg-[#1A201D] active:bg-[#1A201D] transition-colors"
            onClick={onMinimize}
          >
            <div className="w-10 h-1.5 rounded-full bg-[rgba(244,240,232,0.3)] hover:bg-[rgba(244,240,232,0.5)] transition-colors" />
          </div>
          {children}
        </div>
      </div>
    </>
  );
};
