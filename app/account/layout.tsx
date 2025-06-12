"use client";

import { useAuth } from "@/components/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Settings, Shield } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link 
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Account Settings</h1>
            <div className="w-24" /> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              <Link
                href="/account"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-900 bg-gray-100"
              >
                <User className="h-5 w-5 mr-3" />
                Profile
              </Link>
              <Link
                href="/account/settings"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </Link>
              <Link
                href="/account/security"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Shield className="h-5 w-5 mr-3" />
                Security
              </Link>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}