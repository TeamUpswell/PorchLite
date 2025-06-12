"use client";

import { useState, useEffect, useRef } from "react";
import {
  Star,
  Plus,
  MapPin,
  Phone,
  Globe,
  Navigation,
  Trash2,
  Search,
} from "lucide-react";
import Link from "next/link";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer"; // ✅ Add this back
import Header from "@/components/layout/Header"; // ✅ Add Header import
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import GooglePlacePhoto from "@/components/GooglePlacePhoto";
import RecommendationComments from "@/components/recommendations/RecommendationComments";
import RecommendationFilters from "@/components/recommendations/RecommendationFilters";
import { MultiActionPattern } from "@/components/ui/FloatingActionPresets";
import PlaceSearch from "@/components/maps/PlaceSearch";
import DynamicGooglePlacePhoto from "@/components/DynamicGooglePlacePhoto";
import GooglePlacesSearch from "@/components/ui/GooglePlacesSearch";
import { debugLog, debugError } from "@/lib/utils/debug";

interface Recommendation {
  id: string;
  name: string;
  category: string;
  address: string;
  coordinates: { lat: number; lng: number };
  description: string;
  rating: number;
  website?: string;
  phone_number?: string;
  images: string[];
  created_at: string;
  updated_at: string;
  is_recommended: boolean;
  place_id?: string;
  property_id?: string;
}

interface PlacesResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  price_level?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now: boolean;
  };
}

interface AutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

export default function RecommendationsPage() {
  const { user } = useAuth();
  const { currentProperty } = useProperty();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<
    Recommendation[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);

        const { data: recommendationsData, error } = await supabase
          .from("recommendations")
          .select("*")
          .order("rating", { ascending: false });

        if (error) throw error;

        setRecommendations(recommendationsData || []);
        setFilteredRecommendations(recommendationsData || []);
      } catch (error) {
        console.error("Error loading recommendations:", error);
        setRecommendations([]);
        setFilteredRecommendations([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, []); // ← Simple dependency array

  // Places search state - DEFAULT TO SHOWING
  const [placesSearchTerm, setPlacesSearchTerm] = useState("");
  const [autocompletePredictions, setAutocompletePredictions] = useState<
    AutocompletePrediction[]
  >([]);
  const [selectedPlace, setSelectedPlace] = useState<PlacesResult | null>(null);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Delete state only
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recommendationToDelete, setRecommendationToDelete] =
    useState<Recommendation | null>(null);

  // Manual recommendation modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false); // ← Add this for floating menu
  const [manualForm, setManualForm] = useState({
    name: "",
    category: "restaurant",
    address: "",
    description: "",
    rating: 5,
    website: "",
    phone_number: "",
  });

  // Add this state variable with your other useState declarations (around line 95):
  const [showGoogleSearchModal, setShowGoogleSearchModal] = useState(false);

  const autocompleteRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const categories = [
    { id: "all", name: "All Categories", icon: "🏪" },
    { id: "restaurant", name: "Restaurants", icon: "🍽️" },
    { id: "grocery", name: "Grocery", icon: "🛒" },
    { id: "entertainment", name: "Entertainment", icon: "🎭" },
    { id: "healthcare", name: "Healthcare", icon: "🏥" },
    { id: "shopping", name: "Shopping", icon: "🛍️" },
    { id: "services", name: "Services", icon: "🔧" },
    { id: "outdoor", name: "Outdoor", icon: "🌲" },
    { id: "emergency", name: "Emergency", icon: "🚨" },
  ];

  // Autocomplete search with debouncing
  const searchAutocomplete = async (input: string) => {
    if (input.length < 2) {
      setAutocompletePredictions([]);
      setShowAutocomplete(false);
      return;
    }

    try {
      const location = currentProperty?.coordinates
        ? `${currentProperty.coordinates.lat},${currentProperty.coordinates.lng}`
        : "40.7128,-74.0060";

      const response = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(
          input
        )}&location=${location}&radius=5000`
      );

      const data = await response.json();
      setAutocompletePredictions(data.predictions || []);
      setShowAutocomplete(true);
    } catch (error) {
      console.error("Error fetching autocomplete:", error);
    }
  };

  // Handle input change with debouncing
  const handleSearchInput = (value: string) => {
    setPlacesSearchTerm(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchAutocomplete(value);
    }, 300);
  };

  // Get place details when prediction is selected
  const selectPrediction = async (prediction: AutocompletePrediction) => {
    setPlacesLoading(true);
    setPlacesSearchTerm(prediction.description);
    setShowAutocomplete(false);

    try {
      const response = await fetch(
        `/api/places/details?place_id=${prediction.place_id}`
      );
      const data = await response.json();

      if (data.result) {
        setSelectedPlace({
          place_id: prediction.place_id,
          name: data.result.name,
          formatted_address: data.result.formatted_address,
          rating: data.result.rating,
          price_level: data.result.price_level,
          types: data.result.types || [],
          geometry: data.result.geometry,
          photos: data.result.photos,
          formatted_phone_number: data.result.formatted_phone_number,
          website: data.result.website,
          opening_hours: data.result.opening_hours,
        });
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
      alert("Failed to get place details");
    } finally {
      setPlacesLoading(false);
    }
  };

  // Close autocomplete when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to determine category from Google Places types
  const getCategoryFromTypes = (types: string[]): string => {
    const typeMap: Record<string, string> = {
      restaurant: "restaurant",
      food: "restaurant",
      meal_takeaway: "restaurant",
      grocery_or_supermarket: "grocery",
      hospital: "healthcare",
      doctor: "healthcare",
      pharmacy: "healthcare",
      shopping_mall: "shopping",
      store: "shopping",
      tourist_attraction: "entertainment",
      amusement_park: "entertainment",
      park: "outdoor",
      gym: "services",
      spa: "services",
    };

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type];
      }
    }
    return "services"; // default
  };

  // Add place as recommendation
  const addPlaceAsRecommendation = async (place: PlacesResult) => {
    try {
      const category = getCategoryFromTypes(place.types);

      const newRecommendation = {
        name: place.name,
        category,
        address: place.formatted_address,
        coordinates: place.geometry.location,
        description: `Found via Google Places - ${place.types
          .slice(0, 3)
          .join(", ")}`,
        rating: place.rating || 0,
        website: place.website || null,
        phone_number: place.formatted_phone_number || null,
        images: [], // ← Keep this empty
        place_id: place.place_id, // ← This is what matters
        property_id: currentProperty?.id || null, // ← Use currentProperty
        is_recommended: true,
      };

      const { data, error } = await supabase
        .from("recommendations")
        .insert([newRecommendation])
        .select()
        .single();

      if (error) throw error;

      setRecommendations((prev) => [data, ...prev]);
      setSelectedPlace(null);
      setPlacesSearchTerm("");
      alert("✅ Place added as recommendation!");
    } catch (error) {
      console.error("Error adding recommendation:", error);
      alert(`Failed to add recommendation: ${error.message}`);
    }
  };

  // Delete functions
  const deleteRecommendation = async (recommendationId: string) => {
    try {
      setDeletingId(recommendationId);

      const { error } = await supabase
        .from("recommendations")
        .delete()
        .eq("id", recommendationId);

      if (error) throw error;

      setRecommendations((prev) =>
        prev.filter((rec) => rec.id !== recommendationId)
      );
      setShowDeleteModal(false);
      setRecommendationToDelete(null);
      alert("✅ Recommendation deleted successfully!");
    } catch (error) {
      console.error("Error deleting recommendation:", error);
      alert(`Failed to delete recommendation: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (recommendation: Recommendation) => {
    setRecommendationToDelete(recommendation);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setRecommendationToDelete(null);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : i < rating
            ? "text-yellow-400 fill-current opacity-50"
            : "text-gray-300"
        }`}
      />
    ));
  };

  // Add manual recommendation
  const addManualRecommendation = async () => {
    try {
      const newRecommendation = {
        ...manualForm,
        coordinates: currentProperty?.coordinates || {
          lat: 40.7128,
          lng: -74.006,
        },
        images: [],
        property_id: currentProperty?.id || null, // ← Use currentProperty
        is_recommended: true,
      };

      const { data, error } = await supabase
        .from("recommendations")
        .insert([newRecommendation])
        .select()
        .single();

      if (error) throw error;

      setRecommendations((prev) => [data, ...prev]);
      setShowManualModal(false);
      setManualForm({
        name: "",
        category: "restaurant",
        address: "",
        description: "",
        rating: 5,
        website: "",
        phone_number: "",
      });
      alert("✅ Recommendation added successfully!");
    } catch (error) {
      console.error("Error adding manual recommendation:", error);
      alert(`Failed to add recommendation: ${error.message}`);
    }
  };

  // Handle place selection from GooglePlacesSearch
  const handlePlaceSelect = (place: PlacesResult) => {
    setSelectedPlace(place);
    setPlacesLoading(false);
  };

  return (
    <ProtectedPageWrapper>
      <Header title="Recommendations" /> {/* ✅ Add Header component */}
      <PageContainer>
        {" "}
        {/* ✅ Add PageContainer wrapper */}
        <div className="space-y-6">
          <RecommendationFilters
            recommendations={recommendations}
            setFilteredRecommendations={setFilteredRecommendations}
          />

          <StandardCard
            title={`${filteredRecommendations.length} Recommendation${
              filteredRecommendations.length !== 1 ? "s" : ""
            }`}
            subtitle="Browse your curated local recommendations"
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecommendations.map((rec) => {
                  // Add this debug logging
                  console.log(`🔍 Recommendation "${rec.name}":`, {
                    images: rec.images,
                    imageCount: rec.images?.length || 0,
                    firstImage: rec.images?.[0],
                    hasImages: !!(rec.images && rec.images.length > 0),
                  });

                  const categories = [
                    { id: "all", name: "All Categories", icon: "🏪" },
                    { id: "restaurant", name: "Restaurants", icon: "🍽️" },
                    { id: "grocery", name: "Grocery", icon: "🛒" },
                    { id: "entertainment", name: "Entertainment", icon: "🎭" },
                    { id: "healthcare", name: "Healthcare", icon: "🏥" },
                    { id: "shopping", name: "Shopping", icon: "🛍️" },
                    { id: "services", name: "Services", icon: "🔧" },
                    { id: "outdoor", name: "Outdoor", icon: "🌲" },
                    { id: "emergency", name: "Emergency", icon: "🚨" },
                  ];
                  const category = categories.find(
                    (c) => c.id === rec.category
                  );

                  return (
                    <div
                      key={rec.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow relative group"
                    >
                      {/* DELETE BUTTON - Appears on hover */}
                      <button
                        onClick={() => confirmDelete(rec)}
                        className="absolute top-2 right-2 z-10 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
                        title="Delete recommendation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="h-48 relative">
                        {rec.place_id ? (
                          <DynamicGooglePlacePhoto
                            placeId={rec.place_id}
                            alt={rec.name}
                            width={400}
                            height={300}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <span className="text-4xl">
                              {category?.icon || "📍"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg pr-2">
                            {rec.name}
                          </h3>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded flex-shrink-0">
                            {category?.name || rec.category}
                          </span>
                        </div>

                        <div className="flex items-center mb-2">
                          <div className="flex items-center mr-2">
                            {renderStars(rec.rating)}
                          </div>
                          <span className="text-sm text-gray-600">
                            {rec.rating.toFixed(1)}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {rec.description}
                        </p>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{rec.address}</span>
                          </div>

                          {rec.phone_number && (
                            <div className="flex items-center text-gray-600">
                              <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                              <a
                                href={`tel:${rec.phone_number}`}
                                className="hover:text-blue-600"
                              >
                                {rec.phone_number}
                              </a>
                            </div>
                          )}

                          {rec.website && (
                            <div className="flex items-center text-gray-600">
                              <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                              <a
                                href={rec.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-600 truncate"
                              >
                                Visit Website
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            Added{" "}
                            {new Date(rec.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                          <div className="flex items-center space-x-2">
                            <a
                              href={
                                rec.place_id
                                  ? `https://www.google.com/maps/place/?q=place_id:${rec.place_id}`
                                  : `https://www.google.com/maps/search/${encodeURIComponent(
                                      rec.name + " " + rec.address
                                    )}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                            >
                              <Globe className="h-3 w-3 mr-1" />
                              View on Google
                            </a>
                          </div>
                        </div>

                        {/* Comments Component */}
                        <RecommendationComments
                          recommendationId={rec.id}
                          recommendationName={rec.name}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No recommendations found</p>
                <p className="text-sm mt-1 mb-4">
                  Try adjusting your filters or add new recommendations
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowGoogleSearchModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Find with Google
                  </button>
                  <button
                    onClick={() => setShowManualModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manually
                  </button>
                </div>
              </div>
            )}
          </StandardCard>

          {/* FLOATING ACTION BUTTON - Similar to tasks */}
          <MultiActionPattern
            actions={[
              {
                icon: Search,
                label: "Find with Google",
                onClick: () => setShowGoogleSearchModal(true), // ✅ Open modal instead
                variant: "secondary",
              },
              {
                icon: Plus,
                label: "Add Manually",
                onClick: () => setShowManualModal(true),
                variant: "primary",
              },
            ]}
          />

          {/* Manual Add Modal - keep existing */}
          {showManualModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add Manual Recommendation
                  </h3>
                  <button
                    onClick={() => setShowManualModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Place Name *
                    </label>
                    <input
                      type="text"
                      value={manualForm.name}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Joe's Coffee Shop"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={manualForm.category}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories
                        .filter((c) => c.id !== "all")
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={manualForm.address}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123 Main St, City, State"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={manualForm.description}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of this place..."
                      rows={3}
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rating (1-5 stars)
                    </label>
                    <select
                      value={manualForm.rating}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          rating: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ 5 stars</option>
                      <option value={4}>⭐⭐⭐⭐ 4 stars</option>
                      <option value={3}>⭐⭐⭐ 3 stars</option>
                      <option value={2}>⭐⭐ 2 stars</option>
                      <option value={1}>⭐ 1 star</option>
                    </select>
                  </div>

                  {/* Phone (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={manualForm.phone_number}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          phone_number: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  {/* Website (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website (optional)
                    </label>
                    <input
                      type="url"
                      value={manualForm.website}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          website: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowManualModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addManualRecommendation}
                    disabled={!manualForm.name || !manualForm.address}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recommendation
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal - keep existing */}
          {showDeleteModal && recommendationToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center mb-4">
                  <Trash2 className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Recommendation
                  </h3>
                </div>

                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete &quot;
                  {recommendationToDelete.name}&quot;? This action cannot be
                  undone.
                </p>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      deleteRecommendation(recommendationToDelete.id)
                    }
                    disabled={deletingId === recommendationToDelete.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {deletingId === recommendationToDelete.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Google Places Search Modal */}
          {showGoogleSearchModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Find Places with Google
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Search for local businesses and add them to your
                      recommendations
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowGoogleSearchModal(false);
                      setSelectedPlace(null);
                      setPlacesSearchTerm("");
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <span className="text-xl">✕</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Google Places Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search for places
                    </label>
                    <GooglePlacesSearch
                      onPlaceSelect={handlePlaceSelect}
                      placeholder="Search for restaurants, stores, services..."
                      propertyLocation={currentProperty?.coordinates}
                      showDetails={true}
                      className="w-full"
                    />
                  </div>

                  {/* Loading State */}
                  {placesLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">
                        Loading place details...
                      </span>
                    </div>
                  )}

                  {/* Selected Place Preview */}
                  {selectedPlace && !placesLoading && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                        Selected Place
                      </h4>

                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-gray-900 text-lg">
                            {selectedPlace.name}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {selectedPlace.formatted_address}
                          </p>
                        </div>

                        {/* Place Details */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {selectedPlace.rating && (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                              <span>{selectedPlace.rating} stars</span>
                            </div>
                          )}

                          {selectedPlace.price_level && (
                            <div className="flex items-center">
                              <span className="text-green-600 font-medium">
                                {"$".repeat(selectedPlace.price_level)}
                              </span>
                              <span className="ml-1">price level</span>
                            </div>
                          )}

                          {selectedPlace.opening_hours?.open_now !==
                            undefined && (
                            <div
                              className={`flex items-center ${
                                selectedPlace.opening_hours.open_now
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full mr-2 ${
                                  selectedPlace.opening_hours.open_now
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              ></div>
                              {selectedPlace.opening_hours.open_now
                                ? "Open now"
                                : "Currently closed"}
                            </div>
                          )}
                        </div>

                        {/* Categories */}
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Categories:</span>{" "}
                          {selectedPlace.types.slice(0, 4).join(", ")}
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-1">
                          {selectedPlace.formatted_phone_number && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2" />
                              <a
                                href={`tel:${selectedPlace.formatted_phone_number}`}
                                className="hover:text-blue-600"
                              >
                                {selectedPlace.formatted_phone_number}
                              </a>
                            </div>
                          )}

                          {selectedPlace.website && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Globe className="h-4 w-4 mr-2" />
                              <a
                                href={selectedPlace.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-600 truncate"
                              >
                                Visit Website
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => {
                      setShowGoogleSearchModal(false);
                      setSelectedPlace(null);
                      setPlacesSearchTerm("");
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>

                  {selectedPlace && (
                    <button
                      onClick={() => {
                        addPlaceAsRecommendation(selectedPlace);
                        setShowGoogleSearchModal(false);
                        setSelectedPlace(null);
                        setPlacesSearchTerm("");
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add as Recommendation
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </PageContainer>{" "}
      {/* ✅ Close PageContainer */}
    </ProtectedPageWrapper>
  );
}
