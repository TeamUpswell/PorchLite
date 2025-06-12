"use client";

import { useAuth } from "@/components/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, hasInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && hasInitialized && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, hasInitialized, router]);

  if (loading || !hasInitialized || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ✅ Simplified: Just return children with auth protection
  return <>{children}</>;
}
