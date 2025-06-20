"use client";

import { useState, useEffect } from "react";
import { Building, Plus } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

export default function AccountPropertiesPage() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  const [properties] = useState([
    { id: "1", name: "Bend House Test", address: "123 Test St" },
  ]);

  // Auth check at page level
  useEffect(() => {
    if (!loading && initialized && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, initialized, router]);

  // Show loading while auth initializes
  if (loading || !initialized) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if no user
  if (!user) {
    return null;
  }

  return (
    <StandardPageLayout>
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Building className="h-6 w-6 mr-2 text-blue-600" />
          <span className="text-lg text-gray-600">
            {properties.length} properties in your account
          </span>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {properties.length}
          </div>
          <p className="text-gray-600">Total Properties</p>
        </div>
        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">1</div>
          <p className="text-gray-600">Active Property</p>
        </div>
        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">1</div>
          <p className="text-gray-600">Added This Month</p>
        </div>
      </div>

      {/* Properties List */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            All Properties
          </h2>
        </div>

        <div className="p-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {property.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{property.address}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50">
                    View
                  </button>
                  <button className="px-3 py-1 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StandardPageLayout>
  );
}
