"use client";

import { useEffect, useRef, useState } from "react";
import { loadMapsApi } from "@/lib/googleMaps";

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  address: string;
  zoom?: number;
}

export default function GoogleMapComponent({
  latitude,
  longitude,
  address,
  zoom = 15,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // This check doesn't guarantee mapRef.current is non-null inside the async function
    if (!mapRef.current) return;
    
    const initMap = async () => {
      try {
        // Add a check inside the async function too
        if (!mapRef.current) return;

        await loadMapsApi();
        
        const mapOptions = {
          center: { lat: latitude, lng: longitude },
          zoom: zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        };
        
        // Now TypeScript knows mapRef.current is definitely non-null here
        const map = new google.maps.Map(mapRef.current, mapOptions);
        
        new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: map,
          title: address,
        });
        
        setMapLoaded(true);
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };
    
    initMap();
  }, [latitude, longitude, address, zoom]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="absolute inset-0" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}