"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // If already authenticated, navigate to spatial overview workspace
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/overview");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <AuthShell brandPanel={<AuthBrandPanel mode="SIGN_UP" />}>
      <SignUpForm />
    </AuthShell>
  );
}
