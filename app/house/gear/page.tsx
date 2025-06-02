"use client";

import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { Package, Bike, Waves, Camera, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

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

export default function GearPage() {
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual database calls
  useEffect(() => {
    const mockGearData: GearItem[] = [
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
        description: "20\" and 24\" kids bikes with training wheels available",
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

    setGearItems(mockGearData);
    setLoading(false);
  }, []);

  const categories = [
    { id: "all", name: "All Gear", icon: Package },
    { id: "bikes", name: "Bikes", icon: Bike },
    { id: "water", name: "Water Sports", icon: Waves },
    { id: "beach", name: "Beach Gear", icon: Camera },
  ];

  const filteredGear = selectedCategory === "all" 
    ? gearItems 
    : gearItems.filter(item => item.category === selectedCategory);

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent": return "text-green-600 bg-green-100";
      case "good": return "text-blue-600 bg-blue-100";
      case "fair": return "text-yellow-600 bg-yellow-100";
      case "needs-repair": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <StandardPageLayout
        title="House Gear"
        headerIcon={<Package className="h-6 w-6 text-blue-600" />}
      >
        <StandardCard>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading gear inventory...</span>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title="House Gear & Equipment"
      subtitle="Everything available for your stay"
      headerIcon={<Package className="h-6 w-6 text-blue-600" />}
      breadcrumb={[
        { label: "The House", href: "/house" },
        { label: "Gear" },
      ]}
    >
      <div className="space-y-6">
        {/* Category Filter */}
        <StandardCard>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
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
            })}
          </div>
        </StandardCard>

        {/* Gear Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGear.map((item) => (
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
                    <span className={`px-2 py-1 text-xs rounded-full ${getConditionColor(item.condition)}`}>
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
                    <p className="text-xs text-blue-800">
                      💡 {item.instructions}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {item.available && (
                  <div className="pt-2 border-t border-gray-200">
                    <Link
                      href={`/house/gear/${item.id}`}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Details
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                )}
              </div>
            </StandardCard>
          ))}
        </div>

        {filteredGear.length === 0 && (
          <StandardCard>
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No gear found
              </h3>
              <p className="text-gray-500">
                No items available in the selected category.
              </p>
            </div>
          </StandardCard>
        )}
      </div>
    </StandardPageLayout>
  );
}