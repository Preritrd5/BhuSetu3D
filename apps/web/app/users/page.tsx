"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function UsersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/users");
  }, [router]);

  return (
    <ProtectedRoute requiredRole="ADMIN" moduleName="User Management">
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-[#94A3B8]">
        Redirecting to Admin User Directory...
      </div>
    </ProtectedRoute>
  );
}
