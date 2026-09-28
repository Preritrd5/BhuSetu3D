"use client";

import React from "react";

interface AuthDividerProps {
  label: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({ label }) => {
  return (
    <div className="relative my-6 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[rgba(244,240,232,0.08)]" />
      </div>
      <div className="relative px-3 bg-[#141816] text-[10px] font-mono uppercase tracking-widest text-[#77867C]">
        {label}
      </div>
    </div>
  );
};
