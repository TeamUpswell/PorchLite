"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { canManageProperty } from "@/lib/utils/roles";
import { supabase } from "@/lib/supabase";
import StandardCard from "@/components/ui/StandardCard";
import {
  ArrowRight,
  Bike,
  Building2,
  Camera,
  Car,
  Compass,
  ExternalLink,
  Gamepad2,
  MapPin,
  Plus,
  Navigation,
  Waves,
  Wifi,
  Package,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PropertyMap from "@/components/PropertyMap";
import { PropertyGuard } from "@/components/ui/PropertyGuard";

interface GearItem {
  id: string;
  name: string;
  category: string;
  description: string;
  image?: string;
  location: string;
  available: boolean;
  instructions?: string;
  property_id: string;
  created_at: string;
  updated_at: string;
}

export default function HousePage() {
  const {
    user,
    loading: authLoading,
    profileData,
    profileLoading,
    initialized,
  } = useAuth();
  const {
    currentProperty,
    loading: propertyLoading,
    error: propertyError,
  } = useProperty();
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walkthroughExists, setWalkthroughExists] = useState<boolean | null>(
    null
  );

  // Check if user can manage this property
  const userCanManageProperty = canManageProperty(user);

  // ✅ Updated loading calculation to include profileLoading
  const isAuthLoading = authLoading || profileLoading;

  // ✅ DEBUG LOGS
  console.log("🏠 HousePage render:", {
    authLoading,
    profileLoading,
    propertyLoading,
    user: !!user,
    currentProperty: !!currentProperty,
    propertyName: currentProperty?.name,
    userCanManageProperty,
    loading,
    isAuthLoading,
  });

  // Debugging right at the start of your component:
  useEffect(() => {
    console.log("🏠 HousePage Debug State:", {
      // Auth state
      authLoading,
      profileLoading,
      initialized,
      hasUser: !!user,
      userId: user?.id,

      // Property state
      propertyLoading,
      hasProperty: !!currentProperty,
      property_id: currentProperty?.id,
      propertyError,

      // Combined loading state
      isLoading: authLoading || profileLoading || propertyLoading,
    });
  }, [
    authLoading,
    profileLoading,
    propertyLoading,
    initialized,
    user?.id,
    currentProperty?.id,
    propertyError,
  ]);

  // ✅ Fetch gear items from database
  useEffect(() => {
    const fetchGearItems = async () => {
      if (!currentProperty?.id) {
        console.log("🎒 No current property, skipping gear fetch");
        setGearItems([]);
        setLoading(false);
        return;
      }

      console.log("🎒 Fetching gear items for property:", currentProperty.name);
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("gear_items")
          .select("*")
          .eq("property_id", currentProperty.id)
          .order("name");

        if (error) {
          console.error("❌ Error fetching gear items:", error);
          setError(`Failed to load gear items: ${error.message}`);
          setGearItems([]);
        } else {
          console.log(
            "✅ Gear items fetched successfully:",
            data?.length || 0,
            "items"
          );
          setGearItems(data || []);
        }
      } catch (error) {
        console.error("❌ Unexpected error fetching gear items:", error);
        setError("Failed to load gear items. Please try again.");
        setGearItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGearItems();
  }, [currentProperty?.id, currentProperty?.name]);

  // Check if walkthrough exists
  useEffect(() => {
    const checkWalkthroughExists = async () => {
      if (!currentProperty?.id) {
        console.log("🔍 No current property, skipping walkthrough check");
        setWalkthroughExists(null);
        return;
      }

      console.log(
        "🔍 Checking walkthrough for property:",
        currentProperty.name
      );
      try {
        const { data, error } = await supabase
          .from("walkthrough_sections")
          .select("id")
          .eq("property_id", currentProperty.id)
          .limit(1);

        if (error) throw error;

        const exists = data && data.length > 0;
        setWalkthroughExists(exists);
        console.log(
          "✅ Walkthrough check complete:",
          exists ? "exists" : "none found"
        );
      } catch (error) {
        console.error("❌ Error checking walkthrough:", error);
        setWalkthroughExists(false);
      }
    };

    checkWalkthroughExists();
  }, [currentProperty?.id, currentProperty?.name]);

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case "bikes":
      case "bicycle":
        return Bike;
      case "water":
      case "watercraft":
      case "swimming":
        return Waves;
      case "beach":
      case "outdoor":
        return Camera;
      case "games":
      case "entertainment":
        return Gamepad2;
      case "vehicles":
      case "transportation":
        return Car;
      default:
        return Package;
    }
  };

  // Helper functions to ensure proper number types
  const getLatitude = (property: NonNullable<typeof currentProperty>) => {
    return typeof property.latitude === "string"
      ? parseFloat(property.latitude)
      : property.latitude;
  };

  const getLongitude = (property: NonNullable<typeof currentProperty>) => {
    return typeof property.longitude === "string"
      ? parseFloat(property.longitude)
      : property.longitude;
  };

  // ✅ LOADING STATE - Updated to use isAuthLoading
  if (isAuthLoading || propertyLoading) {
    console.log("⏳ HousePage showing loading state:", {
      authLoading,
      profileLoading,
      propertyLoading,
      isAuthLoading,
    });
    return (
      <StandardCard>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading house information...</span>
        </div>
      </StandardCard>
    );
  }

  // ✅ NO PROPERTY STATE
  if (!currentProperty) {
    console.log("🚫 HousePage: No current property found");
    return (
      <StandardCard>
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Property Selected
          </h3>
          <p className="text-gray-600 mb-4">
            Please select a property to view house information.
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View Properties
          </Link>
        </div>
      </StandardCard>
    );
  }

  console.log(
    "✅ HousePage: Rendering main content for:",
    currentProperty.name
  );

  return (
    <PropertyGuard>
      <div className="space-y-6">
        {/* ✅ Location Map */}
        {currentProperty &&
          currentProperty.latitude &&
          currentProperty.longitude && (
            <StandardCard>
              <div className="p-0 relative">
                {/* Map Component */}
                <PropertyMap
                  latitude={getLatitude(currentProperty)}
                  longitude={getLongitude(currentProperty)}
                  address={currentProperty.address}
                  height="250px"
                  className="rounded-lg"
                />

                {/* Address Overlay - Bottom Left */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3 max-w-sm">
                  <h3 className="font-medium text-gray-900 text-sm mb-1">
                    {currentProperty.name}
                  </h3>
                  {currentProperty.address && (
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {currentProperty.address}
                    </p>
                  )}
                  {currentProperty.city && currentProperty.state && (
                    <p className="text-xs text-gray-500">
                      {currentProperty.city}, {currentProperty.state}{" "}
                      {currentProperty.zip}
                    </p>
                  )}
                </div>

                {/* Directions Button Overlay - Top Right */}
                <div className="absolute top-4 right-4">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${getLatitude(currentProperty)},${getLongitude(currentProperty)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg border border-blue-600 transition-all hover:shadow-xl"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Directions
                  </a>
                </div>
              </div>
            </StandardCard>
          )}

        {/* House Overview Card - Only show if walkthrough exists OR user can't manage */}
        {(walkthroughExists || !userCanManageProperty) && (
          <StandardCard>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                House Overview
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">House photo coming soon</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Welcome to Your Vacation Home
                  </h3>
                  <p className="text-gray-700">
                    Everything you need for a perfect getaway. Take a virtual
                    walkthrough or browse our available gear and amenities.
                  </p>
                </div>
                <div className="flex space-x-4">
                  {walkthroughExists && (
                    <Link
                      href="/house/instructions"
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Compass className="h-4 w-4 mr-2" />
                      View Instructions
                    </Link>
                  )}
                  <Link
                    href="/inventory"
                    className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View All Gear
                  </Link>
                </div>
              </div>
            </div>
          </StandardCard>
        )}

        {/* ✅ Database-driven Gear Grid */}
        <StandardCard>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Available Gear & Amenities
            </h3>
            {userCanManageProperty && (
              <Link
                href="/inventory"
                className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Manage Gear
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading gear...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unable to Load Gear
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : gearItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Gear Available
              </h3>
              <p className="text-gray-600 mb-4">
                {userCanManageProperty
                  ? "Add gear items to help guests enjoy their stay."
                  : "No gear items have been added to this property yet."}
              </p>
              {userCanManageProperty && (
                <Link
                  href="/inventory"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gear Items
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gearItems.map((item) => {
                const IconComponent = getCategoryIcon(item.category);

                return (
                  <div
                    key={item.id}
                    className={`p-6 border rounded-lg transition-all hover:shadow-md ${
                      item.available
                        ? "border-gray-200 hover:border-blue-300"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <IconComponent
                        className={`h-8 w-8 ${
                          item.available ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          item.available
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.available ? "Available" : "Unavailable"}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2">
                      {item.name}
                    </h3>

                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {item.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      {item.location && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {item.location}
                        </div>
                      )}

                      {item.instructions && (
                        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          💡 {item.instructions}
                        </p>
                      )}

                      {item.category && (
                        <div className="text-xs text-gray-400 uppercase tracking-wide">
                          {item.category}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </StandardCard>

        {/* House Features */}
        <StandardCard>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              House Features
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <Wifi className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium text-gray-900">High-Speed WiFi</div>
              <div className="text-sm text-gray-500">
                Password in welcome book
              </div>
            </div>

            <div className="text-center p-4">
              <Car className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium text-gray-900">Parking</div>
              <div className="text-sm text-gray-500">2 car driveway</div>
            </div>

            <div className="text-center p-4">
              <Camera className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="font-medium text-gray-900">Smart TV</div>
              <div className="text-sm text-gray-500">
                Netflix, Hulu included
              </div>
            </div>

            <div className="text-center p-4">
              <Gamepad2 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="font-medium text-gray-900">Game Room</div>
              <div className="text-sm text-gray-500">Board games & more</div>
            </div>
          </div>
        </StandardCard>

        {/* House Tour Section */}
        {currentProperty?.house_tour_enabled !== false && (
          <>
            {walkthroughExists ? (
              // Existing full walkthrough card for guests
              <StandardCard>
                <div className="flex items-start space-x-3 mb-4">
                  <Compass className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      House Instructions
                    </h3>
                    <p className="text-sm text-gray-500">
                      Get familiar with your vacation home
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    View detailed instructions and information about the
                    house, amenities, appliances, and important details for
                    your stay.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Step-by-step house guide
                    </div>
                    <Link
                      href="/house/instructions"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Instructions
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </StandardCard>
            ) : userCanManageProperty ? (
              // Compact setup section for owners/managers
              <StandardCard>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Compass className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Create House Instructions
                      </h3>
                      <p className="text-sm text-gray-600">
                        Help guests get familiar with your home
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/house/instructions/manage"
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Setup Instructions
                  </Link>
                </div>
              </StandardCard>
            ) : null}
          </>
        )}
      </div>
    </PropertyGuard>
  );
}