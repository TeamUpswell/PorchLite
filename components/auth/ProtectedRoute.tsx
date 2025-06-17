"use client";

import { useAuth } from "@/components/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm">Checking authentication...</p>
      </div>
    </div>
  );
}

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth(); // ✅ Fix: Use 'loading' instead of 'isLoading'
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      console.log('🔒 No authenticated user, redirecting to auth...');
      router.push("/auth");
    }
  }, [user, loading, router]); // ✅ Fix: Use 'loading' instead of 'isLoading'

  // Show loading spinner while checking auth
  if (loading) {
    return <LoadingSpinner />;
  }

  // Return null while redirecting (prevents flash)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
