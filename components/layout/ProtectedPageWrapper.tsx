"use client";

import { useAuth } from "@/components/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import MainLayout from "./MainLayout";

interface ProtectedPageWrapperProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedPageWrapper({
  children,
  requiredRole,
}: ProtectedPageWrapperProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      const currentPath = window.location.pathname;
      router.push(`/auth?redirectedFrom=${encodeURIComponent(currentPath)}`);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <MainLayout>{children}</MainLayout>;
}
