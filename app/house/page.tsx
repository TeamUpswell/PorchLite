"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { canManageProperty } from "@/lib/utils/roles";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PropertyMap from "@/components/PropertyMap";

interface GearItem {
  id: string;
  name: string;
  category: string;
  description: string;
  image?: string;
  location: string;
  available: boolean;
  instructions?: string;
}

export default function HousePage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [walkthroughExists, setWalkthroughExists] = useState<boolean | null>(
    null
  );

  // Check if user can manage this property
  const userCanManageProperty = canManageProperty(user);

  // ✅ DEBUG LOGS
  console.log("🏠 HousePage render:", {
    authLoading,
    propertyLoading,
    user: !!user,
    currentProperty: !!currentProperty,
    propertyName: currentProperty?.name,
    userCanManageProperty,
    loading,
  });

  // Mock data for now - you can replace with actual database calls
  useEffect(() => {
    console.log("🔧 Setting up mock gear data...");
    const mockGearData: GearItem[] = [
      {
        id: "1",
        name: "Mountain Bikes",
        category: "bikes",
        description:
          "2 adult mountain bikes available for trails and town rides",
        location: "Garage",
        available: true,
        instructions:
          "Helmets are in the hall closet. Please lock bikes when not in use.",
      },
      {
        id: "2",
        name: "Stand Up Paddleboards",
        category: "water",
        description: "2 SUPs with paddles and life jackets",
        location: "Deck storage box",
        available: true,
        instructions:
          "Life jackets required. Check weather conditions before use.",
      },
      {
        id: "3",
        name: "Beach Gear",
        category: "beach",
        description: "Chairs, umbrellas, coolers, and beach toys",
        location: "Mudroom closet",
        available: true,
      },
      {
        id: "4",
        name: "Kayaks",
        category: "water",
        description: "2-person kayak with paddles",
        location: "Under deck",
        available: false,
        instructions: "Currently being repaired - available next week",
      },
    ];

    setGearItems(mockGearData);
    setLoading(false);
    console.log("✅ Mock gear data loaded:", mockGearData.length, "items");
  }, []);

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
  }, [currentProperty]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bikes":
        return Bike;
      case "water":
        return Waves;
      case "beach":
        return Camera;
      default:
        return Gamepad2;
    }
  };

  // ✅ LOADING STATE - Wait for auth and property
  if (authLoading || propertyLoading) {
    console.log("⏳ HousePage showing loading state:", {
      authLoading,
      propertyLoading,
    });
    return (
      <div className="p-6">
        <Header title="House" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading house information...</span>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  // ✅ NO PROPERTY STATE
  if (!currentProperty) {
    console.log("🚫 HousePage: No current property found");
    return (
      <div className="p-6">
        <Header title="House" />
        <PageContainer>
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
        </PageContainer>
      </div>
    );
  }

  console.log(
    "✅ HousePage: Rendering main content for:",
    currentProperty.name
  );

  return (
    <div className="p-6">
      <Header title="House" />
      <PageContainer className="space-y-6">
        {/* Location Map - Moved to Top & Simplified */}
        {currentProperty &&
          currentProperty.latitude &&
          currentProperty.longitude && (
            <StandardCard>
              <div className="p-0 relative">
                {/* Map Component */}
                <PropertyMap
                  latitude={parseFloat(currentProperty.latitude)}
                  longitude={parseFloat(currentProperty.longitude)}
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
                    href={`https://www.google.com/maps/dir/?api=1&destination=${parseFloat(
                      currentProperty.latitude
                    )},${parseFloat(currentProperty.longitude)}`}
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
          <StandardCard title="House Overview">
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

        {/* Quick Access Gear Grid */}
        <StandardCard title="Available Gear & Amenities">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading gear...</span>
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
                    <p className="text-sm text-gray-600 mb-3">
                      {item.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {item.location}
                      </div>

                      {item.instructions && (
                        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          💡 {item.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </StandardCard>

        {/* House Features */}
        <StandardCard title="House Features">
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
              <StandardCard
                title="House Instructions"
                description="Get familiar with your vacation home"
                icon={<Compass className="h-6 w-6 text-blue-600" />}
              >
                <div className="space-y-4">
                  <p className="text-gray-600">
                    View detailed instructions and information about the house,
                    amenities, appliances, and important details for your stay.
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
      </PageContainer>
    </div>
  );
}
