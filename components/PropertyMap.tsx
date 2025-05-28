'use client';

import { useState, useEffect, useRef } from 'react';

interface PropertyMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  className?: string;
  height?: string;
}

export default function PropertyMap({ 
  latitude, 
  longitude, 
  address, 
  className = '',
  height = '300px' 
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if we have valid coordinates
  const hasValidCoordinates = typeof latitude === 'number' && 
                              typeof longitude === 'number' &&
                              !isNaN(latitude) && 
                              !isNaN(longitude);

  useEffect(() => {
    // Check if the Google Maps API is already loaded
    if (window.google?.maps && mapRef.current && !mapInstance) {
      setIsLoaded(true);
    }
  }, [mapInstance]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    try {
      // Default to center of US if no coordinates
      const center = hasValidCoordinates 
        ? { lat: latitude!, lng: longitude! }
        : { lat: 39.8283, lng: -98.5795 };
      
      // Initial zoom level - closer if we have coordinates
      const zoomLevel = hasValidCoordinates ? 15 : 4;

      // Create the map instance
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: zoomLevel,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
      
      setMapInstance(map);

      // Add marker if we have coordinates
      if (hasValidCoordinates) {
        const marker = new google.maps.Marker({
          position: { lat: latitude!, lng: longitude! },
          map,
          title: address || 'Property Location',
          animation: google.maps.Animation.DROP
        });

        // Optional: Add info window with address
        if (address) {
          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="padding: 8px; max-width: 200px;">
              <p style="margin: 0; font-weight: 600;">${address}</p>
            </div>`
          });

          marker.addListener('click', () => {
            infoWindow.open({
              anchor: marker,
              map
            });
          });
        }
      }
    } catch (error) {
      console.error("Error initializing Google Map:", error);
    }
  }, [isLoaded, latitude, longitude, address, hasValidCoordinates]);

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`} style={{ height }}>
      {!hasValidCoordinates && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <p className="text-gray-500">No location data available</p>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        aria-label={hasValidCoordinates ? `Map showing property at ${address || 'specified coordinates'}` : 'Map unavailable'}
      ></div>
    </div>
  );
}