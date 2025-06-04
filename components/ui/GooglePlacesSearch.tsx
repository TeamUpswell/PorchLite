"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Clock, Star } from "lucide-react";

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  price_level?: number;
  photos?: { photo_reference: string }[];
  opening_hours?: {
    open_now: boolean;
  };
  website?: string;
  formatted_phone_number?: string;
}

interface GooglePlacesSearchProps {
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  propertyLocation?: string | { lat: number; lng: number }; // Support both formats
  searchTypes?: string[]; // Optional filter for place types
  radius?: number; // Search radius in meters
  showDetails?: boolean; // Show rating, hours, price level in results
}

export default function GooglePlacesSearch({ 
  onPlaceSelect, 
  placeholder = "Search for places...",
  className = "",
  propertyLocation,
  searchTypes,
  radius = 50000, // 50km default
  showDetails = true
}: GooglePlacesSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/places/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          location: propertyLocation,
          types: searchTypes,
          radius: radius,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error searching places:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (value.length > 2) {
        searchPlaces(value);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);
  };

  const handlePlaceSelect = (place: PlaceResult) => {
    setQuery(place.name);
    setShowResults(false);
    onPlaceSelect(place);
  };

  const getPlaceIcon = (types: string[]) => {
    if (types.includes('restaurant') || types.includes('food') || types.includes('meal_takeaway')) return '🍽️';
    if (types.includes('lodging')) return '🏨';
    if (types.includes('tourist_attraction')) return '🎯';
    if (types.includes('shopping_mall') || types.includes('store')) return '🛍️';
    if (types.includes('park')) return '🌳';
    if (types.includes('museum')) return '🏛️';
    if (types.includes('entertainment') || types.includes('amusement_park')) return '🎭';
    if (types.includes('bar') || types.includes('night_club')) return '🍻';
    if (types.includes('grocery_or_supermarket')) return '🛒';
    if (types.includes('hospital') || types.includes('pharmacy')) return '🏥';
    if (types.includes('gym') || types.includes('spa')) return '💪';
    return '📍';
  };

  // Clear search when component unmounts or resets
  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  // Expose clear function via ref if needed
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            type="button"
          >
            ×
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
          {results.map((place) => (
            <button
              key={place.place_id}
              onClick={() => handlePlaceSelect(place)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start space-x-3">
                <span className="text-lg mt-0.5">{getPlaceIcon(place.types)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {place.name}
                    </h4>
                    {showDetails && place.rating && (
                      <div className="flex items-center ml-2">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600 ml-1">
                          {place.rating}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">
                    {place.formatted_address}
                  </p>
                  {showDetails && (
                    <div className="flex items-center mt-1 space-x-2">
                      {place.opening_hours?.open_now !== undefined && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          place.opening_hours.open_now 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {place.opening_hours.open_now ? 'Open' : 'Closed'}
                        </span>
                      )}
                      {place.price_level && (
                        <span className="text-xs text-gray-500">
                          {'$'.repeat(place.price_level)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !isLoading && query.length > 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500">
          No places found for "{query}"
        </div>
      )}
    </div>
  );
}

// Export the clear functionality as a hook if needed
export const useGooglePlacesSearch = () => {
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  
  const clearSelection = () => setSelectedPlace(null);
  
  return {
    selectedPlace,
    setSelectedPlace,
    clearSelection
  };
};