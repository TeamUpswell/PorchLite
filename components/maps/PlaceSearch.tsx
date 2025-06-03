/// <reference types="@types/google.maps" />

"use client";

import { useState, useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Search } from "lucide-react";

interface PlaceSearchProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
}

export default function PlaceSearch({
  onPlaceSelect,
  placeholder = "Search for a place...",
}: PlaceSearchProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const inputId = "place-search-input"; // Add a consistent ID

  useEffect(() => {
    const loadGoogleMapsAPI = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
          version: "weekly",
          libraries: ["places"],
        });

        await loader.load();
        setIsLoaded(true);
      } catch (error) {
        console.error("Error loading Google Maps API:", error);
      }
    };

    loadGoogleMapsAPI();
  }, []);

  useEffect(() => {
    if (isLoaded && inputRef.current) {
      // Initialize Google Places Autocomplete
      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        { types: ["establishment"] }
      );

      // Add listener for place selection
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.place_id) {
          onPlaceSelect(place);
        }
      });
    }

    // Cleanup listener on component unmount
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onPlaceSelect]);

  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        Search for places
      </label>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        id={inputId}
        ref={inputRef}
        type="text"
        className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        disabled={!isLoaded}
      />
      {!isLoaded && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <div className="h-4 w-4 border-t-2 border-blue-500 border-r-2 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}