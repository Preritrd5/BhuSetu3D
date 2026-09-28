"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AuthHeader } from "./AuthHeader";
import { AuthInput } from "./AuthInput";
import { PasswordField } from "./PasswordField";
import { AuthButton } from "./AuthButton";
import { AuthDivider } from "./AuthDivider";
import { AuthError } from "./AuthError";
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  Mail,
  Shield,
  Sparkles,
  User,
  ArrowRight,
} from "lucide-react";

export const SignUpForm: React.FC = () => {
  const router = useRouter();
  const { signUp, login, isLoading: authLoading, error: authError } = useAuth();

  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToPolicy, setAgreedToPolicy] = useState(true);

  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFastTracking, setIsFastTracking] = useState(false);
  const [successVerificationRequired, setSuccessVerificationRequired] = useState(false);

  const handleFastTrackSandbox = async () => {
    setLocalError(null);
    setIsFastTracking(true);
    try {
      // Instant sign-in to the authorized government officer persona
      const res = await login("officer.kavita@bhusetu3d.gov.in", "Password@123");
      if (res.success) {
        router.push("/overview");
      } else {
        setLocalError(res.error || "Sandbox fast-track authentication failed.");
      }
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Fast-track failed.");
    } finally {
      setIsFastTracking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!fullName.trim()) {
      setLocalError("Please enter your full name.");
      return;
    }

    if (!organization.trim()) {
      setLocalError("Please specify your organization or municipal department.");
      return;
    }

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
      setLocalError("Please confirm your acceptance of the Spatial Data Governance policy.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signUp(email.trim(), password, fullName.trim(), organization.trim());
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
      setLocalError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successVerificationRequired) {
    return (
      <div className="flex flex-col justify-between h-full py-8 text-center">
        <div className="space-y-4 my-auto max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-[#176C68]/20 border border-[#23847D]/40 text-[#23847D] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#F4F0E8] font-sans">
            Workspace Account Created
          </h2>
          <p className="text-xs text-[#77867C] font-sans leading-relaxed">
            A confirmation link has been sent to{" "}
            <span className="font-semibold text-[#F4F0E8]">{email}</span>. Please verify your official email address to complete spatial workspace setup.
          </p>
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-[8px] bg-[#B56E48] text-[#F4F0E8] text-xs font-semibold hover:bg-[#A35E39] shadow-sm transition-all"
            >
              <span>Return to Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="pt-6 border-t border-[rgba(244,240,232,0.08)]">
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
    <div className="flex flex-col justify-between h-full">
      {/* Top Header */}
      <div>
        <AuthHeader
          title="Create Workspace Account"
          subtitle="Set up your organization environment for 3D digital-twin property intelligence."
        />

        {/* 1-Click Fast-Track Sandbox Banner */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleFastTrackSandbox}
            disabled={isFastTracking}
            className="w-full p-3 rounded-[12px] bg-[#1A201D] hover:bg-[#1E2522] border border-[rgba(244,240,232,0.08)] hover:border-[#B56E48]/40 text-left flex items-center justify-between gap-3 transition-all duration-200 group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-[#B56E48]/15 border border-[#B56E48]/30 flex items-center justify-center text-[#B56E48] shrink-0 group-hover:bg-[#B56E48] group-hover:text-[#F4F0E8] transition-all">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#F4F0E8] font-sans">
                    1-Click Fast-Track Official Sandbox
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#0F1210] border border-[rgba(244,240,232,0.1)] text-[#77867C] font-semibold">
                    seed=BLR
                  </span>
                </div>
                <span className="text-[11px] text-[#77867C] font-sans block">
                  Instant access to Bengaluru Urban twin with 24 parcels & 3D models
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#77867C] group-hover:text-[#B56E48] group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </div>

        {/* Divider */}
        <AuthDivider label="or register custom workspace" />

        {/* Error Banner */}
        <AuthError message={displayedError} onDismiss={() => setLocalError(null)} />

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          {/* Row 1: Full Name & Organization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AuthInput
              id="signup-name"
              label="Full Name"
              placeholder="Kavita Sharma"
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setLocalError(null);
              }}
              icon={<User className="w-3.5 h-3.5" />}
            />

            <AuthInput
              id="signup-org"
              label="Organization / Department"
              placeholder="Town Planning Directorate"
              value={organization}
              onChange={(e) => {
                setOrganization(e.target.value);
                setLocalError(null);
              }}
              icon={<Building className="w-3.5 h-3.5" />}
            />
          </div>

          {/* Row 2: Institutional Work Email */}
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

          {/* Row 3: Password & Confirm Password */}
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

          {/* Policy Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs font-sans text-[#77867C] hover:text-[#D9D2C5] transition-colors">
              <input
                type="checkbox"
                checked={agreedToPolicy}
                onChange={(e) => setAgreedToPolicy(e.target.checked)}
                className="w-4 h-4 rounded border-[rgba(244,240,232,0.2)] bg-[#0B0E0C] text-[#B56E48] focus:ring-[#B56E48]/30 mt-0.5 shrink-0"
              />
              <span className="leading-snug">
                I agree to the Spatial Data Governance and Evidence-Backed Verification terms.
              </span>
            </label>
          </div>

          {/* Primary CTA */}
          <div className="pt-2">
            <AuthButton
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Workspace & Enter Platform
            </AuthButton>
          </div>
        </form>
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-6 mt-6 border-t border-[rgba(244,240,232,0.08)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans text-[#77867C]">
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
