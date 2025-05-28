"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Account, 2: Property, 3: Complete
  const [isLoading, setIsLoading] = useState(false);
  
  // Account data
  const [accountData, setAccountData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  // Property data
  const [propertyData, setPropertyData] = useState({
    name: "",
    address: "",
    description: "",
  });

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (accountData.password !== accountData.confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: accountData.email,
        password: accountData.password,
        options: {
          data: {
            first_name: accountData.firstName,
            last_name: accountData.lastName,
          }
        }
      });

      if (authError) throw authError;

      // Move to property step
      setStep(2);
    } catch (error) {
      console.error("Error creating account:", error);
      alert("Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get current user
      console.log("Getting current user...");
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current user:", user);
      
      if (!user) throw new Error("No user found");

      // Create tenant (property portfolio)
      const tenantName = `${accountData.firstName}'s Properties`;
      const slug = `${accountData.firstName.toLowerCase()}-${accountData.lastName.toLowerCase()}-${Date.now()}`.replace(/[^a-z0-9]/g, '-');
      
      console.log("Creating tenant with data:", { name: tenantName, slug, owner_user_id: user.id });
      
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert([{
          name: tenantName,
          slug: slug,
          owner_user_id: user.id,
        }])
        .select()
        .single();

      console.log("Tenant creation result:", { tenant, tenantError });
      if (tenantError) throw tenantError;

      // Create tenant_user relationship
      console.log("Creating tenant_user relationship...");
      const { error: tenantUserError } = await supabase
        .from("tenant_users")
        .insert([{
          tenant_id: tenant.id,
          user_id: user.id,
          role: "owner",
          status: "active",
        }]);

      console.log("Tenant user creation result:", { tenantUserError });
      if (tenantUserError) throw tenantUserError;

      // Create property (already updated with tenant_id)
      const propertyInsertData = {
        name: propertyData.name,
        address: propertyData.address,
        description: propertyData.description,
        tenant_id: tenant.id, // Already correct
        created_by: user.id,
      };
      
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .insert([propertyInsertData])
        .select()
        .single();

      console.log("Property creation result:", { property, propertyError });
      if (propertyError) {
        console.error("Property creation failed:", propertyError);
        throw propertyError;
      }

      console.log("All creation successful! Moving to step 3...");
      setStep(3);
      
      // Redirect after a moment
      setTimeout(() => {
        router.push(`/properties/${property.id}`);
      }, 2000);

    } catch (error) {
      console.error("Full error in handlePropertySubmit:", error);
      console.error("Error message:", error.message);
      console.error("Error details:", error);
      alert(`Failed to create property: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        
        {/* Progress indicator */}
        <div className="flex justify-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
        </div>

        {/* Step 1: Account Creation */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-center">Create Your Account</h2>
            <form onSubmit={handleAccountSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={accountData.firstName}
                  onChange={(e) => setAccountData({...accountData, firstName: e.target.value})}
                  className="px-3 py-2 border rounded-md"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={accountData.lastName}
                  onChange={(e) => setAccountData({...accountData, lastName: e.target.value})}
                  className="px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={accountData.email}
                onChange={(e) => setAccountData({...accountData, email: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={accountData.password}
                onChange={(e) => setAccountData({...accountData, password: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={accountData.confirmPassword}
                onChange={(e) => setAccountData({...accountData, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Creating Account..." : "Next: Add Your Property"}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Property Creation */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-center">Add Your First Property</h2>
            <form onSubmit={handlePropertySubmit} className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Property Name"
                value={propertyData.name}
                onChange={(e) => setPropertyData({...propertyData, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              <input
                type="text"
                placeholder="Address"
                value={propertyData.address}
                onChange={(e) => setPropertyData({...propertyData, address: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={propertyData.description}
                onChange={(e) => setPropertyData({...propertyData, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Creating Property..." : "Complete Setup"}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600">Welcome!</h2>
            <p className="mt-4">Your account and property have been created successfully.</p>
            <p className="mt-2">Redirecting to your property...</p>
          </div>
        )}

        {/* Login link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}