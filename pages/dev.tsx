// pages/dev.tsx - Fixed version with proper syntax
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast"; // Add this import

export default function DeveloperPage() {
  const [message, setMessage] = useState("Dev page loaded successfully!");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>({});

  // Get current user on load
  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Auth error:", error);
        setUser(null);
      } else {
        setUser(user);
        console.log("Current user:", user);
      }
    } catch (err) {
      console.error("Error getting user:", err);
      setUser(null);
    }
  };

  const testDatabaseTables = async () => {
    setIsLoading(true);
    setMessage("Running comprehensive database tests...");
    const results: any = {};

    try {
      console.log("🔴 COMPREHENSIVE DATABASE TEST STARTED");

      // Test 1: Profiles table
      console.log("🔍 Testing profiles table...");
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, address, phone_number, created_at")
        .limit(10);

      results.profiles = {
        success: !profileError,
        count: profileData?.length || 0,
        error: profileError?.message,
        data: profileData,
      };
      console.log("Profiles result:", results.profiles);

      // Test 2: Tenants table
      console.log("🔍 Testing tenants table...");
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id, name, slug, description, owner_user_id, created_at") // Add owner_user_id
        .limit(10);

      results.tenants = {
        success: !tenantError,
        count: tenantData?.length || 0,
        error: tenantError?.message,
        data: tenantData,
      };
      console.log("Tenants result:", results.tenants);

      // Test 3: Tenant Users table (the problematic one)
      console.log("🔍 Testing tenant_users table (simple query)...");
      const { data: tenantUserData, error: tenantUserError } = await supabase
        .from("tenant_users")
        .select("id, user_id, tenant_id, role, status, created_at")
        .limit(10);

      results.tenant_users = {
        success: !tenantUserError,
        count: tenantUserData?.length || 0,
        error: tenantUserError?.message,
        data: tenantUserData,
      };
      console.log("Tenant users result:", results.tenant_users);

      // Test 4: Properties table
      console.log("🔍 Testing properties table...");
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select(
          "id, name, description, address, city, state, zip, tenant_id, created_at"
        )
        .limit(10);

      results.properties = {
        success: !propertyError,
        count: propertyData?.length || 0,
        error: propertyError?.message,
        data: propertyData,
      };
      console.log("Properties result:", results.properties);

      // Test 5: User-specific data (if logged in)
      if (user?.id) {
        console.log("🔍 Testing user-specific data...");

        // User's profile
        const { data: userProfile, error: userProfileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        results.user_profile = {
          success: !userProfileError,
          error: userProfileError?.message,
          data: userProfile,
        };

        // User's tenant relationships
        const { data: userTenants, error: userTenantsError } = await supabase
          .from("tenant_users")
          .select("*")
          .eq("user_id", user.id);

        results.user_tenants = {
          success: !userTenantsError,
          count: userTenants?.length || 0,
          error: userTenantsError?.message,
          data: userTenants,
        };
      }

      // Test 6: Test the fixed separate queries approach
      console.log("🔍 Testing the fixed separate queries approach...");
      try {
        // First get tenant_users
        const { data: tenantUsersData, error: tenantUsersError } = await supabase
          .from("tenant_users")
          .select("tenant_id, user_id, role, status")
          .limit(5);

        if (tenantUsersError) {
          results.separate_queries = {
            success: false,
            error: tenantUsersError.message,
            data: null,
          };
        } else if (!tenantUsersData || tenantUsersData.length === 0) {
          results.separate_queries = {
            success: true,
            count: 0,
            error: "No tenant_users found",
            data: [],
          };
        } else {
          // Get corresponding tenants
          const tenantIds = tenantUsersData.map((tu) => tu.tenant_id);
          const { data: tenantsData, error: tenantsError } = await supabase
            .from("tenants")
            .select("id, name, slug, description, owner_user_id, created_at")
            .in("id", tenantIds);

          if (tenantsError) {
            results.separate_queries = {
              success: false,
              error: tenantsError.message,
              data: null,
            };
          } else {
            // Combine the data like the useTenant hook does
            const combinedData = tenantUsersData.map((tu) => ({
              ...tu,
              tenant: tenantsData?.find((t) => t.id === tu.tenant_id),
            }));

            results.separate_queries = {
              success: true,
              count: combinedData.length,
              error: null,
              data: combinedData,
            };
          }
        }
      } catch (separateErr: any) {
        results.separate_queries = {
          success: false,
          error: separateErr.message,
          data: null,
        };
      }

      setTestResults(results);

      // Summary message
      const successCount = Object.values(results).filter(
        (r: any) => r.success
      ).length;
      const totalTests = Object.keys(results).length;

      setMessage(
        `Database tests completed! ${successCount}/${totalTests} tests passed. Check console for details.`
      );

      console.log("🔍 FINAL TEST SUMMARY:", results);
    } catch (error: any) {
      console.error("🔴 Test error:", error);
      setMessage(`Test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const seedTestData = async () => {
    setIsLoading(true);
    setMessage("Seeding test data...");

    try {
      if (!user?.id) {
        setMessage("Must be logged in to seed data");
        setIsLoading(false);
        return;
      }

      console.log("🌱 SEEDING TEST DATA...");

      // 1. Create/update user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          full_name: "Test User",
          address: "123 Test Street, Test City, TS 12345",
          phone_number: "(555) 123-4567",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) {
        setMessage(`Profile creation failed: ${profileError.message}`);
        setIsLoading(false);
        return;
      }
      console.log("✅ Profile created/updated:", profileData);

      // 2. Create tenant
      const uniqueSlug = `test-property-management-${Date.now()}`;

      console.log("🔍 About to create tenant with data:", {
        name: "Test Property Management Co",
        slug: uniqueSlug, // Use unique slug
        description: "A test tenant for development and testing",
        owner_user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: "Test Property Management Co",
          slug: uniqueSlug, // Use unique slug
          description: "A test tenant for development and testing",
          owner_user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (tenantError) {
        console.error("🔴 Tenant creation error details:", tenantError);
        setMessage(`Tenant creation failed: ${tenantError.message} (Code: ${tenantError.code})`);
        setIsLoading(false);
        return;
      }
      console.log("✅ Tenant created:", tenantData);

      // 3. Link user to tenant
      const { data: linkData, error: linkError } = await supabase
        .from("tenant_users")
        .insert({
          user_id: user.id,
          tenant_id: tenantData.id,
          role: "owner",
          status: "active",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (linkError) {
        setMessage(`User-tenant link failed: ${linkError.message}`);
        setIsLoading(false);
        return;
      }
      console.log("✅ User linked to tenant:", linkData);

      // 4. Create properties (now the trigger will work!)
      const properties = [
        {
          name: "Sunset Villa",
          description: "Beautiful 3-bedroom villa with ocean view",
          address: "456 Ocean Drive",
          city: "Coastal City",
          state: "California",
          zip: "90210",
          country: "USA",
          tenant_id: tenantData.id,
          created_by: user.id, // This is what the fixed trigger needs
          property_type: "villa",
          bedrooms: 3,
          bathrooms: 2.5,
          max_occupancy: 6,
          is_active: true,
        },
        {
          name: "Mountain Cabin",
          description: "Cozy 2-bedroom cabin in the mountains",
          address: "789 Pine Trail",
          city: "Mountain View",
          state: "Colorado",
          zip: "80424",
          country: "USA",
          tenant_id: tenantData.id,
          created_by: user.id,
          property_type: "cabin",
          bedrooms: 2,
          bathrooms: 1,
          max_occupancy: 4,
          is_active: true,
        },
        {
          name: "City Apartment",
          description: "Modern 1-bedroom apartment downtown",
          address: "321 Main Street, Unit 5A",
          city: "Metro City",
          state: "New York",
          zip: "10001",
          country: "USA",
          tenant_id: tenantData.id,
          created_by: user.id,
          property_type: "apartment",
          bedrooms: 1,
          bathrooms: 1,
          max_occupancy: 2,
          is_active: true,
        },
      ];

      console.log("🔍 About to create properties:", properties);

      // Create properties with fixed trigger support
      let createdPropertiesCount = 0;
      for (const property of properties) {
        try {
          console.log(`🏠 Creating property: ${property.name}`);
          
          const { data: propertyData, error: propertyError } = await supabase
            .from("properties")
            .insert(property)
            .select()
            .single();

          if (propertyError) {
            console.error("❌ Property creation failed:", propertyError);
          } else {
            console.log("✅ Property created:", propertyData);
            createdPropertiesCount++;
          }
        } catch (err) {
          console.error("❌ Property creation exception:", err);
        }
      }

      console.log(`✅ Created ${createdPropertiesCount}/${properties.length} properties`);

      setMessage(
        `✅ Test data seeded successfully! Created: 1 profile, 1 tenant, 1 user-tenant link, ${createdPropertiesCount} properties`
      );

      // Auto-run tests after seeding
      setTimeout(() => {
        testDatabaseTables();
      }, 1000);
    } catch (error: any) {
      console.error("🔴 Seeding error:", error);
      setMessage(`Seeding failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestData = async () => {
    if (!user?.id) {
      setMessage("Must be logged in to clear data");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to clear test data? This will delete tenant relationships and properties."
      )
    ) {
      return;
    }

    setIsLoading(true);
    setMessage("Clearing test data...");

    try {
      // Get user's tenant IDs first
      const { data: userTenantRelations } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id);

      const tenantIds = userTenantRelations?.map((t) => t.tenant_id) || [];

      // 1. Delete properties first
      if (tenantIds.length > 0) {
        const { error: propError } = await supabase
          .from("properties")
          .delete()
          .in("tenant_id", tenantIds);

        if (propError) console.error("Property deletion error:", propError);
      }

      // 2. Delete tenant-user relationships
      const { error: linkError } = await supabase
        .from("tenant_users")
        .delete()
        .eq("user_id", user.id);

      if (linkError) console.error("Link deletion error:", linkError);

      setMessage("✅ Test data cleared successfully!");

      // Auto-run tests after clearing
      setTimeout(() => {
        testDatabaseTables();
      }, 1000);
    } catch (error: any) {
      console.error("🔴 Clear error:", error);
      setMessage(`Clear failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to switch to the correct tenant
  const switchToNewTenant = () => {
    const newTenantId = "6175f22a-e5dd-4ec9-be25-a39d976af410"; // From your logs
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentTenantId', newTenantId);
      window.location.reload();
    }
    
    toast.success("Switched to tenant with new properties");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "1200px" }}>
      <h1 style={{ color: "red", fontSize: "28px", marginBottom: "20px" }}>🚨 Database Developer Tools</h1>
      
      {/* Status Bar */}
      <div style={{ 
        backgroundColor: "#f8f9fa", 
        padding: "15px", 
        marginBottom: "20px",
        borderRadius: "8px",
        border: "1px solid #dee2e6"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>Status:</strong> {message}
          </div>
          <div>
            <strong>User:</strong> {user ? user.email : "Not logged in"}
            <button 
              onClick={getCurrentUser}
              style={{ 
                marginLeft: "10px",
                padding: "5px 10px", 
                backgroundColor: "#6c757d", 
                color: "white", 
                border: "none",
                borderRadius: "3px",
                fontSize: "12px"
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "15px",
        marginBottom: "30px"
      }}>
        <button 
          onClick={testDatabaseTables}
          disabled={isLoading}
          style={{ 
            padding: "15px", 
            backgroundColor: isLoading ? "#ccc" : "#007bff", 
            color: "white", 
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: isLoading ? "not-allowed" : "pointer"
          }}
        >
          {isLoading ? "Testing..." : "🔍 Test All Tables"}
        </button>

        <button 
          onClick={seedTestData}
          disabled={isLoading || !user}
          style={{ 
            padding: "15px", 
            backgroundColor: isLoading || !user ? "#ccc" : "#28a745", 
            color: "white", 
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: isLoading || !user ? "not-allowed" : "pointer"
          }}
        >
          {isLoading ? "Seeding..." : "🌱 Seed Test Data"}
        </button>

        <button 
          onClick={clearTestData}
          disabled={isLoading || !user}
          style={{ 
            padding: "15px", 
            backgroundColor: isLoading || !user ? "#ccc" : "#dc3545", 
            color: "white", 
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: isLoading || !user ? "not-allowed" : "pointer"
          }}
        >
          {isLoading ? "Clearing..." : "🗑️ Clear Test Data"}
        </button>

        {/* Add this button to switch to the correct tenant */}
        <button
          onClick={switchToNewTenant}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          🔄 Switch to New Tenant with Properties
        </button>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h2>Test Results</h2>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
            gap: "15px"
          }}>
            {Object.entries(testResults).map(([testName, result]: [string, any]) => (
              <div 
                key={testName}
                style={{ 
                  backgroundColor: result.success ? "#d4edda" : "#f8d7da", 
                  border: `1px solid ${result.success ? "#c3e6cb" : "#f5c6cb"}`,
                  borderRadius: "8px",
                  padding: "15px"
                }}
              >
                <h4 style={{ margin: "0 0 10px 0", textTransform: "uppercase" }}>
                  {result.success ? "✅" : "❌"} {testName.replace(/_/g, " ")}
                </h4>
                {result.count !== undefined && (
                  <p style={{ margin: "5px 0" }}><strong>Records:</strong> {result.count}</p>
                )}
                {result.error && (
                  <p style={{ margin: "5px 0", color: "#721c24" }}><strong>Error:</strong> {result.error}</p>
                )}
                {result.data && result.count > 0 && (
                  <details style={{ marginTop: "10px" }}>
                    <summary style={{ cursor: "pointer" }}>View Data</summary>
                    <pre style={{ 
                      fontSize: "12px", 
                      backgroundColor: "rgba(0,0,0,0.1)", 
                      padding: "10px", 
                      borderRadius: "4px",
                      overflow: "auto",
                      maxHeight: "200px"
                    }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problem Analysis */}
      <div style={{ 
        backgroundColor: "#d4edda", // Green background for solved
        padding: "20px", 
        margin: "20px 0", 
        border: "1px solid #c3e6cb",
        borderRadius: "8px"
      }}>
        <h3>✅ Hook Problem Solved</h3>
        <p><strong>Original Issue:</strong> The useTenant hook was making this malformed query:</p>
        <code style={{ 
          backgroundColor: "#f8f9fa", 
          padding: "8px", 
          display: "block", 
          fontSize: "12px",
          fontFamily: "monospace",
          margin: "10px 0",
          borderRadius: "4px"
        }}>
          tenant_users?select=tenant_id,role,status,tenants(id,name,description,created_at)
        </code>
        <p><strong>Problem:</strong> Multiple foreign key relationships caused ambiguity.</p>
        <p><strong>✅ Solution Implemented:</strong></p>
        <ul>
          <li>✅ Modified useTenant hook to use separate queries</li>
          <li>✅ Avoids relationship ambiguity completely</li>
          <li>✅ More reliable and predictable behavior</li>
          <li>✅ Better error handling and debugging</li>
        </ul>
      </div>

      {/* Navigation */}
      <div style={{ 
        backgroundColor: "#e9ecef", 
        padding: "15px", 
        borderRadius: "8px"
      }}>
        <h3>Navigation</h3>
        <div style={{ display: "flex", gap: "15px" }}>
          <a href="/" style={{ color: "#007bff", textDecoration: "none" }}>← Back to Home</a>
          <a href="/account" style={{ color: "#007bff", textDecoration: "none" }}>Account Page</a>
          <a href="/auth/login" style={{ color: "#007bff", textDecoration: "none" }}>Login</a>
        </div>
      </div>
    </div>
  );
}
