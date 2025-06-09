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
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      const currentPath = window.location.pathname;
      router.push(`/auth?redirectedFrom=${encodeURIComponent(currentPath)}`);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <MainLayout>{children}</MainLayout>;
}
