"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import {
  Settings,
  Database,
  Shield,
  Server,
  AlertCircle,
  User,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";

export default function AdminDiagnosticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, any>>({});
  const [systemInfo, setSystemInfo] = useState<Record<string, any>>({});
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          router.push("/auth");
          return;
        }

        setUserData(user);
        setIsAuthorized(true); // For development, assume authorized

        // Get environment info
        setSystemInfo({
          nodeEnv: process.env.NODE_ENV || "unknown",
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "not set",
          hasAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          buildTime: new Date().toISOString(),
        });

        // Initial connection test
        testConnections();
      } catch (err: any) {
        console.error("Auth check failed:", err);
        setError(err.message || "Authentication check failed");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  async function testConnections() {
    setIsTestingConnection(true);
    const testResults: Record<string, any> = {};

    try {
      // Test auth connection
      const startAuthTime = performance.now();
      const { data: authData, error: authError } = await supabase.auth.getSession();
      const authTime = performance.now() - startAuthTime;

      testResults.auth = {
        status: authError ? "error" : "success",
        latency: `${authTime.toFixed(1)}ms`,
        error: authError?.message,
        timestamp: new Date().toISOString(),
      };

      // Test database connection
      const startDbTime = performance.now();
      try {
        // Simple query to test database access
        const { data: dbData, error: dbError } = await supabase
          .from("profiles")
          .select("count")
          .limit(1);

        const dbTime = performance.now() - startDbTime;

        testResults.database = {
          status: dbError ? "error" : "success",
          latency: `${dbTime.toFixed(1)}ms`,
          error: dbError?.message,
          timestamp: new Date().toISOString(),
        };
      } catch (dbErr: any) {
        testResults.database = {
          status: "error",
          latency: "n/a",
          error: dbErr.message || "Database connection failed",
          timestamp: new Date().toISOString(),
        };
      }

      // Test tenant API connection
      const startTenantTime = performance.now();
      try {
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("count")
          .limit(1);

        const tenantTime = performance.now() - startTenantTime;

        testResults.tenants = {
          status: tenantError ? "error" : "success",
          latency: `${tenantTime.toFixed(1)}ms`,
          error: tenantError?.message,
          corsIssue: tenantError?.message?.includes("CORS"),
          timestamp: new Date().toISOString(),
        };
      } catch (tenantErr: any) {
        testResults.tenants = {
          status: "error",
          latency: "n/a",
          error: tenantErr.message || "Tenant API connection failed",
          corsIssue: tenantErr.message?.includes("CORS"),
          timestamp: new Date().toISOString(),
        };
      }

      // Test properties API connection
      const startPropsTime = performance.now();
      try {
        const { data: propsData, error: propsError } = await supabase
          .from("properties")
          .select("count")
          .limit(1);

        const propsTime = performance.now() - startPropsTime;

        testResults.properties = {
          status: propsError ? "error" : "success",
          latency: `${propsTime.toFixed(1)}ms`,
          error: propsError?.message,
          corsIssue: propsError?.message?.includes("CORS"),
          timestamp: new Date().toISOString(),
        };
      } catch (propsErr: any) {
        testResults.properties = {
          status: "error",
          latency: "n/a",
          error: propsErr.message || "Properties API connection failed",
          corsIssue: propsErr.message?.includes("CORS"),
          timestamp: new Date().toISOString(),
        };
      }

      setConnectionStatus(testResults);
    } catch (err: any) {
      console.error("Connection tests failed:", err);
    } finally {
      setIsTestingConnection(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <Header title="Admin Diagnostics" />
        <PageContainer>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="Admin Diagnostics" />
      <PageContainer>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                System Diagnostics
              </h1>
              <p className="text-gray-600">
                Connection troubleshooting and system status
              </p>
            </div>
          </div>

          {error && (
            <StandardCard className="border-red-200 bg-red-50">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <h3 className="font-medium text-red-800">Error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </StandardCard>
          )}

          {/* User Authentication Info */}
          <StandardCard>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  Authentication Status
                </h2>
                <div className="space-y-2">
                  {userData ? (
                    <>
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="font-medium text-gray-600">Email:</span>
                        <span className="ml-2">{userData?.email}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Shield className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="font-medium text-gray-600">User ID:</span>
                        <span className="ml-2 text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {userData?.id}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                      <span className="text-amber-600">Not authenticated</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </StandardCard>

          {/* Connection Test Card */}
          <StandardCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                API Connection Tests
              </h2>
              <button
                onClick={testConnections}
                disabled={isTestingConnection}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition ease-in-out duration-150"
              >
                {isTestingConnection ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Test Connections
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              {Object.keys(connectionStatus).length === 0 ? (
                <div className="text-sm text-gray-500 italic">
                  Click "Test Connections" to run diagnostics
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Auth Connection */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {connectionStatus.auth?.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-3" />
                      )}
                      <div>
                        <div className="font-medium">Authentication API</div>
                        <div className="text-xs text-gray-500">
                          {connectionStatus.auth?.latency} response time
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      {connectionStatus.auth?.status === "success" ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Connected
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Database Connection */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {connectionStatus.database?.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-3" />
                      )}
                      <div>
                        <div className="font-medium">Database Connection</div>
                        <div className="text-xs text-gray-500">
                          {connectionStatus.database?.latency} response time
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      {connectionStatus.database?.status === "success" ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Connected
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tenants API */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {connectionStatus.tenants?.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-3" />
                      )}
                      <div>
                        <div className="font-medium">Tenants API</div>
                        {connectionStatus.tenants?.corsIssue && (
                          <div className="text-xs text-red-600 font-medium">
                            CORS Issue Detected
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {connectionStatus.tenants?.latency} response time
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      {connectionStatus.tenants?.status === "success" ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Connected
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Properties API */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {connectionStatus.properties?.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-3" />
                      )}
                      <div>
                        <div className="font-medium">Properties API</div>
                        {connectionStatus.properties?.corsIssue && (
                          <div className="text-xs text-red-600 font-medium">
                            CORS Issue Detected
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {connectionStatus.properties?.latency} response time
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      {connectionStatus.properties?.status === "success" ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Connected
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CORS Troubleshooting */}
            {Object.values(connectionStatus).some(
              (status: any) => status?.corsIssue
            ) && (
              <div className="mt-4 p-4 border border-amber-200 bg-amber-50 rounded-lg">
                <h3 className="font-medium text-amber-800 mb-2">
                  CORS Issues Detected
                </h3>
                <p className="text-sm text-amber-700 mb-3">
                  Your local environment is experiencing CORS issues with Supabase.
                  To fix this:
                </p>
                <ol className="text-sm text-amber-700 space-y-2 list-decimal list-inside">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to Project Settings → API → CORS</li>
                  <li>
                    Add{" "}
                    <code className="px-1 py-0.5 bg-amber-100 rounded">
                      http://localhost:3000
                    </code>{" "}
                    to the allowed origins
                  </li>
                  <li>Save changes and restart your local development server</li>
                </ol>
              </div>
            )}
          </StandardCard>

          {/* Environment Info */}
          <StandardCard>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Environment Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Node Environment:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {systemInfo.nodeEnv}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Supabase URL Configured:</span>
                <span
                  className={`px-2 py-1 ${
                    systemInfo.supabaseUrl !== "not set"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  } rounded-full text-xs`}
                >
                  {systemInfo.supabaseUrl !== "not set" ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Anon Key Configured:</span>
                <span
                  className={`px-2 py-1 ${
                    systemInfo.hasAnon ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  } rounded-full text-xs`}
                >
                  {systemInfo.hasAnon ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Server Time:</span>
                <span className="text-gray-600">
                  {new Date().toLocaleString()}
                </span>
              </div>
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
