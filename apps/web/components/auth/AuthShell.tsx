"use client";

import React from "react";

interface AuthShellProps {
  brandPanel: React.ReactNode;
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ brandPanel, children }) => {
  return (
    <div className="min-h-screen w-full bg-[#0B0E0C] text-[#F4F0E8] flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-x-hidden">
      {/* Dark Ambient Geodetic Grid Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(244,240,232,0.06)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#B56E48]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#176C68]/8 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Authentication Container */}
      <div className="w-full max-w-5xl bg-[#141816] rounded-[20px] sm:rounded-[24px] overflow-hidden border border-[rgba(244,240,232,0.08)] shadow-[0_24px_70px_rgba(0,0,0,0.8)] flex flex-col md:flex-row relative z-10 my-auto">
        {/* Left Dark Spatial Brand Panel (≈40% on Desktop) */}
        {brandPanel}

        {/* Right Authentication Form Panel (≈60% on Desktop) */}
        <div className="flex-1 w-full md:w-[58%] lg:w-[60%] bg-[#141816] p-6 sm:p-8 lg:p-12 flex flex-col justify-between">
          {children}
        </div>
      </div>
    </div>
  );
};
