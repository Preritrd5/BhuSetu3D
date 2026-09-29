"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface InspectorSectionProps {
  title: string;
  icon?: React.ReactNode;
  badge?: string | number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const InspectorSection: React.FC<InspectorSectionProps> = ({
  title,
  icon,
  badge,
  defaultOpen = true,
  children,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border-b border-[rgba(244,240,232,0.08)] last:border-b-0 ${className}`}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#1A201D] transition-colors text-left group cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 text-[#D9D2C5] group-hover:text-[#F4F0E8]">
          {icon && <span className="text-[#6F7772] group-hover:text-[#C47B50]">{icon}</span>}
          <span className="font-bold text-xs tracking-wider uppercase text-[#D9D2C5] font-mono">
            {title}
          </span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 rounded-[4px] bg-[#1A201D] border border-[rgba(244,240,232,0.12)] text-xs font-mono font-bold text-[#A7B3AB]">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#6F7772] transition-transform duration-200 ${
            isOpen ? "transform rotate-180 text-[#C47B50]" : ""
          }`}
        />
      </button>

      {isOpen && <div className="px-4 pb-4 pt-1.5 space-y-3 animate-in fade-in duration-150">{children}</div>}
    </div>
  );
};
