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
    <div className={`border-b border-[rgba(244,240,232,0.06)] last:border-b-0 ${className}`}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-[#1A201D] transition-colors text-left group cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 text-[#D9D2C5] group-hover:text-[#F4F0E8]">
          {icon && <span className="text-[#6F7772] group-hover:text-[#C47B50]">{icon}</span>}
          <span className="font-semibold text-[11px] tracking-widest uppercase text-[#D9D2C5]">
            {title}
          </span>
          {badge !== undefined && (
            <span className="px-1.5 py-0.5 rounded-[4px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] text-[10px] font-mono text-[#6F7772]">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#6F7772] transition-transform duration-200 ${
            isOpen ? "transform rotate-180 text-[#C47B50]" : ""
          }`}
        />
      </button>

      {isOpen && <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 animate-in fade-in duration-150">{children}</div>}
    </div>
  );
};
