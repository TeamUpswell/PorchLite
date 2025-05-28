/// <reference types="@types/google.maps" />
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Script from "next/script";
import styles from "./RecommendationForm.module.css";

interface Recommendation {
  id: string;
  name: string;
  category: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  description: string;
  rating?: number;
  website?: string;
  phone_number?: string;
  images?: string[];
}

interface RecommendationFormProps {
  recommendation: Recommendation | null;
  categories: string[];
  onSave: (data: any) => void;
  onCancel: () => void;
}

export default function RecommendationForm({
  recommendation,
  categories,
  onSave,
  onCancel,
}: RecommendationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: categories[0] || "Restaurant",
    address: "",
    description: "",
    rating: 0,
    website: "",
    phone_number: "",
    images: [""],
    coordinates: null as { lat: number; lng: number } | null,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    google.maps.places.PlaceResult[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [searchResultsVisible, setSearchResultsVisible] = useState(false);

  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Add ref for search service
  const searchService = useRef<google.maps.places.AutocompleteService | null>(null);

  // Add a debounced search to prevent excessive API calls
  const debouncedSearch = useRef<NodeJS.Timeout | null>(null);

  // Add ref for search timeout
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fix handleSearch implementation - complete function with proper implementation
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true); // FIXED: Added missing value parameter

    // Clear previous timeout if exists
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/places/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();

        if (data && data.results) {
          setSearchResults(data.results);
        }
      } catch (error) {
        console.error("Error searching places:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, [searchQuery]); // Added missing dependency array

  // MOVE: This useEffect should come AFTER the handleSearch definition
  useEffect(() => {
    handleSearch();
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [handleSearch]);

  return (
    <div>
      {/* Other components */}
      <div className={styles.mapContainer}>
        {formData.coordinates && (
          <iframe
            width="100%"
            height="100%"
            className={styles.mapIframe}
            title={`Map location for ${formData.name}`}
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${formData.coordinates.lat},${formData.coordinates.lng}`}
          ></iframe>
        )}
      </div>
    </div>
  );
}
