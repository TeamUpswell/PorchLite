"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DatabaseDiagnostic from "@/components/DatabaseDiagnostic";
import { useAuth } from "@/components/auth";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { Shield, AlertTriangle, Database, Settings, Terminal } from "lucide-react";
import Link from "next/link";

// 🔒 DEVELOPMENT TEAM EMAIL WHITELIST
const DEVELOPMENT_TEAM_EMAILS = [
  "drew@pdxbernards.com",
  "admin@pdxbernards.com",
  "dev@pdxbernards.com",
];

// 🔒 Check if user is part of development team
const isDevelopmentTeam = (user: any): boolean => {
  if (!user?.email) {
    console.log("❌ No user email found");
    return false;
  }

  const userEmail = user.email.toLowerCase();
  console.log("🔍 Checking dev team access for:", userEmail);
  console.log("🔍 Whitelist emails:", DEVELOPMENT_TEAM_EMAILS);

  // Check against whitelist
  if (DEVELOPMENT_TEAM_EMAILS.includes(userEmail)) {
    console.log("✅ Email found in whitelist");
    return true;
  }

  // Additional check: user must have system_admin role in user_metadata
  if (user.user_metadata?.system_role === "system_admin") {
    console.log("✅ Found system_admin in user_metadata");
    return true;
  }

  // Additional check: app_metadata for super admin
  if (user.app_metadata?.system_admin === true) {
    console.log("✅ Found system_admin in app_metadata");
    return true;
  }

  console.log("❌ No dev team access found");
  console.log("User metadata:", user.user_metadata);
  console.log("App metadata:", user.app_metadata);

  return false;
};

export default function DiagnosticsPage() {
  const { user, loading } = useAuth();
  const [config, setConfig] = useState({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set",
    keyIsMasked: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? true : false,
  });

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <Header title="System Diagnostics" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  // 🔒 Early return if not authenticated
  if (!user) {
    return (
      <div className="p-6">
        <Header title="System Diagnostics" />
        <PageContainer>
          <StandardCard>
            <div className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-red-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-600">Please log in to continue.</p>
              <Link
                href="/auth/login"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Login
              </Link>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  // 🔒 Access denied for non-development team
  if (!isDevelopmentTeam(user)) {
    return (
      <div className="p-6">
        <Header title="System Diagnostics" />
        <PageContainer>
          <StandardCard>
            <div className="p-8 text-center max-w-md mx-auto">
              <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                🚫 Access Denied
              </h3>
              <p className="text-gray-600 mb-4">
                System diagnostics are restricted to development team members only.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg text-left border">
                <p className="text-sm text-gray-700 mb-2">
                  <strong className="text-gray-900">Current User:</strong>{" "}
                  {user.email}
                </p>
                <p className="text-sm text-gray-700">
                  <strong className="text-gray-900">Access Level:</strong> Regular User
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/dashboard"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  const linkExists = (path: string) => {
    return true;
  };

  return (
    <div className="p-6">
      <Header title="System Diagnostics" />
      <PageContainer>
        <div className="space-y-6">
          {/* 🔒 DEVELOPMENT TEAM HEADER */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <h4 className="font-semibold text-red-800">Development Team Access</h4>
                <p className="text-sm text-red-700">
                  Logged in as:{" "}
                  <code className="bg-red-100 px-1 rounded text-red-800 font-medium">
                    {user.email}
                  </code>
                </p>
              </div>
            </div>
          </div>

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Terminal className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Diagnostics</h1>
                <p className="text-gray-600">Development team tools and system health</p>
              </div>
            </div>
            <Link
              href="/admin/system-dashboard"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              Full System Dashboard
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Database Health */}
            <StandardCard 
              title="Quick Database Check" 
              icon={<Database className="h-5 w-5 text-gray-600" />}
            >
              <DatabaseDiagnostic
                mode="advanced"
                showAdvanced={true}
                showSeeding={true}
              />
            </StandardCard>

            {/* Environment Configuration */}
            <StandardCard 
              title="Environment Configuration"
              icon={<Settings className="h-5 w-5 text-gray-600" />}
            >
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-gray-900">Supabase URL: </span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-800 font-medium">
                    {config.supabaseUrl}
                  </code>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Supabase Key: </span>
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      config.keyIsMasked
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {config.keyIsMasked ? "✓ Configured" : "✗ Missing"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Environment: </span>
                  <span className="px-2 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-800">
                    {process.env.NODE_ENV || "unknown"}
                  </span>
                </div>
              </div>
            </StandardCard>
          </div>

          {/* Development Tools */}
          <StandardCard 
            title="Development Tools"
            subtitle="Quick access to development utilities"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {linkExists("/dev") && (
                <Link
                  href="/dev"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-center transition-colors"
                >
                  <h3 className="font-semibold text-gray-900">Dev Tools</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Database testing & seeding
                  </p>
                </Link>
              )}
              {linkExists("/auth/diagnose") && (
                <Link
                  href="/auth/diagnose"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-center transition-colors"
                >
                  <h3 className="font-semibold text-gray-900">Auth Diagnosis</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    User & auth debugging
                  </p>
                </Link>
              )}
              <Link
                href="/admin/system-dashboard"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-center transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Full System Health</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Complete diagnostic dashboard
                </p>
              </Link>
            </div>
          </StandardCard>

          {/* Current User Debug Info */}
          <StandardCard 
            title="Current User Debug Info"
            subtitle="Development debugging information"
          >
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto font-mono whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    id: user.id,
                    email: user.email,
                    user_metadata: user.user_metadata,
                    app_metadata: user.app_metadata,
                    isDevelopmentTeam: isDevelopmentTeam(user),
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
