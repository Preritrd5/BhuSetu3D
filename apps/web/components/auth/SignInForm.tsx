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
import { ArrowLeft, CheckCircle2, Mail, Shield, User } from "lucide-react";

interface OfficialPersona {
  role: string;
  name: string;
  department: string;
  email: string;
  initials: string;
  badgeColor: string;
}

const OFFICIAL_PERSONAS: OfficialPersona[] = [
  {
    role: "ADMIN",
    name: "Vikram Sen",
    department: "Land Revenue Directorate",
    email: "admin.official@bhusetu3d.gov.in",
    initials: "VS",
    badgeColor: "bg-[#B56E48]/15 text-[#B56E48] border-[#B56E48]/30",
  },
  {
    role: "GOVERNMENT_OFFICER",
    name: "Kavita Sharma",
    department: "Urban Town Planning",
    email: "officer.kavita@bhusetu3d.gov.in",
    initials: "KS",
    badgeColor: "bg-[#23847D]/15 text-[#23847D] border-[#23847D]/30",
  },
  {
    role: "SURVEYOR",
    name: "Sunil Rao",
    department: "Cadastral Survey Branch",
    email: "surveyor.rao@bhusetu3d.gov.in",
    initials: "SR",
    badgeColor: "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/40",
  },
  {
    role: "ANALYST",
    name: "Priya Nair",
    department: "Geospatial Intelligence",
    email: "analyst.priya@bhusetu3d.gov.in",
    initials: "PN",
    badgeColor: "bg-[#C47B50]/15 text-[#C47B50] border-[#C47B50]/30",
  },
];

const DEFAULT_DEMO_PASSWORD = "Password@123";

export const SignInForm: React.FC = () => {
  const router = useRouter();
  const { login, isLoading: authLoading, error: authError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberSession, setRememberSession] = useState(true);
  const [selectedPersonaEmail, setSelectedPersonaEmail] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  const handleSelectPersona = async (persona: OfficialPersona, autoSubmit: boolean = false) => {
    setEmail(persona.email);
    setPassword(DEFAULT_DEMO_PASSWORD);
    setSelectedPersonaEmail(persona.email);
    setLocalError(null);
    setForgotPasswordNotice(false);

    if (autoSubmit) {
      setIsSubmitting(true);
      try {
        const res = await login(persona.email, DEFAULT_DEMO_PASSWORD);
        if (res.success) {
          router.push("/overview");
        } else {
          setLocalError(res.error || "Authentication failed. Please check credentials.");
        }
      } catch (err: unknown) {
        setLocalError(err instanceof Error ? err.message : "Authentication failed.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setForgotPasswordNotice(false);

    if (!email.trim()) {
      setLocalError("Please enter your registered institutional email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError("Please enter a valid official email address format.");
      return;
    }

    if (!password) {
      setLocalError("Please enter your account password.");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters in length.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        router.push("/overview");
      } else {
        setLocalError(res.error || "Invalid email or password.");
      }
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="flex flex-col justify-between h-full">
      {/* Top Header */}
      <div>
        <AuthHeader
          title="Sign In to BhuSetu 3D"
          subtitle="Access your spatial property intelligence workspace."
        />

        {/* 1-Click Evaluator Personas (RBAC) */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="font-semibold uppercase tracking-wider text-[#77867C]">
              1-Click Evaluator Personas (RBAC)
            </span>
            <span className="text-[10px] text-[#6F7772]">
              Click to autofill & sign in
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OFFICIAL_PERSONAS.map((p) => {
              const isSelected = selectedPersonaEmail === p.email;
              return (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleSelectPersona(p, true)}
                  disabled={isSubmitting}
                  className={`p-2.5 rounded-[10px] border text-left flex items-start gap-2.5 transition-all duration-150 group cursor-pointer ${
                    isSelected
                      ? "border-[#B56E48] bg-[#1E2522] shadow-[0_0_15px_rgba(181,110,72,0.15)]"
                      : "border-[rgba(244,240,232,0.08)] bg-[#1A201D] hover:bg-[#1E2522] hover:border-[#B56E48]/40"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                      isSelected
                        ? "bg-[#B56E48] text-[#F4F0E8]"
                        : "bg-[#0F1210] text-[#D9D2C5] border border-[rgba(244,240,232,0.1)] group-hover:border-[#B56E48]/40"
                    }`}
                  >
                    {p.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#F4F0E8] font-sans truncate">
                        {p.name}
                      </span>
                      <span
                        className={`text-[8px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold ${p.badgeColor}`}
                      >
                        {p.role.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#77867C] font-sans block truncate">
                      {p.department}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <AuthDivider label="or enter work credentials" />

        {/* Error Banner */}
        <AuthError message={displayedError} onDismiss={() => setLocalError(null)} />

        {/* Forgot Password Information Note */}
        {forgotPasswordNotice && (
          <div className="p-3 rounded-[8px] bg-[#176C68]/15 border border-[#176C68]/40 text-[#D9D2C5] text-xs font-sans mb-4 flex items-start justify-between">
            <span>
              For security compliance, password resets require municipal IT administrator authorization. Please contact your organization administrator or use an evaluator persona.
            </span>
            <button
              onClick={() => setForgotPasswordNotice(false)}
              className="text-[#23847D] hover:text-[#F4F0E8] font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Sign-In Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <AuthInput
            id="work-email"
            type="email"
            label="Institutional Work Email"
            placeholder="officer@bhusetu3d.gov.in"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSelectedPersonaEmail(null);
              setLocalError(null);
            }}
            icon={<Mail className="w-3.5 h-3.5" />}
          />

          <PasswordField
            id="work-password"
            label="Password"
            placeholder="••••••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setLocalError(null);
            }}
          />

          {/* Remember session & Forgot Password */}
          <div className="flex items-center justify-between text-xs font-sans pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[#77867C] hover:text-[#D9D2C5] transition-colors">
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[rgba(244,240,232,0.2)] bg-[#0B0E0C] text-[#B56E48] focus:ring-[#B56E48]/30"
              />
              <span>Remember session</span>
            </label>

            <button
              type="button"
              onClick={() => setForgotPasswordNotice(true)}
              className="text-[#77867C] hover:text-[#B56E48] font-medium transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {/* Primary CTA */}
          <div className="pt-2">
            <AuthButton
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Sign In to Operations Console
            </AuthButton>
          </div>
        </form>
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-6 mt-6 border-t border-[rgba(244,240,232,0.08)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans text-[#77867C]">
        <div>
          <span>Need a new workspace? </span>
          <Link
            href="/signup"
            className="font-semibold text-[#B56E48] hover:text-[#A35E39] hover:underline"
          >
            Create Workspace
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
