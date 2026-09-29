"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function RolesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/roles");
  }, [router]);

  return (
    <ProtectedRoute requiredRole="ADMIN" moduleName="Role Management">
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-[#94A3B8]">
        Redirecting to Admin Role Capability Matrix...
      </div>
    </ProtectedRoute>
  );
}
