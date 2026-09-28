"use client";

import React from "react";
import { Loader2, ArrowRight } from "lucide-react";

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  isLoading = false,
  children,
  variant = "primary",
  className = "",
  disabled,
  ...props
}) => {
  if (variant === "secondary") {
    return (
      <button
        disabled={disabled || isLoading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[8px] text-xs font-medium font-sans bg-[#1A201D] hover:bg-[#222A26] text-[#D9D2C5] hover:text-[#F4F0E8] border border-[rgba(244,240,232,0.12)] hover:border-[#B56E48]/50 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed select-none cursor-pointer ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </button>
    );
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[8px] text-xs font-semibold font-sans bg-[#B56E48] hover:bg-[#A35E39] active:bg-[#924E2B] text-[#F4F0E8] shadow-[0_2px_12px_rgba(181,110,72,0.25)] hover:shadow-[0_4px_20px_rgba(181,110,72,0.4)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed select-none cursor-pointer tracking-wide ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-[#F4F0E8]" />
          <span>Authenticating...</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </>
      )}
    </button>
  );
};
