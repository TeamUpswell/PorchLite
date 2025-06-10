"use client";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DatabaseDiagnostic from "@/components/DatabaseDiagnostic"; // ✅ Updated import
import { useAuth } from "@/components/auth";
import Link from "next/link";

import PermissionGate from "@/components/PermissionGate";
import { Shield, AlertTriangle } from "lucide-react";

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
  const { user } = useAuth();
  const [config, setConfig] = useState({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set",
    keyIsMasked: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? true : false,
  });

  // 🔒 Early return if not development team
  if (!user) {
    return (
      <ProtectedPageWrapper>
        <div className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto text-red-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-800">Please log in to continue.</p>
        </div>
      </ProtectedPageWrapper>
    );
  }

  if (!isDevelopmentTeam(user)) {
    return (
      <ProtectedPageWrapper>
        <div className="p-8 text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            🚫 Access Denied
          </h3>
          <p className="text-gray-800 mb-4">
            System diagnostics are restricted to development team members only.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-left border">
            <p className="text-sm text-gray-800 mb-2">
              <strong className="text-gray-900">Current User:</strong>{" "}
              {user.email}
            </p>
            <p className="text-sm text-gray-800">
              <strong className="text-gray-900">Access Level:</strong> Regular
              User
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
      </ProtectedPageWrapper>
    );
  }

  const linkExists = (path: string) => {
    return true;
  };

  return (
    <ProtectedPageWrapper>
      <div className="p-6 max-w-6xl mx-auto">
        {/* 🔒 DEVELOPMENT TEAM HEADER */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h4 className="font-semibold text-red-800">
                Development Team Access
              </h4>
              <p className="text-sm text-red-700">
                Logged in as:{" "}
                <code className="bg-red-100 px-1 rounded text-red-800 font-medium">
                  {user.email}
                </code>
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            System Diagnostics
          </h1>
          <Link
            href="/admin/system-dashboard"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Full System Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Database Health - ✅ Updated component usage */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Quick Database Check
            </h2>
            <DatabaseDiagnostic
              mode="advanced"
              showAdvanced={true}
              showSeeding={true}
            />
          </div>

          {/* Environment Configuration */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Environment Configuration
            </h2>
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-gray-900">
                  Supabase URL:{" "}
                </span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-800 font-medium">
                  {config.supabaseUrl}
                </code>
              </div>
              <div>
                <span className="font-semibold text-gray-900">
                  Supabase Key:{" "}
                </span>
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
                <span className="font-semibold text-gray-900">
                  Environment:{" "}
                </span>
                <span className="px-2 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-800">
                  {process.env.NODE_ENV || "unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Development Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {linkExists("/dev") && (
              <Link
                href="/dev"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-center transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Dev Tools</h3>
                <p className="text-sm text-gray-800 mt-1">
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
                <p className="text-sm text-gray-800 mt-1">
                  User & auth debugging
                </p>
              </Link>
            )}
            <Link
              href="/admin/system-dashboard"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-center transition-colors"
            >
              <h3 className="font-semibold text-gray-900">
                Full System Health
              </h3>
              <p className="text-sm text-gray-800 mt-1">
                Complete diagnostic dashboard
              </p>
            </Link>
          </div>
        </div>

        {/* Current User Debug Info */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Current User Debug Info
          </h3>
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
        </div>
      </div>
    </ProtectedPageWrapper>
  );
}
