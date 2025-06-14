"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import GoogleMapComponent from "@/components/GoogleMapComponent";
import { loadMapsApi } from "@/lib/googleMaps";
import {
  MapPin,
  Check,
  AlertCircle,
  Home as HomeIcon,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

// Google Places types
declare global {
  interface Window {
    google: any;
  }
}

interface PlaceResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export default function CreatePropertyPage() {
  // ✅ ALL HOOKS FIRST
  const { user, loading: authLoading } = useAuth();
  const { currentTenant, loading: propertyLoading } = useProperty();
  const router = useRouter();

  // Add ref for cleanup
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [mapsApiReady, setMapsApiReady] = useState(false); // ✅ FIXED: Better API ready tracking
  const [isLoading, setIsLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null); // ✅ FIXED: Added missing state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressValidated, setAddressValidated] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    latitude: null as number | null,
    longitude: null as number | null,
    place_id: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  // ✅ MOUNT EFFECT WITH API LOADING
  useEffect(() => {
    setIsMounted(true);
    
    // Load Maps API on mount
    const initMapsApi = async () => {
      try {
        await loadMapsApi();
        setMapsApiReady(true);
      } catch (error) {
        console.error("Failed to load Google Maps API:", error);
      }
    };
    
    initMapsApi();

    return () => {
      // Cleanup timeout on unmount
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // ✅ CLICK OUTSIDE TO CLOSE SUGGESTIONS
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSuggestions) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  // ✅ FIXED ADDRESS SEARCH WITH PROPER DEBOUNCING
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    if (!mapsApiReady) {
      console.warn("Google Maps API not ready yet");
      return;
    }

    try {
      const service = new window.google.maps.places.AutocompleteService();

      service.getPlacePredictions(
        {
          input: query,
          types: ["address"],
          componentRestrictions: { country: "US" },
        },
        (predictions: any[], status: any) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            const detailedPlaces: PlaceResult[] = [];
            let completed = 0;

            predictions.forEach((prediction) => {
              const service = new window.google.maps.places.PlacesService(
                document.createElement("div")
              );

              service.getDetails(
                {
                  placeId: prediction.place_id,
                  fields: [
                    "place_id",
                    "formatted_address",
                    "geometry",
                    "address_components",
                  ],
                },
                (place: any, status: any) => {
                  completed++;
                  if (
                    status === window.google.maps.places.PlacesServiceStatus.OK &&
                    place
                  ) {
                    detailedPlaces.push(place as PlaceResult);
                  }

                  // Update suggestions when all requests complete
                  if (completed === predictions.length) {
                    setAddressSuggestions(detailedPlaces);
                  }
                }
              );
            });
          } else {
            setAddressSuggestions([]);
          }
        }
      );
    } catch (error) {
      console.error("Error searching addresses:", error);
      toast.error("Error searching addresses");
    }
  }, [mapsApiReady]);

  const handleAddressChange = (value: string) => {
    setFormData({ ...formData, address: value });
    setAddressValidated(false);
    setSelectedPlace(null);
    setShowSuggestions(true);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      searchAddresses(value);
    }, 300);
  };

  const handleAddressSelect = (place: PlaceResult) => {
    const addressComponents = place.address_components;
    const getComponent = (type: string) => {
      const component = addressComponents.find((comp) =>
        comp.types.includes(type)
      );
      return component ? component.long_name : "";
    };

    setFormData({
      ...formData,
      address: place.formatted_address,
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
      place_id: place.place_id,
      city:
        getComponent("locality") || getComponent("administrative_area_level_2"),
      state: getComponent("administrative_area_level_1"),
      zip: getComponent("postal_code"),
      country: getComponent("country"),
    });

    setSelectedPlace(place);
    setAddressValidated(true);
    setShowSuggestions(false);
    setAddressSuggestions([]);
    toast.success("Address verified!");
  };

  // ✅ HANDLE FORM SUBMISSION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addressValidated) {
      toast.error("Please select a valid address from the suggestions");
      return;
    }

    setIsLoading(true);
    try {
      const propertyData = {
        name: formData.name.trim(),
        address: formData.address,
        description: formData.description.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        place_id: formData.place_id,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        tenant_id: currentTenant?.tenant_id || null,
        created_by: user?.id,
      };

      const { data, error } = await supabase
        .from("properties")
        .insert([propertyData])
        .select()
        .single();

      if (error) {
        console.error("Property creation error:", error);
        throw error;
      }

      toast.success(`Property "${formData.name}" created successfully!`);
      router.push(`/properties/${data.id}`);
    } catch (error: any) {
      console.error("Error creating property:", error);
      toast.error(`Failed to create property: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ EARLY RETURNS AFTER ALL HOOKS
  if (authLoading || propertyLoading) {
    return (
      <div className="p-6">
        <Header title="Create Property" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600">
                  {authLoading ? "Authenticating..." : "Loading..."}
                </p>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isMounted) {
    return (
      <div className="p-6">
        <Header title="Create Property" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600">Initializing...</p>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header
        title="Create Property"
        showBack={true}
        onBack={() => router.push("/properties")}
      />
      <PageContainer>
        <div className="max-w-2xl mx-auto space-y-6">
          <StandardCard
            title="New Property Details"
            subtitle="Add a new property to your portfolio"
          >
            {/* ✅ ADDED: Maps API Loading Indicator */}
            {!mapsApiReady && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                  <p className="text-sm text-blue-800">
                    Loading Google Maps... Address validation will be available shortly.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., Mountain Cabin, Beach House, Downtown Condo"
                  required
                  maxLength={100}
                />
              </div>

              {/* Property Address */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Address *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      addressValidated
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Start typing the full property address..."
                    required
                    disabled={!mapsApiReady} // ✅ FIXED: Better disabled check
                  />

                  {/* Validation indicator */}
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    {addressValidated ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      formData.address && (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )
                    )}
                  </div>
                </div>

                {/* Address suggestions dropdown */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {addressSuggestions.map((place) => (
                      <button
                        key={place.place_id}
                        type="button"
                        onClick={() => handleAddressSelect(place)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-gray-900">
                            {place.formatted_address}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Validation messages */}
                {formData.address && !addressValidated && mapsApiReady && (
                  <p className="mt-2 text-sm text-yellow-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Please select an address from the suggestions for accurate location data
                  </p>
                )}

                {addressValidated && (
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    Address verified and location data captured
                  </p>
                )}
              </div>

              {/* Location Details */}
              {addressValidated && formData.latitude && formData.longitude && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800 mb-3 flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    Location Details Verified
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-green-700">
                      <span className="font-medium">City:</span>{" "}
                      {formData.city || "N/A"}
                    </div>
                    <div className="text-green-700">
                      <span className="font-medium">State:</span>{" "}
                      {formData.state || "N/A"}
                    </div>
                    <div className="text-green-700">
                      <span className="font-medium">ZIP:</span>{" "}
                      {formData.zip || "N/A"}
                    </div>
                    <div className="text-green-700">
                      <span className="font-medium">Country:</span>{" "}
                      {formData.country || "N/A"}
                    </div>
                    <div className="col-span-2 text-xs text-green-600 font-mono">
                      Coordinates: {formData.latitude.toFixed(6)},{" "}
                      {formData.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>
              )}

              {/* Property Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                  <span className="text-gray-500 font-normal"> (Optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={4}
                  placeholder="Describe your property, amenities, special features, or any other details..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional description to help identify and manage this property (max 500 characters)
                </p>
              </div>

              {/* Show map preview when address is validated */}
              {addressValidated && formData.latitude && formData.longitude && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Location Preview
                  </h3>
                  <div className="h-48 w-full">
                    <GoogleMapComponent
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      address={formData.address}
                      zoom={16}
                      className="border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/properties")}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isLoading || !addressValidated || !formData.name.trim()
                  }
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Property...
                    </>
                  ) : (
                    <>
                      <HomeIcon className="h-4 w-4 mr-2" />
                      Create Property
                    </>
                  )}
                </button>
              </div>
            </form>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
