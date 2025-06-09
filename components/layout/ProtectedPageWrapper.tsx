"use client";

import { useAuth } from "@/components/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { debugLog } from "@/lib/utils/debug";
import AppLayout from "./AppLayout";

interface ProtectedPageWrapperProps {
  children: React.ReactNode;
  requiredRole?: "manager" | "family" | "guest";
}

export default function ProtectedPageWrapper({
  children,
  requiredRole,
}: ProtectedPageWrapperProps) {
  const { user, isLoading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      const currentPath = window.location.pathname;
      debugLog("🔐 No user found, redirecting to auth with:", currentPath);
      router.push(`/auth?redirectedFrom=${encodeURIComponent(currentPath)}`);
    }
  }, [user, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Permission check
  if (requiredRole && !hasPermission(requiredRole)) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-red-600 text-lg mb-4">Access Denied</p>
          <p className="text-gray-600">
            You don't have permission to view this page.
          </p>
        </div>
      </AppLayout>
    );
  }

  // Authenticated and authorized
  return <AppLayout>{children}</AppLayout>;
}
