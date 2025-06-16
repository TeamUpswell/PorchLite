"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  MapPin,
  Star,
  Trash2,
  Search,
  MessageCircle,
  Users,
  Clock,
} from "lucide-react";
import GooglePlacesSearch, {
  useGooglePlacesSearch,
} from "@/components/ui/GooglePlacesSearch";
import { createBrowserClient } from "@supabase/ssr";

// ✅ Fix: Debug utility with proper ESLint handling
const debug = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(message, ...args);
  }
};

// Unified interface that matches Google Maps API structure
interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string; // Optional like Google Maps
  vicinity?: string;
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
  rating?: number;
  website?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  // Custom properties for your app
  category?: string;
  guest_rating?: number;
  guest_notes?: string;
  existing_recommendation_id?: string;
  is_new_recommendation?: boolean;
}

interface ExistingRecommendation {
  id: string;
  name: string;
  category: string;
  address: string;
  rating: number;
  place_id?: string;
  guest_reviews?: {
    guest_name: string;
    guest_rating: number;
    guest_notes: string;
    visit_date: string;
  }[];
  total_reviews: number;
  average_guest_rating: number;
  created_at: string;
}

interface RecommendationsStepProps {
  formData: {
    recommendations: {
      name: string;
      category: string;
      address: string;
      coordinates: { lat: number; lng: number };
      description: string;
      rating: number;
      website?: string;
      phone_number?: string;
      place_id?: string;
      guest_rating: number;
      guest_notes: string;
      existing_recommendation_id?: string;
      is_new_recommendation?: boolean;
    }[];
  };
  updateFormData: (updates: any) => void;
  property?: any;
}

export default function RecommendationsStep({
  formData,
  updateFormData,
  property,
}: RecommendationsStepProps) {
  const { selectedPlace, setSelectedPlace, clearSelection } =
    useGooglePlacesSearch();
  const [existingRecommendation, setExistingRecommendation] =
    useState<ExistingRecommendation | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [guestRating, setGuestRating] = useState(5);
  const [guestNotes, setGuestNotes] = useState("");
  const [recommendations, setRecommendations] = useState<GuestRecommendation[]>([]);

  // Create Supabase client using new @supabase/ssr package
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const categories = [
    { id: "restaurant", name: "Restaurants", icon: "🍽️" },
    { id: "grocery", name: "Grocery", icon: "🛒" },
    { id: "entertainment", name: "Entertainment", icon: "🎭" },
    { id: "healthcare", name: "Healthcare", icon: "🏥" },
    { id: "shopping", name: "Shopping", icon: "🛍️" },
    { id: "services", name: "Services", icon: "🔧" },
    { id: "outdoor", name: "Outdoor", icon: "🌲" },
    { id: "emergency", name: "Emergency", icon: "🚨" },
  ];

  // ✅ Fix: Helper function to convert Google Maps result to LocalPlaceResult
  const convertGooglePlaceToLocal = (googlePlace: any): PlaceResult => {
    const location = googlePlace.geometry?.location;
    
    return {
      place_id: googlePlace.place_id || '',
      name: googlePlace.name || '',
      formatted_address: googlePlace.formatted_address, // Keep as optional
      vicinity: googlePlace.vicinity,
      rating: googlePlace.rating,
      website: googlePlace.website,
      formatted_phone_number: googlePlace.formatted_phone_number,
      international_phone_number: googlePlace.international_phone_number,
      types: googlePlace.types || [],
      geometry: location ? {
        location: {
          lat: typeof location.lat === 'function' ? location.lat() : location.lat,
          lng: typeof location.lng === 'function' ? location.lng() : location.lng,
        }
      } : undefined,
    };
  };

  // Check for existing recommendations when a place is selected from Google
  const checkForExistingRecommendation = async (
    placeId: string,
    placeName: string
  ) => {
    if (!property?.id) return null;

    setCheckingExisting(true);
    try {
      const query = supabase
        .from("recommendations")
        .select(
          `
          id,
          name,
          category,
          address,
          rating,
          place_id,
          created_at,
          guest_recommendations(
            guest_rating,
            guest_notes,
            guest_book_entries(
              guest_name,
              visit_date
            )
          )
        `
        )
        .eq("property_id", property.id)
        .eq("is_recommended", true);

      if (placeId) {
        const { data: placeIdData, error: placeIdError } = await query.eq(
          "place_id",
          placeId
        );

        if (!placeIdError && placeIdData && placeIdData.length > 0) {
          return processRecommendationData(placeIdData[0]);
        }
      }

      const { data: nameData, error: nameError } = await query.ilike(
        "name",
        `%${placeName}%`
      );

      if (!nameError && nameData && nameData.length > 0) {
        return processRecommendationData(nameData[0]);
      }

      return null;
    } catch (error) {
      debug("Error checking existing recommendations:", error);
      return null;
    } finally {
      setCheckingExisting(false);
    }
  };

  const processRecommendationData = (rec: any): ExistingRecommendation => {
    const guestReviews =
      rec.guest_recommendations?.map((gr: any) => ({
        guest_name: gr.guest_book_entries?.guest_name || "Anonymous",
        guest_rating: gr.guest_rating,
        guest_notes: gr.guest_notes,
        visit_date: gr.guest_book_entries?.visit_date || "",
      })) || [];

    const avgRating =
      guestReviews.length > 0
        ? guestReviews.reduce(
            (sum: number, review: any) => sum + review.guest_rating,
            0
          ) / guestReviews.length
        : 0;

    return {
      id: rec.id,
      name: rec.name,
      category: rec.category,
      address: rec.address,
      rating: rec.rating,
      place_id: rec.place_id,
      guest_reviews: guestReviews,
      total_reviews: guestReviews.length,
      average_guest_rating: avgRating,
      created_at: rec.created_at,
    };
  };

  const getCategoryFromTypes = (types: string[]): string => {
    const typeMap: Record<string, string> = {
      restaurant: "restaurant",
      food: "restaurant",
      meal_takeaway: "restaurant",
      meal_delivery: "restaurant",
      cafe: "restaurant",
      bakery: "restaurant",
      bar: "restaurant",
      grocery_or_supermarket: "grocery",
      supermarket: "grocery",
      convenience_store: "grocery",
      shopping_mall: "shopping",
      clothing_store: "shopping",
      department_store: "shopping",
      store: "shopping",
      tourist_attraction: "entertainment",
      amusement_park: "entertainment",
      zoo: "entertainment",
      museum: "entertainment",
      park: "outdoor",
      campground: "outdoor",
      rv_park: "outdoor",
      hospital: "healthcare",
      pharmacy: "healthcare",
      dentist: "healthcare",
      doctor: "healthcare",
      gas_station: "services",
      car_rental: "services",
      bank: "services",
      atm: "services",
    };

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type];
      }
    }
    return "services";
  };

  // ✅ Fix: Updated to handle the type conversion properly
  const handleGooglePlaceSelect = async (place: any) => {
    debug("Selected place from Google:", place);

    // Convert Google place to local format
    const localPlace = convertGooglePlaceToLocal(place);
    setSelectedPlace(localPlace);

    // Check for existing recommendation
    const existing = await checkForExistingRecommendation(
      localPlace.place_id,
      localPlace.name
    );
    debug("Existing recommendation found:", existing);

    setExistingRecommendation(existing);
    setGuestRating(5);
    setGuestNotes("");
  };

  const addRecommendation = () => {
    if (!selectedPlace) return;
    if (!guestNotes.trim()) {
      return;
    }

    const detectedCategory = getCategoryFromTypes(selectedPlace.types || []);

    const newRecommendation = {
      name: selectedPlace.name,
      category: detectedCategory,
      address: selectedPlace.formatted_address || selectedPlace.vicinity || "",
      coordinates: {
        lat: selectedPlace.geometry?.location?.lat || 0,
        lng: selectedPlace.geometry?.location?.lng || 0,
      },
      description: existingRecommendation
        ? `Google Place: ${selectedPlace.types?.slice(0, 3).join(", ") || ""}`
        : `Found via Google Places - ${
            selectedPlace.types?.slice(0, 3).join(", ") || ""
          }`,
      rating: selectedPlace.rating || 0,
      website: selectedPlace.website || "",
      phone_number:
        selectedPlace.formatted_phone_number ||
        selectedPlace.international_phone_number ||
        "",
      place_id: selectedPlace.place_id,
      guest_rating: guestRating,
      guest_notes: guestNotes,
      existing_recommendation_id: existingRecommendation?.id,
      is_new_recommendation: !existingRecommendation,
    };

    setRecommendations(prev => [...prev, newRecommendation]);

    updateFormData({
      recommendations: [...formData.recommendations, newRecommendation],
    });

    // Reset form
    setSelectedPlace(null);
    setExistingRecommendation(null);
    setGuestRating(5);
    setGuestNotes("");
    clearSelection();
  };

  const removeRecommendation = (index: number) => {
    const updated = formData.recommendations.filter((_, i) => i !== index);
    updateFormData({ recommendations: updated });
  };

  const renderStars = (
    rating: number,
    onRatingChange?: (rating: number) => void,
    size: "sm" | "md" = "sm"
  ) => {
    const starSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onRatingChange?.(i + 1)}
        className={`${onRatingChange ? "cursor-pointer" : "cursor-default"} ${
          i < rating ? "text-yellow-400" : "text-gray-300"
        }`}
        disabled={!onRatingChange}
        title={`Rate ${i + 1} star${i + 1 !== 1 ? 's' : ''}`}
        aria-label={`Rate ${i + 1} star${i + 1 !== 1 ? 's' : ''}`}
      >
        <Star className={`${starSize} ${i < rating ? "fill-current" : ""}`} />
      </button>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Places you discovered
        </h2>
        <p className="text-gray-600">
          Help future guests by sharing your favorite local spots
        </p>
      </div>

      {/* Google Places Search */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Search for a place to recommend
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Search className="inline h-4 w-4 mr-1" />
            Search Google Places
          </label>
          <GooglePlacesSearch
            onPlaceSelect={handleGooglePlaceSelect}
            placeholder="Search for restaurants, shops, attractions, etc..."
            propertyLocation={property?.coordinates || property?.address}
            radius={50000}
            showDetails={true}
            excludeTypes={[
              "street_address",
              "route",
              "postal_code",
              "country",
              "administrative_area_level_1",
              "administrative_area_level_2",
              "locality",
              "sublocality",
              "neighborhood",
              "premise",
              "subpremise",
              "natural_feature",
              "political",
            ]}
            searchOptions={{
              strictBounds: false,
              locationBias: property?.coordinates || property?.address,
            }}
            filterResults={(results: any[]) => {
              return results.filter((place: any) => {
                const types = place.types || [];

                const excludeTypes = [
                  "street_address",
                  "route",
                  "postal_code",
                  "country",
                  "administrative_area_level_1",
                  "administrative_area_level_2",
                  "locality",
                  "sublocality",
                  "neighborhood",
                  "premise",
                  "subpremise",
                  "natural_feature",
                  "political",
                ];

                const hasExcludedType = types.some((type: string) =>
                  excludeTypes.includes(type)
                );
                if (hasExcludedType) return false;

                const businessTypes = [
                  "establishment",
                  "point_of_interest",
                  "store",
                  "restaurant",
                  "food",
                  "lodging",
                  "tourist_attraction",
                  "shopping_mall",
                  "hospital",
                  "school",
                  "bank",
                  "gas_station",
                ];

                const hasBusinessType = types.some((type: string) =>
                  businessTypes.includes(type)
                );

                const propertyName = property?.name?.toLowerCase() || "";
                const propertyAddress = property?.address?.toLowerCase() || "";
                const placeName = place.name?.toLowerCase() || "";
                const placeAddress =
                  place.formatted_address?.toLowerCase() || "";

                if (propertyName && placeName.includes(propertyName))
                  return false;
                if (propertyAddress && placeAddress === propertyAddress)
                  return false;

                return hasBusinessType;
              });
            }}
          />

          {checkingExisting && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              🔍 Checking if this place has been recommended before...
            </div>
          )}

          {selectedPlace && existingRecommendation && (
            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-blue-900 flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    This place has been recommended before!
                  </h4>
                  <p className="text-sm text-blue-700">
                    {existingRecommendation.total_reviews} guest
                    {existingRecommendation.total_reviews !== 1
                      ? "s have"
                      : " has"}{" "}
                    recommended this place
                  </p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    First recommended{" "}
                    {formatDate(existingRecommendation.created_at)}
                  </p>
                </div>
                {existingRecommendation.average_guest_rating > 0 && (
                  <div className="text-right">
                    <div className="flex items-center">
                      {renderStars(
                        Math.round(existingRecommendation.average_guest_rating)
                      )}
                      <span className="ml-1 text-sm text-blue-700">
                        {existingRecommendation.average_guest_rating.toFixed(1)}
                        /5
                      </span>
                    </div>
                    <p className="text-xs text-blue-600">Guest average</p>
                  </div>
                )}
              </div>

              {existingRecommendation.guest_reviews &&
                existingRecommendation.guest_reviews.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-blue-900">
                      Recent guest comments:
                    </h5>
                    {existingRecommendation.guest_reviews
                      .slice(0, 3)
                      .map((review, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2 rounded border border-blue-200"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-medium text-gray-700">
                              {review.guest_name}
                            </span>
                            <div className="flex items-center">
                              {renderStars(review.guest_rating)}
                              <span className="ml-1 text-xs text-gray-600">
                                {review.guest_rating}/5
                              </span>
                            </div>
                          </div>
                          {review.guest_notes && (
                            <p className="text-xs text-gray-600 italic">
                              &ldquo;{review.guest_notes}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    {existingRecommendation.guest_reviews.length > 3 && (
                      <p className="text-xs text-blue-600">
                        ...and {existingRecommendation.guest_reviews.length - 3}{" "}
                        more review
                        {existingRecommendation.guest_reviews.length - 3 !== 1
                          ? "s"
                          : ""}
                      </p>
                    )}
                  </div>
                )}

              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800 font-medium">
                  ✓ Add your own experience to this recommendation
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Your rating and comments will be added to help future guests
                </p>
              </div>
            </div>
          )}

          {selectedPlace && !existingRecommendation && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-green-800">
                    ✓ New place discovered!
                  </p>
                  <p className="text-green-700">{selectedPlace.name}</p>
                  <p className="text-green-600">
                    {selectedPlace.formatted_address || selectedPlace.vicinity}
                  </p>
                  {selectedPlace.rating && (
                    <p className="text-green-600">
                      Google Rating: {selectedPlace.rating}★
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2 p-2 bg-white border border-green-200 rounded">
                <p className="text-xs text-green-700 font-medium">
                  You&apos;ll be the first guest to recommend this place! 🎉
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rating and Notes - show when a place is selected */}
        {selectedPlace && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating
              </label>
              <div className="flex items-center space-x-1">
                {renderStars(guestRating, setGuestRating, "md")}
                <span className="ml-2 text-sm text-gray-600">
                  {guestRating} star{guestRating !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {existingRecommendation
                  ? "Add Your Experience"
                  : "Your Experience & Tips"}
              </label>
              <textarea
                value={guestNotes}
                onChange={(e) => setGuestNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  existingRecommendation
                    ? "What was your experience like? Any tips to add to this recommendation?"
                    : "What made this place special? Any tips for future guests?"
                }
                required
              />
              {!guestNotes.trim() && (
                <p className="mt-1 text-sm text-red-600">
                  Please add your experience or notes about this place
                </p>
              )}
            </div>

            <button
              onClick={addRecommendation}
              disabled={!selectedPlace || !guestNotes.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              title={!guestNotes.trim() ? "Please add your experience first" : undefined}
            >
              <Plus className="h-4 w-4 mr-2" />
              {existingRecommendation
                ? "Add Your Review"
                : "Add Recommendation"}
            </button>
          </>
        )}
      </div>

      {/* Show Added Recommendations */}
      {formData.recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Your Recommendations ({formData.recommendations.length})
          </h3>

          {formData.recommendations.map((rec, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{rec.name}</h4>
                  <p className="text-sm text-gray-600 capitalize flex items-center">
                    {categories.find((c) => c.id === rec.category)?.icon}{" "}
                    {categories.find((c) => c.id === rec.category)?.name}
                    {rec.place_id && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        <Search className="h-3 w-3 mr-1" />
                        Google Verified
                      </span>
                    )}
                    {!rec.is_new_recommendation && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Adding Review
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => removeRecommendation(index)}
                  className="text-red-600 hover:text-red-800"
                  title="Remove recommendation"
                  aria-label="Remove recommendation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {rec.address && (
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {rec.address}
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {renderStars(rec.guest_rating)}
                  <span className="ml-2 text-sm text-gray-600">
                    Your rating: {rec.guest_rating}/5
                  </span>
                </div>
                {rec.rating > 0 && (
                  <div className="text-sm text-gray-500">
                    Google: {rec.rating}★
                  </div>
                )}
              </div>

              {rec.guest_notes && (
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                  &ldquo;{rec.guest_notes}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {formData.recommendations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No recommendations added yet.</p>
          <p className="text-sm">Search for places above to get started!</p>
        </div>
      )}
    </div>
  );
}
