"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/hooks/useTenant";
import { supabase } from "@/lib/supabase";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { MapPin, Check, AlertCircle } from "lucide-react";

// Google Places types
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
  const router = useRouter();
  const { currentTenant } = useTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressValidated, setAddressValidated] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    // Additional fields for validated address
    latitude: null as number | null,
    longitude: null as number | null,
    place_id: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  // Debounced address search
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const service = new window.google.maps.places.AutocompleteService();
      
      service.getPlacePredictions(
        {
          input: query,
          types: ['address'],
          componentRestrictions: { country: 'US' }, // Adjust as needed
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            // Get detailed place information
            const detailedPlaces: PlaceResult[] = [];
            
            predictions.forEach((prediction, index) => {
              const service = new window.google.maps.places.PlacesService(
                document.createElement('div')
              );
              
              service.getDetails(
                {
                  placeId: prediction.place_id,
                  fields: ['place_id', 'formatted_address', 'geometry', 'address_components'],
                },
                (place, status) => {
                  if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                    detailedPlaces.push(place as PlaceResult);
                    
                    // Update suggestions when all results are loaded
                    if (detailedPlaces.length === predictions.length) {
                      setAddressSuggestions(detailedPlaces);
                    }
                  }
                }
              );
            });
          }
        }
      );
    } catch (error) {
      console.error('Error searching addresses:', error);
    }
  }, []);

  // Handle address input change
  const handleAddressChange = (value: string) => {
    setFormData({ ...formData, address: value });
    setAddressValidated(false);
    setSelectedPlace(null);
    setShowSuggestions(true);
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      searchAddresses(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  // Handle address selection
  const handleAddressSelect = (place: PlaceResult) => {
    // Extract address components
    const addressComponents = place.address_components;
    const getComponent = (type: string) => {
      const component = addressComponents.find(comp => comp.types.includes(type));
      return component ? component.long_name : '';
    };

    setFormData({
      ...formData,
      address: place.formatted_address,
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
      place_id: place.place_id,
      city: getComponent('locality') || getComponent('administrative_area_level_2'),
      state: getComponent('administrative_area_level_1'),
      zip: getComponent('postal_code'),
      country: getComponent('country'),
    });

    setSelectedPlace(place);
    setAddressValidated(true);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTenant) {
      alert("Please select a property portfolio first");
      return;
    }

    if (!addressValidated) {
      alert("Please select a valid address from the suggestions");
      return;
    }

    setIsLoading(true);
    try {
      const propertyData = {
        name: formData.name,
        address: formData.address,
        description: formData.description,
        latitude: formData.latitude,
        longitude: formData.longitude,
        place_id: formData.place_id,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        tenant_id: currentTenant.id,
        created_by: currentTenant.owner_user_id,
      };

      console.log("Property data to insert:", propertyData);

      const { data, error } = await supabase
        .from("properties")
        .insert([propertyData])
        .select()
        .single();

      if (error) {
        console.error("Property creation error:", error);
        throw error;
      }

      console.log("Property created:", data);
      router.push(`/properties/${data.id}`);
    } catch (error) {
      console.error("Error creating property:", error);
      alert(`Failed to create property: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Property</h1>
        
        {!currentTenant && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">Please select a property portfolio first</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Property Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Mountain Cabin, Beach House"
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-1">Property Address</label>
            <div className="relative">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  addressValidated ? 'border-green-500' : 'border-gray-300'
                }`}
                placeholder="Start typing the property address..."
                required
              />
              
              {/* Validation indicator */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {addressValidated ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : formData.address && (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            </div>

            {/* Address suggestions dropdown */}
            {showSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {addressSuggestions.map((place, index) => (
                  <button
                    key={place.place_id}
                    type="button"
                    onClick={() => handleAddressSelect(place)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {place.formatted_address}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Validation message */}
            {formData.address && !addressValidated && (
              <p className="mt-1 text-sm text-yellow-600">
                Please select an address from the suggestions for accurate location data
              </p>
            )}
            
            {addressValidated && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <Check className="h-4 w-4 mr-1" />
                Address verified
              </p>
            )}
          </div>

          {/* Show location details when address is validated */}
          {addressValidated && formData.latitude && formData.longitude && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-sm font-medium text-green-800 mb-2">Location Details</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                <div>City: {formData.city}</div>
                <div>State: {formData.state}</div>
                <div>ZIP: {formData.zip}</div>
                <div>Country: {formData.country}</div>
                <div className="col-span-2">
                  Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Describe your property, amenities, or special features..."
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !currentTenant || !addressValidated}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? "Creating Property..." : "Create Property"}
          </button>
          
          {!addressValidated && formData.address && (
            <p className="text-sm text-gray-600 text-center">
              Please select a validated address to continue
            </p>
          )}
        </form>
      </div>

      {/* Load Google Maps JavaScript API */}
      <script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        async
        defer
      />
    </AuthenticatedLayout>
  );
}