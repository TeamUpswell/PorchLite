"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useTenant } from "@/lib/hooks/useTenant";
import { useProperty } from "@/lib/hooks/useProperty";
import { toast } from "react-hot-toast";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  Settings,
  Plus,
  RefreshCw,
  Play,
  Users,
  Home,
} from "lucide-react";

interface DiagnosticResult {
  connection: boolean;
  connectionError?: string;
  tables: Record<string, { exists: boolean; count?: number; error?: string }>;
}

interface DatabaseDiagnosticProps {
  showAdvanced?: boolean;
  showSeeding?: boolean;
  className?: string;
  mode?: "simple" | "advanced" | "full";
}

export default function DatabaseDiagnostic({
  showAdvanced = true,
  showSeeding = false,
  className = "",
  mode = "full",
}: DatabaseDiagnosticProps) {
  const { user, loading: authLoading } = useAuth();
  const { tenants, currentTenant, loading: tenantLoading } = useTenant();
  const {
    properties,
    currentProperty,
    loading: propertyLoading,
  } = useProperty();

  // State for diagnostics
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">(
    "checking"
  );
  const [dbDetails, setDbDetails] = useState<string>("");

  const TABLES_TO_CHECK = [
    "profiles",
    "tenants",
    "tenant_users",
    "properties",
    "reservations",
    "cleaning_tasks",
    "inventory",
    "contacts",
    "manual_sections",
    "manual_items",
    "user_roles",
    "notes",
  ];

  // Check database status on mount
  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      if (error) {
        setDbStatus("error");
        setDbDetails(error.message);
      } else {
        setDbStatus("connected");
        setDbDetails("Database connection OK");
      }
    } catch (err: any) {
      setDbStatus("error");
      setDbDetails(err.message);
    }
  };

  // Run comprehensive diagnostics
  const runDiagnostics = async () => {
    setIsLoading(true);
    const diagnostic: DiagnosticResult = {
      connection: false,
      tables: {},
    };

    try {
      // Test basic connection
      const { error: connectionError } = await supabase
        .from("profiles")
        .select("count")
        .limit(1);

      diagnostic.connection = !connectionError;
      if (connectionError) {
        diagnostic.connectionError = connectionError.message;
      }

      // Check each table
      for (const table of TABLES_TO_CHECK) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select("*", { count: "exact", head: true });

          diagnostic.tables[table] = {
            exists: !error,
            count: count || 0,
            error: error?.message,
          };
        } catch (err: any) {
          diagnostic.tables[table] = {
            exists: false,
            error: err.message,
          };
        }
      }

      setResults(diagnostic);
      toast.success(
        `Diagnostics completed! Found ${
          Object.values(diagnostic.tables).filter((t) => t.exists).length
        }/${TABLES_TO_CHECK.length} tables`
      );
    } catch (error: any) {
      console.error("Diagnostic failed:", error);
      diagnostic.connectionError = error.message;
      setResults(diagnostic);
      toast.error(`Diagnostics failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test database access (detailed)
  const testDatabaseAccess = async () => {
    console.log("🔴 DATABASE TEST STARTED");
    toast("Starting database tests...", { icon: "🔍" });

    try {
      console.log("🔍 Environment check:");
      console.log("- SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log(
        "- SUPABASE_KEY exists:",
        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Test 1: Profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .limit(5);
      console.log("🔍 Profiles result:", {
        data: profileData,
        error: profileError,
      });

      // Test 2: Tenants
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id, name")
        .limit(5);
      console.log("🔍 Tenants result:", {
        data: tenantData,
        error: tenantError,
      });

      // Test 3: User-tenant relationships
      const { data: userTenantData, error: userTenantError } = await supabase
        .from("tenant_users")
        .select("user_id, tenant_id, role")
        .eq("user_id", user?.id || "")
        .limit(5);
      console.log("🔍 User-tenant result:", {
        data: userTenantData,
        error: userTenantError,
      });

      // Test 4: Properties
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("id, name, tenant_id")
        .limit(5);
      console.log("🔍 Properties result:", {
        data: propertyData,
        error: propertyError,
      });

      const summary = `Found: ${profileData?.length || 0} profiles, ${
        tenantData?.length || 0
      } tenants, ${propertyData?.length || 0} properties`;
      toast.success(summary);

      if (tenantData?.length === 0 || propertyData?.length === 0) {
        toast("💡 Tip: Click 'Seed Test Data' to create sample data", {
          duration: 6000,
          icon: "💡",
        });
      }
    } catch (error: any) {
      console.error("🔴 Error:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Test hook queries
  const testHookQueries = async () => {
    if (!user?.id) {
      toast.error("No user ID available");
      return;
    }

    console.log("🔍 Testing hook queries for user:", user.id);
    toast("Testing hook queries...", { icon: "🔗" });

    try {
      // Test tenant query
      const { data: tenantQuery, error: tenantError } = await supabase
        .from("tenant_users")
        .select(
          `
          id, user_id, tenant_id, role, status,
          tenants (id, name, description)
        `
        )
        .eq("user_id", user.id)
        .eq("status", "active");

      console.log("🔍 Direct tenant query result:", {
        data: tenantQuery,
        error: tenantError,
      });

      // Test property query
      if (tenantQuery && tenantQuery.length > 0) {
        const firstTenantId = tenantQuery[0].tenant_id;
        const { data: propertyQuery, error: propertyError } = await supabase
          .from("properties")
          .select("*")
          .eq("tenant_id", firstTenantId);

        console.log("🔍 Direct property query result:", {
          data: propertyQuery,
          error: propertyError,
        });
        toast.success(
          `Hook queries completed! Found ${tenantQuery.length} tenant links, ${
            propertyQuery?.length || 0
          } properties`
        );
      } else {
        toast.warning("No tenant relationships found for user");
      }
    } catch (error: any) {
      console.error("Hook query error:", error);
      toast.error(`Hook test failed: ${error.message}`);
    }
  };

  // Seed database (if enabled)
  const seedDatabaseWithTestData = async () => {
    if (!user?.id) {
      toast.error("No user found for seeding");
      return;
    }

    console.log("🌱 STARTING DATABASE SEEDING...");
    toast("Starting database seeding...", { icon: "🌱" });

    try {
      // Create profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email || "test@example.com",
          full_name: "Test User",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) throw profileError;
      toast.success("Profile created/updated");

      // Create tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .upsert({
          id: "00000000-0000-0000-0000-000000000001",
          name: "Default Property Management",
          description: "Default tenant for property management",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (tenantError) throw tenantError;
      toast.success("Tenant created");

      // Link user to tenant
      const { error: userTenantError } = await supabase
        .from("tenant_users")
        .upsert({
          user_id: user.id,
          tenant_id: tenantData.id,
          role: "owner",
          status: "active",
          created_at: new Date().toISOString(),
        });

      if (userTenantError) throw userTenantError;
      toast.success("User linked to tenant");

      // Create sample properties
      const sampleProperties = [
        {
          id: "f361a716-2f7f-4443-8df3-800e2f01be38",
          name: "Bend House",
          description: "Beautiful vacation rental in Bend, Oregon",
          address: "123 Pine Street",
          city: "Bend",
          state: "Oregon",
          zip: "97701",
          tenant_id: tenantData.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      for (const property of sampleProperties) {
        const { data: propData, error: propError } = await supabase
          .from("properties")
          .upsert(property)
          .select()
          .single();

        if (propError) {
          console.warn(`Property error: ${propError.message}`);
        } else {
          toast.success(`Property created: ${propData.name}`);
        }
      }

      toast.success("Database seeding completed! Refreshing...");
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      console.error("🔴 SEEDING ERROR:", error);
      toast.error(`Seeding error: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "fail":
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (dbStatus) {
      case "connected":
        return "green";
      case "error":
        return "red";
      default:
        return "gray";
    }
  };

  // Render based on mode
  if (mode === "simple") {
    return (
      <div className="space-y-4">
        {/* Simple connection status */}
        <div className="flex items-center space-x-2">
          {getStatusIcon(dbStatus)}
          <span className={`font-semibold text-${getStatusColor()}-800`}>
            Database: {dbStatus === "connected" ? "Connected" : "Error"}
          </span>
        </div>
        {dbStatus === "error" && (
          <p className="text-sm text-red-600">{dbDetails}</p>
        )}
        <button
          onClick={runDiagnostics}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Running..." : "Run Diagnostics"}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
        <Database className="h-5 w-5 mr-2" />
        Database Diagnostics
      </h3>

      {/* Status Indicator */}
      <div
        className={`p-3 rounded-lg border mb-4 bg-${getStatusColor()}-50 border-${getStatusColor()}-200`}
      >
        <div className="flex items-center">
          <span className="mr-2">
            {dbStatus === "connected"
              ? "✅"
              : dbStatus === "error"
              ? "❌"
              : "🔄"}
          </span>
          <span className={`text-${getStatusColor()}-800 font-medium`}>
            Database Status: {dbStatus}
          </span>
        </div>
        <p className={`text-sm text-${getStatusColor()}-600 mt-1`}>
          {dbDetails}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={runDiagnostics}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
        >
          <Play className="h-4 w-4 mr-2" />
          {isLoading ? "Running..." : "Quick Diagnostics"}
        </button>

        <button
          onClick={testDatabaseAccess}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-center"
        >
          <Settings className="h-4 w-4 mr-2" />
          Detailed Test
        </button>

        {showAdvanced && (
          <button
            onClick={testHookQueries}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center justify-center"
          >
            <Database className="h-4 w-4 mr-2" />
            Test Hooks
          </button>
        )}

        {showSeeding && (
          <button
            onClick={seedDatabaseWithTestData}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Seed Data
          </button>
        )}
      </div>

      {/* Diagnostic Results */}
      {results && (
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {getStatusIcon(results.connection ? "connected" : "error")}
            <span
              className={`font-semibold ${
                results.connection ? "text-green-800" : "text-red-800"
              }`}
            >
              Database Connection: {results.connection ? "Connected" : "Failed"}
            </span>
          </div>

          {results.connectionError && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {results.connectionError}
              </p>
            </div>
          )}

          {/* Tables Status */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Tables Status
            </h4>
            <div className="space-y-2">
              {Object.entries(results.tables).map(
                ([tableName, tableResult]) => (
                  <div
                    key={tableName}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(
                        tableResult.exists ? "connected" : "error"
                      )}
                      <span className="font-medium text-gray-900">
                        {tableName}:
                      </span>
                      <span
                        className={`text-sm ${
                          tableResult.exists ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {tableResult.exists ? "Exists" : "Missing"}
                      </span>
                    </div>

                    {tableResult.exists && tableResult.count !== undefined && (
                      <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {tableResult.count} records
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-700">Tables Found: </span>
                <span className="font-semibold text-gray-900">
                  {Object.values(results.tables).filter((t) => t.exists).length}
                </span>
              </div>
              <div>
                <span className="text-gray-700">Total Tables: </span>
                <span className="font-semibold text-gray-900">
                  {Object.keys(results.tables).length}
                </span>
              </div>
              <div>
                <span className="text-gray-700">Missing: </span>
                <span className="font-semibold text-red-800">
                  {
                    Object.values(results.tables).filter((t) => !t.exists)
                      .length
                  }
                </span>
              </div>
              <div>
                <span className="text-gray-700">Total Records: </span>
                <span className="font-semibold text-gray-900">
                  {Object.values(results.tables)
                    .filter((t) => t.exists)
                    .reduce((sum, t) => sum + (t.count || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Status */}
      {mode === "full" && (
        <div className="mt-6 text-sm text-gray-700 space-y-1 bg-gray-50 p-4 rounded">
          <p>
            <strong>Current Status:</strong>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <p>• User: {user?.email || "None"}</p>
            <p>• Properties: {properties?.length || 0}</p>
            <p>• Current Property: {currentProperty?.name || "None"}</p>
            <p>• Tenants: {tenants?.length || 0}</p>
            <p>• Auth Loading: {authLoading ? "Yes" : "No"}</p>
            <p>• Tenant Loading: {tenantLoading ? "Yes" : "No"}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Quick Start:</strong> 1) Quick Diagnostics → 2) If issues
          found, Detailed Test → 3) Use Seed Data if needed
        </p>
      </div>
    </div>
  );
}
