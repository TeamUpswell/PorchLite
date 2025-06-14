"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { loadMapsApi } from "@/lib/googleMaps";

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  address: string;
  zoom?: number;
  className?: string;
}

export default function GoogleMapComponent({
  latitude,
  longitude,
  address,
  zoom = 15,
  className = "",
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the map initialization to prevent unnecessary re-renders
  const initMap = useCallback(async () => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    try {
      setError(null);

      // Load the Google Maps API
      await loadMapsApi();

      // Double-check the element is still available after async operation
      if (!mapRef.current) return;

      const mapOptions: google.maps.MapOptions = {
        center: { lat: latitude, lng: longitude },
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: "cooperative", // Better mobile experience
        styles: [
          // Optional: Add subtle styling
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      };

      // Create the map
      const map = new google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      // Create the marker
      const marker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        title: address,
        animation: google.maps.Animation.DROP, // Nice animation
      });
      markerRef.current = marker;

      // Add info window on marker click
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 8px; font-size: 14px;"><strong>${address}</strong></div>`,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      setMapLoaded(true);
    } catch (error) {
      console.error("Error initializing map:", error);
      setError("Failed to load map. Please try again.");
    }
  }, [latitude, longitude, address, zoom]);

  // Update map center and marker when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && mapLoaded) {
      const newPosition = { lat: latitude, lng: longitude };

      // Update map center
      mapInstanceRef.current.setCenter(newPosition);

      // Update marker position
      markerRef.current.setPosition(newPosition);
      markerRef.current.setTitle(address);
    }
  }, [latitude, longitude, address, mapLoaded]);

  // Initialize map on mount
  useEffect(() => {
    initMap();
  }, [initMap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (mapInstanceRef.current) {
        // Google Maps doesn't need explicit cleanup, but good practice
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg">
          <div className="text-center p-4">
            <div className="text-red-500 text-sm mb-2">⚠️ Map Error</div>
            <div className="text-gray-600 text-xs">{error}</div>
            <button
              onClick={() => {
                setError(null);
                setMapLoaded(false);
                initMap();
              }}
              className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div
        ref={mapRef}
        className="absolute inset-0 rounded-lg overflow-hidden"
      />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-gray-600 text-sm">Loading map...</div>
          </div>
        </div>
      )}
    </div>
  );
}