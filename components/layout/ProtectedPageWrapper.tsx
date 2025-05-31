"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SideNavigation from "@/components/SideNavigation";

interface ProtectedPageWrapperProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "manager" | "family" | "guest";
}

export default function ProtectedPageWrapper({
  children,
  requiredRole,
}: ProtectedPageWrapperProps) {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && !hasPermission(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Side Navigation - Fixed positioning */}
      <SideNavigation user={user} />

      {/* Main Content Area - Account for sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
        {children}
      </div>
    </div>
  );
}
