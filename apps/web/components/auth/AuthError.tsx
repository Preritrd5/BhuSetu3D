"use client";

import React from "react";
import { AlertCircle, X } from "lucide-react";

interface AuthErrorProps {
  message: string | null;
  onDismiss?: () => void;
}

export const AuthError: React.FC<AuthErrorProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="p-3 rounded-[8px] bg-red-950/40 border border-red-500/30 text-red-200 flex items-start justify-between gap-2.5 my-4 animate-in fade-in duration-200"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <span className="text-xs font-sans font-medium leading-relaxed text-red-200">
          {message}
        </span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="text-red-400 hover:text-red-200 focus:outline-none cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
