"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string | null;
  helperText?: string;
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, id, error, helperText, className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-1.5 w-full text-left">
        <label
          htmlFor={id}
          className="block text-[11px] font-mono font-medium uppercase tracking-wider text-[#D9D2C5]"
        >
          {label}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#77867C]">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <input
            ref={ref}
            id={id}
            type={showPassword ? "text" : "password"}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            className={`w-full text-xs font-sans text-[#F4F0E8] bg-[#0B0E0C] border rounded-[8px] py-2.5 pl-10 pr-10 transition-all outline-none placeholder:text-[#6F7772] ${
              error
                ? "border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
                : "border-[rgba(244,240,232,0.12)] hover:border-[rgba(244,240,232,0.22)] focus:border-[#B56E48] focus:ring-1 focus:ring-[#B56E48]"
            } ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#77867C] hover:text-[#F4F0E8] focus:outline-none transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
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

PasswordField.displayName = "PasswordField";
