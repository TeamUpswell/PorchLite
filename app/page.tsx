"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect authenticated users to their default page
        router.push("/dashboard");
      } else {
        // Redirect unauthenticated users to login (fix: remove /auth/)
        router.push("/login"); // Changed from "/auth/login" to "/login"
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">STIA Fresh</h1>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
