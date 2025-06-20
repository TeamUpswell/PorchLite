// components/DatabaseDiagnostics.tsx (or wherever this file is located)
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { robustSupabaseRequest } from "@/lib/network-helper"; // ✅ Updated import
import { useAuth } from "@/components/auth";
import {
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Home,
  Building,
} from "lucide-react";

interface DatabaseDiagnosticsProps {
  showAdvanced?: boolean;
  showSeeding?: boolean;
}

interface DiagnosticResult {
  connected: boolean;
  error?: string;
  timestamp: string;
  tableTests: {
    [key: string]: {
      exists: boolean;
      count: number;
      error?: string;
      sampleData?: any[];
    };
  };
  userRelationships: {
    hasProfile: boolean;
    tenantCount: number;
    propertyCount: number;
    userTenants: any[];
    userProperties: any[];
    errors: string[];
  };
}

export default function DatabaseDiagnostics({
  showAdvanced = false,
  showSeeding = false,
}: DatabaseDiagnosticsProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [creatingTestData, setCreatingTestData] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, [user]);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const diagnosticResults: DiagnosticResult = {
        connected: true,
        timestamp: new Date().toISOString(),
        tableTests: {},
        userRelationships: {
          hasProfile: false,
          tenantCount: 0,
          propertyCount: 0,
          userTenants: [],
          userProperties: [],
          errors: [],
        },
      };

      // Test essential tables
      const tablesToTest = [
        "profiles",
        "tenants",
        "tenant_users",
        "properties",
      ];

      for (const table of tablesToTest) {
        try {
          // ✅ Using your existing robustSupabaseRequest
          const result = await robustSupabaseRequest(
            () => supabase
              .from(table)
              .select("*", { count: "exact" })
              .limit(3),
            { timeout: 10000, retries: 2 }
          );

          diagnosticResults.tableTests[table] = {
            exists: !result.error,
            count: (result as any).count || 0,
            error: result.error?.message,
            sampleData: result.data?.slice(0, 2) || [],
          };
        } catch (err: any) {
          diagnosticResults.tableTests[table] = {
            exists: false,
            count: 0,
            error: err.message,
          };
        }
      }

      // Test user-specific relationships
      if (user?.id) {
        try {
          // ✅ Check user profile with robust request
          const profileResult = await robustSupabaseRequest(
            () => supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .single(),
            { timeout: 10000, retries: 2 }
          );

          diagnosticResults.userRelationships.hasProfile =
            !profileResult.error && !!profileResult.data;
          if (profileResult.error)
            diagnosticResults.userRelationships.errors.push(
              `Profile: ${profileResult.error.message}`
            );

          // ✅ Check user's tenant associations with robust request
          const tenantUsersResult = await robustSupabaseRequest(
            () => supabase
              .from("tenant_users")
              .select("tenant_id, role, created_at")
              .eq("user_id", user.id),
            { timeout: 10000, retries: 2 }
          );

          if (tenantUsersResult.error) {
            diagnosticResults.userRelationships.errors.push(
              `Tenant Users: ${tenantUsersResult.error.message}`
            );
          } else if (tenantUsersResult.data && tenantUsersResult.data.length > 0) {
            // Get tenant details for each tenant_id
            const tenantIds = tenantUsersResult.data.map((tu: any) => tu.tenant_id);

            // ✅ Get tenant details with robust request
            const tenantsResult = await robustSupabaseRequest(
              () => supabase
                .from("tenants")
                .select("*")
                .in("id", tenantIds),
              { timeout: 10000, retries: 2 }
            );

            if (tenantsResult.error) {
              diagnosticResults.userRelationships.errors.push(
                `Tenants: ${tenantsResult.error.message}`
              );
            } else {
              diagnosticResults.userRelationships.userTenants = tenantsResult.data || [];
              diagnosticResults.userRelationships.tenantCount =
                tenantsResult.data?.length || 0;

              // Check user's properties (via tenants)
              if (tenantsResult.data && tenantsResult.data.length > 0) {
                // ✅ Get properties with robust request
                const propertiesResult = await robustSupabaseRequest(
                  () => supabase
                    .from("properties")
                    .select("*")
                    .in("tenant_id", tenantIds)
                    .eq("is_active", true),
                  { timeout: 10000, retries: 2 }
                );

                if (propertiesResult.error) {
                  diagnosticResults.userRelationships.errors.push(
                    `Properties: ${propertiesResult.error.message}`
                  );
                } else {
                  diagnosticResults.userRelationships.userProperties =
                    propertiesResult.data || [];
                  diagnosticResults.userRelationships.propertyCount =
                    propertiesResult.data?.length || 0;
                }
              }
            }
          }
        } catch (err: any) {
          diagnosticResults.userRelationships.errors.push(
            `General: ${err.message}`
          );
        }
      }

      setResults(diagnosticResults);
    } catch (err: any) {
      setResults({
        connected: false,
        error: err.message,
        timestamp: new Date().toISOString(),
        tableTests: {},
        userRelationships: {
          hasProfile: false,
          tenantCount: 0,
          propertyCount: 0,
          userTenants: [],
          userProperties: [],
          errors: [err.message],
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTestData = async () => {
    if (!user?.id) {
      alert("You must be logged in to create test data");
      return;
    }

    setCreatingTestData(true);
    try {
      console.log("Creating test data for user:", user.id);

      // Create profile if missing
      if (!results?.userRelationships.hasProfile) {
        console.log("Creating profile...");
        // ✅ Use robust request for profile creation
        const profileResult = await robustSupabaseRequest(
          () => supabase.from("profiles").upsert([
            {
              id: user.id,
              email: user.email,
              full_name: user.email?.split("@")[0] || "Test User",
              created_at: new Date().toISOString(),
            },
          ]),
          { timeout: 15000, retries: 3 }
        );

        if (profileResult.error) {
          console.error("Profile creation error:", profileResult.error);
          throw new Error(`Profile creation failed: ${profileResult.error.message}`);
        }
        console.log("✅ Profile created");
      }

      // Create tenant if missing
      if (results?.userRelationships.tenantCount === 0) {
        console.log("Creating tenant...");
        // ✅ Use robust request for tenant creation
        const tenantResult = await robustSupabaseRequest(
          () => supabase
            .from("tenants")
            .insert([
              {
                name: `${user.email?.split("@")[0] || "User"}'s Organization`,
                created_at: new Date().toISOString(),
              },
            ])
            .select()
            .single(),
          { timeout: 15000, retries: 3 }
        );

        if (tenantResult.error) {
          console.error("Tenant creation error:", tenantResult.error);
          throw new Error(`Tenant creation failed: ${tenantResult.error.message}`);
        }
        console.log("✅ Tenant created:", tenantResult.data);

        // Associate user with tenant
        console.log("Creating tenant user association...");
        // ✅ Use robust request for tenant user association
        const tenantUserResult = await robustSupabaseRequest(
          () => supabase
            .from("tenant_users")
            .insert([
              {
                tenant_id: tenantResult.data.id,
                user_id: user.id,
                role: "admin",
                created_at: new Date().toISOString(),
              },
            ]),
          { timeout: 15000, retries: 3 }
        );

        if (tenantUserResult.error) {
          console.error("Tenant user creation error:", tenantUserResult.error);
          throw new Error(
            `Tenant user creation failed: ${tenantUserResult.error.message}`
          );
        }
        console.log("✅ Tenant user association created");

        // Create a property for this tenant
        console.log("Creating property...");
        // ✅ Use robust request for property creation
        const propertyResult = await robustSupabaseRequest(
          () => supabase
            .from("properties")
            .insert([
              {
                name: "My First Property",
                address: "123 Main Street",
                tenant_id: tenantResult.data.id,
                created_by: user.id,
                is_active: true,
                created_at: new Date().toISOString(),
              },
            ]),
          { timeout: 15000, retries: 3 }
        );

        if (propertyResult.error) {
          console.error("Property creation error:", propertyResult.error);
          throw new Error(`Property creation failed: ${propertyResult.error.message}`);
        }
        console.log("✅ Property created");
      }

      alert(
        "Test data created successfully! Your organization and property are now set up."
      );
      await runDiagnostics(); // Refresh results
    } catch (error: any) {
      console.error("Error creating test data:", error);
      alert(`Error creating test data: ${error.message}`);
    } finally {
      setCreatingTestData(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Database Diagnostics
        </h3>
        <div className="space-x-2">
          <button
            onClick={runDiagnostics}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "Refresh"}
          </button>
          {showSeeding && user && (
            <button
              onClick={createTestData}
              disabled={creatingTestData}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {creatingTestData ? "Creating..." : "Create Test Data"}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          <span>Testing database connection and relationships...</span>
        </div>
      ) : results ? (
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center">
            {results.connected ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span
              className={results.connected ? "text-green-700" : "text-red-700"}
            >
              {results.connected ? "Database Connected" : "Connection Failed"}
            </span>
          </div>

          {/* Table Tests */}
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(results.tableTests).map(([table, test]) => (
              <div key={table} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{table}</h4>
                  {test.exists ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {test.exists
                    ? `${test.count} records`
                    : "Table not accessible"}
                </div>
                {test.error && (
                  <div className="text-xs text-red-600 mt-1">{test.error}</div>
                )}
              </div>
            ))}
          </div>

          {/* User Relationships */}
          {user && (
            <div className="border rounded p-4 bg-blue-50">
              <h4 className="font-medium mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Your Data Status
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center">
                  {results.userRelationships.hasProfile ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span>
                    Profile:{" "}
                    {results.userRelationships.hasProfile ? "Found" : "Missing"}
                  </span>
                </div>

                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  <span>
                    Organizations: {results.userRelationships.tenantCount}
                  </span>
                </div>

                <div className="flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  <span>
                    Properties: {results.userRelationships.propertyCount}
                  </span>
                </div>
              </div>

              {results.userRelationships.errors.length > 0 && (
                <div className="mt-3 p-2 bg-red-100 rounded">
                  <div className="text-sm text-red-700">
                    <strong>Issues found:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {results.userRelationships.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {results.userRelationships.tenantCount === 0 && showSeeding && (
                <div className="mt-3 p-2 bg-yellow-100 rounded">
                  <div className="text-sm text-yellow-700">
                    <strong>Setup Required:</strong> You don't have any
                    organizations set up. Click "Create Test Data" to create
                    your first organization and property.
                  </div>
                </div>
              )}

              {/* Show current tenant/property info if available */}
              {results.userRelationships.userTenants.length > 0 && (
                <div className="mt-3 p-2 bg-green-100 rounded">
                  <div className="text-sm text-green-700">
                    <strong>Organizations:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {results.userRelationships.userTenants.map(
                        (tenant, i) => (
                          <li key={i}>{tenant.name}</li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {results.error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-700 text-sm">{results.error}</p>
            </div>
          )}

          {showAdvanced && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
              <h5 className="font-medium mb-2">Raw Results:</h5>
              <pre className="text-xs overflow-auto max-h-64">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}