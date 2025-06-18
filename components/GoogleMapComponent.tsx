"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  address: string;
  zoom?: number;
  className?: string;
}

// ✅ Create a safe loadMapsApi function directly in the component
const loadMapsApi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }

    // Load the script
    const script = document.createElement('script');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      reject(new Error('Google Maps API key not found'));
      return;
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));

    document.head.appendChild(script);
  });
};

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

  // ✅ Wrap the initMap function in try-catch for safety
  const initMap = useCallback(async () => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    try {
      setError(null);

      // ✅ Use the safe loadMapsApi function
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
        gestureHandling: "cooperative",
        styles: [
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
        animation: google.maps.Animation.DROP,
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
      console.log("✅ Google Map loaded successfully");
    } catch (error) {
      console.error("❌ Error initializing map:", error);
      setError("Failed to load map. Please check your internet connection.");
    }
  }, [latitude, longitude, address, zoom]);

  // Update map center and marker when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && mapLoaded) {
      const newPosition = { lat: latitude, lng: longitude };
      mapInstanceRef.current.setCenter(newPosition);
      markerRef.current.setPosition(newPosition);
      markerRef.current.setTitle(address);
    }
  }, [latitude, longitude, address, mapLoaded]);

  // ✅ Wrap initMap call in try-catch
  useEffect(() => {
    try {
      initMap();
    } catch (error) {
      console.error("❌ Error in map initialization:", error);
      setError("Failed to initialize map");
    }
  }, [initMap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (mapInstanceRef.current) {
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