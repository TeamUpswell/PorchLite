"use client";

import { useEffect, useRef, useState } from "react";

interface AddressData {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

interface GoogleAddressAutocompleteProps {
  onAddressSelect: (address: AddressData) => void;
  placeholder?: string;
  className?: string;
}

export default function GoogleAddressAutocomplete({
  onAddressSelect,
  placeholder = "Search for an address...",
  className = "",
}: GoogleAddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (window.google?.maps?.places?.Autocomplete) {
        initializeAutocomplete();
        return;
      }

      // Load Google Maps script if not already loaded
      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = initializeAutocomplete;
        document.head.appendChild(script);
      }
    };

    const initializeAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places?.Autocomplete) {
        return;
      }

      // Create autocomplete instance
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          fields: [
            "address_components",
            "geometry",
            "name",
            "formatted_address",
          ],
          types: ["address"],
          componentRestrictions: { country: ["us", "ca"] },
        }
      );

      // Add event listener for place selection
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.address_components) {
          console.error("No address details available for this place");
          return;
        }

        // Parse address components
        const addressData: AddressData = {
          street: "",
          city: "",
          state: "",
          zip: "",
          country: "",
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        };

        // Extract address components
        place.address_components.forEach((component) => {
          const types = component.types;

          if (types.includes("street_number")) {
            addressData.street = component.long_name + " ";
          } else if (types.includes("route")) {
            addressData.street += component.long_name;
          } else if (types.includes("locality")) {
            addressData.city = component.long_name;
          } else if (types.includes("administrative_area_level_1")) {
            addressData.state = component.short_name;
          } else if (types.includes("postal_code")) {
            addressData.zip = component.long_name;
          } else if (types.includes("country")) {
            addressData.country = component.long_name;
          }
        });

        // Clean up street address
        addressData.street = addressData.street.trim();

        onAddressSelect(addressData);
      });

      autocompleteRef.current = autocomplete;
    };

    loadGoogleMaps();

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onAddressSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className={className}
    />
  );
}

// Extend the Window interface to include Google Maps types
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: google.maps.places.AutocompleteOptions
          ) => google.maps.places.Autocomplete;
        };
        event: {
          clearInstanceListeners: (instance: any) => void;
        };
      };
    };
  }
}
