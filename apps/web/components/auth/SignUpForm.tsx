"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AuthHeader } from "./AuthHeader";
import { AuthInput } from "./AuthInput";
import { PasswordField } from "./PasswordField";
import { AuthButton } from "./AuthButton";
import { AuthError } from "./AuthError";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
} from "lucide-react";

export const SignUpForm: React.FC = () => {
  const router = useRouter();

  const {
    signUp,
    isLoading: authLoading,
    error: authError,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToPolicy, setAgreedToPolicy] = useState(true);

  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successVerificationRequired, setSuccessVerificationRequired] =
    useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError("Please enter your institutional work email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setLocalError("Please enter a valid official email address format.");
      return;
    }

    if (!password) {
      setLocalError("Please enter a secure password.");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters in length.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match. Please re-enter your password.");
      return;
    }

    if (!agreedToPolicy) {
      setLocalError(
        "Please confirm your acceptance of the Spatial Data Governance policy."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await signUp(
        email.trim(),
        password
      );

      if (res.success) {
        if (res.requireVerification) {
          setSuccessVerificationRequired(true);
        } else {
          router.push("/overview");
        }
      } else {
        setLocalError(res.error || "Registration failed.");
      }
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error ? err.message : "Registration failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successVerificationRequired) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden text-center">
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#176C68]/20 border border-[#23847D]/40 text-[#23847D] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-[#F4F0E8] font-sans">
              Workspace Account Created
            </h2>

            <p className="text-xs text-[#77867C] font-sans leading-relaxed">
              A confirmation link has been sent to{" "}
              <span className="font-semibold text-[#F4F0E8]">
                {email}
              </span>
              . Please verify your official email address to complete spatial
              workspace setup.
            </p>

            <div className="pt-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-[8px] bg-[#B56E48] text-[#F4F0E8] text-xs font-semibold hover:bg-[#A35E39] shadow-sm transition-all"
              >
                <span>Return to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[rgba(244,240,232,0.08)] shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#77867C] hover:text-[#F4F0E8] transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home Page</span>
          </Link>
        </div>
      </div>
    );
  }

  const displayedError = localError || authError;

  return (
    <div className="flex flex-col justify-between h-full min-h-0 overflow-hidden">
      {/* Main Content */}
      <div className="shrink-0">
        {/* Header */}
        <AuthHeader
          title="Activate Your Account"
          subtitle="Your account has been provisioned by your administrator. Set your password to complete activation."
        />

        {/* Error */}
        <AuthError
          message={displayedError}
          onDismiss={() => setLocalError(null)}
        />

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-3"
          noValidate
        >
          {/* Info note: admin-provisioned details */}
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-[6px] bg-[#176C68]/10 border border-[#23847D]/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2EB8B0] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#77867C] font-sans leading-relaxed">
              Your name, department, and role have been pre-configured by your administrator. Enter your institutional email and set your own password to activate your account.
            </p>
          </div>

          {/* Email */}
          <AuthInput
            id="signup-email"
            type="email"
            label="Institutional Work Email"
            placeholder="officer@planning.gov.in"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setLocalError(null);
            }}
            icon={<Mail className="w-3.5 h-3.5" />}
          />

          {/* Password + Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PasswordField
              id="signup-password"
              label="Password"
              placeholder="••••••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError(null);
              }}
            />

            <PasswordField
              id="signup-confirm-password"
              label="Confirm Password"
              placeholder="••••••••••••"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setLocalError(null);
              }}
            />
          </div>

          {/* Policy */}
          <div className="pt-0.5">
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs font-sans text-[#77867C] hover:text-[#D9D2C5] transition-colors">
              <input
                type="checkbox"
                checked={agreedToPolicy}
                onChange={(e) => setAgreedToPolicy(e.target.checked)}
                className="w-4 h-4 rounded border-[rgba(244,240,232,0.2)] bg-[#0B0E0C] text-[#B56E48] focus:ring-[#B56E48]/30 mt-0.5 shrink-0"
              />

              <span className="leading-snug">
                I agree to the Spatial Data Governance and Evidence-Backed
                Verification terms.
              </span>
            </label>
          </div>

          {/* CTA */}
          <div className="pt-0.5">
            <AuthButton
              type="submit"
              isLoading={isSubmitting || authLoading}
              disabled={isSubmitting || authLoading}
            >
              Activate Account & Enter Platform
            </AuthButton>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-[rgba(244,240,232,0.08)] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-sans text-[#77867C] shrink-0">
        <div>
          <span>Already have a workspace? </span>

          <Link
            href="/login"
            className="font-semibold text-[#B56E48] hover:text-[#A35E39] hover:underline"
          >
            Sign In
          </Link>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[#77867C] hover:text-[#F4F0E8] transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home Page</span>
        </Link>
      </div>
    </div>
  );
};