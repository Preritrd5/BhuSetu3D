"use client";

import React from "react";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="space-y-1.5 mb-6">
      <h2 className="text-2xl lg:text-[26px] font-bold tracking-tight text-[#F4F0E8] font-sans">
        {title}
      </h2>
      <p className="text-xs lg:text-[13px] text-[#77867C] font-sans leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
};
