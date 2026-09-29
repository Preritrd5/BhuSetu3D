"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function SettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/settings");
  }, [router]);

  return (
    <ProtectedRoute requiredRole="ADMIN" moduleName="Platform Settings">
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-[#94A3B8]">
        Redirecting to Admin GIS Engine Settings...
      </div>
    </ProtectedRoute>
  );
}
