"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  User,
  Shield,
} from "lucide-react";
import { useAuth } from "@/components/auth";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";

export default function AuthDiagnosePage() {
  const { user, loading: authLoading } = useAuth();
  const [dbInfo, setDbInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkDatabase() {
      try {
        const adminSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        );

        // Check for duplicate email constraint issues
        const { data: profileData, error: profileError } = await adminSupabase
          .from("profiles")
          .select("id, email")
          .eq("email", "drew@pdxbernards.com");

        // Check user_roles table
        const { data: roleData, error: roleError } = await adminSupabase
          .from("user_roles")
          .select("user_id, role");

        // Get schema info
        const { data: schemaData, error: schemaError } =
          await adminSupabase.rpc("get_schema_info");

        setDbInfo({
          profileCheck: { data: profileData, error: profileError },
          roleCheck: { data: roleData, error: roleError },
          schemaInfo: { data: schemaData, error: schemaError },
        });
      } catch (err) {
        setDbInfo({ error: err });
      } finally {
        setLoading(false);
      }
    }

    checkDatabase();
  }, []);

  const DiagnosticSection = ({
    title,
    icon,
    data,
    error,
  }: {
    title: string;
    icon: React.ReactNode;
    data: any;
    error: any;
  }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center mb-4">
        <div
          className={`p-2 rounded-lg mr-3 ${
            error ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
          }`}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center mt-1">
            {error ? (
              <>
                <XCircle className="h-4 w-4 text-red-600 mr-1" />
                <span className="text-sm text-red-700 font-medium">
                  Error Detected
                </span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-700 font-medium">OK</span>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-red-800 mb-2">Error Details:</h4>
          <p className="text-red-700 text-sm">
            {error.message || JSON.stringify(error)}
          </p>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Raw Data:</h4>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto max-h-60 font-mono whitespace-pre-wrap">
          {JSON.stringify({ data, error }, null, 2)}
        </pre>
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  return (
    <div className="p-6">
      <Header title="Auth Diagnostics" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Authentication Diagnostics"
            subtitle="Debug authentication and session information"
          >
            <div className="space-y-6">
              {/* Diagnostic Sections */}
              <DiagnosticSection
                title="Profile Check"
                icon={<User className="h-5 w-5" />}
                data={dbInfo.profileCheck?.data}
                error={dbInfo.profileCheck?.error}
              />

              <DiagnosticSection
                title="User Roles Check"
                icon={<Shield className="h-5 w-5" />}
                data={dbInfo.roleCheck?.data}
                error={dbInfo.roleCheck?.error}
              />

              <DiagnosticSection
                title="Database Schema Info"
                icon={<Database className="h-5 w-5" />}
                data={dbInfo.schemaInfo?.data}
                error={dbInfo.schemaInfo?.error}
              />

              {/* Summary Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Diagnostic Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded border">
                    <h4 className="font-semibold text-gray-900">
                      Profile Status
                    </h4>
                    <p
                      className={`text-sm ${
                        dbInfo.profileCheck?.error
                          ? "text-red-700"
                          : "text-green-700"
                      } font-medium`}
                    >
                      {dbInfo.profileCheck?.error
                        ? "Issues Found"
                        : "Working Correctly"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded border">
                    <h4 className="font-semibold text-gray-900">Role System</h4>
                    <p
                      className={`text-sm ${
                        dbInfo.roleCheck?.error
                          ? "text-red-700"
                          : "text-green-700"
                      } font-medium`}
                    >
                      {dbInfo.roleCheck?.error
                        ? "Issues Found"
                        : "Working Correctly"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded border">
                    <h4 className="font-semibold text-gray-900">
                      Database Schema
                    </h4>
                    <p
                      className={`text-sm ${
                        dbInfo.schemaInfo?.error
                          ? "text-red-700"
                          : "text-green-700"
                      } font-medium`}
                    >
                      {dbInfo.schemaInfo?.error
                        ? "Issues Found"
                        : "Working Correctly"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Global Error */}
              {dbInfo.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                    <XCircle className="h-5 w-5 mr-2" />
                    Critical Error
                  </h3>
                  <div className="bg-gray-900 text-red-400 p-4 rounded-lg text-sm overflow-auto font-mono">
                    {JSON.stringify(dbInfo.error, null, 2)}
                  </div>
                </div>
              )}
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
