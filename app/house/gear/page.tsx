"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import {
  Package,
  Bike,
  Waves,
  Camera,
  MapPin,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

// Types
interface GearItem {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  available: boolean;
  instructions?: string;
  condition: "excellent" | "good" | "fair" | "needs-repair";
}

interface Category {
  id: string;
  name: string;
  icon: typeof Package;
}

// Constants
const CATEGORIES: Category[] = [
  { id: "all", name: "All Gear", icon: Package },
  { id: "bikes", name: "Bikes", icon: Bike },
  { id: "water", name: "Water Sports", icon: Waves },
  { id: "beach", name: "Beach Gear", icon: Camera },
];

// Mock data - will be replaced with real API calls
const MOCK_GEAR_DATA: GearItem[] = [
  {
    id: "1",
    name: "Adult Mountain Bikes (2)",
    category: "bikes",
    description: "Trek mountain bikes suitable for trails and city riding",
    location: "Garage - left side",
    available: true,
    condition: "excellent",
    instructions: "Helmets in hall closet. Please return clean and locked.",
  },
  {
    id: "2",
    name: "Kids Bikes (2)",
    category: "bikes",
    description: '20" and 24" kids bikes with training wheels available',
    location: "Garage - right side",
    available: true,
    condition: "good",
    instructions: "Training wheels in garage tool box if needed.",
  },
  {
    id: "3",
    name: "Stand Up Paddleboards (2)",
    category: "water",
    description: "Inflatable SUPs with pumps, paddles, and life jackets",
    location: "Deck storage box",
    available: true,
    condition: "excellent",
    instructions: "Life jackets required by law. Check weather before use.",
  },
  {
    id: "4",
    name: "2-Person Kayak",
    category: "water",
    description: "Tandem kayak with paddles and safety equipment",
    location: "Under deck",
    available: false,
    condition: "needs-repair",
    instructions: "Currently being repaired - available next week.",
  },
  {
    id: "5",
    name: "Beach Chairs (4)",
    category: "beach",
    description: "Lightweight folding beach chairs",
    location: "Mudroom closet",
    available: true,
    condition: "good",
  },
  {
    id: "6",
    name: "Beach Umbrella",
    category: "beach",
    description: "Large UV protection beach umbrella",
    location: "Mudroom closet",
    available: true,
    condition: "excellent",
  },
  {
    id: "7",
    name: "Coolers (2)",
    category: "beach",
    description: "Small and large coolers with ice packs",
    location: "Mudroom closet",
    available: true,
    condition: "good",
  },
  {
    id: "8",
    name: "Snorkel Gear",
    category: "water",
    description: "Masks, snorkels, and fins (various sizes)",
    location: "Bathroom cabinet",
    available: true,
    condition: "good",
    instructions: "Please rinse with fresh water after use.",
  },
];

export default function HouseGearPage() {
  const { user, loading: authLoading } = useAuth();
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to track component mount
  const mountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Optimized data loading
  useEffect(() => {
    // Only load once
    if (hasLoadedRef.current || !user || authLoading) {
      return;
    }

    const loadGearData = async () => {
      hasLoadedRef.current = true;

      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API call
        // const { data, error } = await supabase
        //   .from('gear_items')
        //   .select('*')
        //   .eq('property_id', currentProperty.id)
        //   .order('name');

        // Simulate API delay for development
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (mountedRef.current) {
          console.log("🏠 Loaded gear items:", MOCK_GEAR_DATA.length);
          setGearItems(MOCK_GEAR_DATA);
        }
      } catch (error) {
        console.error("❌ Error loading gear items:", error);
        if (mountedRef.current) {
          setError("Failed to load gear items. Please try again.");
          setGearItems([]);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadGearData();
  }, [user, authLoading]);

  // Memoized condition color function
  const getConditionColor = useCallback((condition: string) => {
    switch (condition) {
      case "excellent":
        return "text-green-600 bg-green-100";
      case "good":
        return "text-blue-600 bg-blue-100";
      case "fair":
        return "text-yellow-600 bg-yellow-100";
      case "needs-repair":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  }, []);

  // Memoized filtered gear
  const filteredGear = useMemo(() => {
    if (selectedCategory === "all") {
      return gearItems;
    }
    return gearItems.filter((item) => item.category === selectedCategory);
  }, [gearItems, selectedCategory]);

  // Memoized category change handler
  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
  }, []);

  // Memoized category buttons
  const categoryButtons = useMemo(
    () =>
      CATEGORIES.map((category) => {
        const IconComponent = category.icon;
        const isSelected = selectedCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              isSelected
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <IconComponent className="h-4 w-4 mr-2" />
            {category.name}
          </button>
        );
      }),
    [selectedCategory, handleCategoryChange]
  );

  // Memoized gear cards
  const gearCards = useMemo(
    () =>
      filteredGear.map((item) => (
        <StandardCard key={item.id}>
          <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              <div className="flex flex-col items-end space-y-1">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    item.available
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.available ? "Available" : "Unavailable"}
                </span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getConditionColor(
                    item.condition
                  )}`}
                >
                  {item.condition.replace("-", " ")}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm">{item.description}</p>

            {/* Location */}
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-1" />
              {item.location}
            </div>

            {/* Instructions */}
            {item.instructions && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-800">💡 {item.instructions}</p>
              </div>
            )}

            {/* Actions */}
            {item.available && (
              <div className="pt-2 border-t border-gray-200">
                <Link
                  href={`/house/gear/${item.id}`}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View Details
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </div>
            )}
          </div>
        </StandardCard>
      )),
    [filteredGear, getConditionColor]
  );

  // Memoized stats
  const gearStats = useMemo(() => {
    const total = gearItems.length;
    const available = gearItems.filter((item) => item.available).length;
    const byCategory = CATEGORIES.slice(1).map((cat) => ({
      ...cat,
      count: gearItems.filter((item) => item.category === cat.id).length,
    }));

    return { total, available, byCategory };
  }, [gearItems]);

  // Retry function
  const retryLoad = useCallback(() => {
    hasLoadedRef.current = false;
    setError(null);
    setGearItems([]);
    // Trigger re-load
    const timer = setTimeout(() => {
      if (mountedRef.current && user && !authLoading) {
        // This will trigger the useEffect again
        hasLoadedRef.current = false;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, authLoading]);

  // Loading states
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">⏳ Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Header title="House Gear" />
        <PageContainer>
          <StandardCard>
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-red-300 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={retryLoad}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="House Gear" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="House Equipment & Gear"
            subtitle={`Manage house equipment and gear inventory (${gearStats.total} items, ${gearStats.available} available)`}
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading gear inventory...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Breadcrumb */}
                <nav className="flex text-sm text-gray-500">
                  <Link
                    href="/house"
                    className="hover:text-gray-700 transition-colors"
                  >
                    The House
                  </Link>
                  <span className="mx-2">/</span>
                  <span className="text-gray-900">Gear</span>
                </nav>

                {/* Stats Summary */}
                <StandardCard>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {gearStats.total}
                      </div>
                      <div className="text-sm text-gray-500">Total Items</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {gearStats.available}
                      </div>
                      <div className="text-sm text-gray-500">Available</div>
                    </div>
                    {gearStats.byCategory.map((cat) => (
                      <div key={cat.id} className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {cat.count}
                        </div>
                        <div className="text-sm text-gray-500">{cat.name}</div>
                      </div>
                    ))}
                  </div>
                </StandardCard>

                {/* Category Filter */}
                <StandardCard>
                  <div className="flex flex-wrap gap-2">{categoryButtons}</div>
                </StandardCard>

                {/* Gear Grid */}
                {filteredGear.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gearCards}
                  </div>
                ) : (
                  <StandardCard>
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No gear found
                      </h3>
                      <p className="text-gray-500">
                        {selectedCategory === "all"
                          ? "No gear items available yet."
                          : `No items available in the ${
                              CATEGORIES.find((c) => c.id === selectedCategory)
                                ?.name
                            } category.`}
                      </p>
                      {selectedCategory !== "all" && (
                        <button
                          onClick={() => setSelectedCategory("all")}
                          className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View all categories
                        </button>
                      )}
                    </div>
                  </StandardCard>
                )}
              </div>
            )}
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
