/// <reference types="@types/google.maps" />

"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

interface PlaceSearchProps {
  onPlaceSelect: (place: any) => void;
  defaultLocation?: { lat: number; lng: number };
  placeholder?: string;
}

export default function PlaceSearch({
  onPlaceSelect,
  defaultLocation,
  placeholder = "Search for places...",
}: PlaceSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Add debug logging
    console.log("🗺️ PlaceSearch initializing...");
    console.log("🗺️ window.google exists:", typeof window.google !== "undefined");
    console.log("🗺️ window.google.maps exists:", typeof window.google?.maps !== "undefined");
    console.log("🗺️ window.google.maps.places exists:", typeof window.google?.maps?.places !== "undefined");

    const initializeAutocomplete = async () => {
      console.log("🗺️ Attempting to initialize autocomplete...");
      
      // Wait for Google Maps to load
      if (typeof window.google === "undefined") {
        console.error("❌ Google Maps JavaScript API not loaded");
        return;
      }

      if (!window.google.maps) {
        console.error("❌ Google Maps core not available");
        return;
      }

      if (!window.google.maps.places) {
        console.error("❌ Google Maps Places library not available");
        return;
      }

      console.log("✅ Google Maps and Places library available");

      try {
        console.log("🗺️ Creating Autocomplete instance...");
        const autocomplete = new google.maps.places.Autocomplete(
          inputRef.current!,
          {
            fields: [
              "place_id",
              "name",
              "formatted_address",
              "rating",
              "price_level",
              "types",
              "geometry",
              "photos",
              "formatted_phone_number",
              "website",
              "opening_hours",
            ],
            types: ["establishment"],
          }
        );

        console.log("✅ Autocomplete instance created");

        // Set location bias if provided
        if (defaultLocation) {
          console.log("🗺️ Setting location bias:", defaultLocation);
          const circle = new google.maps.Circle({
            center: defaultLocation,
            radius: 5000,
          });
          autocomplete.setBounds(circle.getBounds()!);
        }

        // Set up event listener for place selection
        autocomplete.addListener("place_changed", () => {
          console.log("🗺️ Place selected!");
          const place = autocomplete.getPlace();
          
          if (place && place.place_id) {
            console.log("✅ Valid place selected:", place.name);
            onPlaceSelect({
              place_id: place.place_id,
              name: place.name,
              formatted_address: place.formatted_address,
              rating: place.rating,
              price_level: place.price_level,
              types: place.types || [],
              geometry: place.geometry,
              photos: place.photos,
              formatted_phone_number: place.formatted_phone_number,
              website: place.website,
              opening_hours: place.opening_hours,
            });
          } else {
            console.warn("⚠️ Invalid place selected");
          }
        });

        console.log("✅ PlaceSearch fully initialized");
        setIsLoaded(true);
      } catch (error) {
        console.error("❌ Error initializing Places Autocomplete:", error);
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log("✅ Google Maps already loaded, initializing immediately");
      initializeAutocomplete();
    } else {
      console.log("⏳ Waiting for Google Maps to load...");
      // Wait for Google Maps to load
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds
      
      const checkGoogleMaps = setInterval(() => {
        attempts++;
        console.log(`🗺️ Check attempt ${attempts}/${maxAttempts}`);
        
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log("✅ Google Maps loaded, initializing autocomplete");
          clearInterval(checkGoogleMaps);
          initializeAutocomplete();
        } else if (attempts >= maxAttempts) {
          console.error("❌ Timeout waiting for Google Maps to load");
          clearInterval(checkGoogleMaps);
        }
      }, 100);
    }
  }, [defaultLocation, onPlaceSelect]);

  return (
    <div className="relative">
      <div className="flex items-center relative">
        <Search className="absolute left-3 h-5 w-5 text-gray-400 z-10" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          disabled={!isLoaded}
        />
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="flex items-center text-gray-500 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
            Loading places search...
          </div>
        </div>
      )}
    </div>
  );
}
