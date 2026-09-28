"use client";

import React from "react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string | null;
  helperText?: string;
  icon?: React.ReactNode;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, id, error, helperText, icon, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full text-left">
        <label
          htmlFor={id}
          className="block text-[11px] font-mono font-medium uppercase tracking-wider text-[#D9D2C5]"
        >
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#77867C]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            className={`w-full text-xs font-sans text-[#F4F0E8] bg-[#0B0E0C] border rounded-[8px] py-2.5 px-3.5 transition-all outline-none placeholder:text-[#6F7772] ${
              icon ? "pl-10" : ""
            } ${
              error
                ? "border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
                : "border-[rgba(244,240,232,0.12)] hover:border-[rgba(244,240,232,0.22)] focus:border-[#B56E48] focus:ring-1 focus:ring-[#B56E48]"
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p id={`${id}-error`} className="text-[11px] text-red-400 font-sans mt-1">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${id}-helper`} className="text-[11px] text-[#77867C] font-sans mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";
