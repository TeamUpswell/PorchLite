"use client";

import { useState, useEffect } from 'react';
import GooglePlacePhoto from './GooglePlacePhoto';

interface DynamicGooglePlacePhotoProps {
  placeId: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function DynamicGooglePlacePhoto({
  placeId,
  alt,
  width = 400,
  height = 300,
  className = ""
}: DynamicGooglePlacePhotoProps) {
  const [photoReference, setPhotoReference] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPhoto = async () => {
      if (!placeId) {
        console.log(`❌ No place_id provided for ${alt}`);
        setLoading(false);
        return;
      }

      try {
        console.log(`🔍 Fetching photo for place_id: ${placeId} (${alt})`);
        
        const response = await fetch(`/api/places/details?place_id=${placeId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`📸 Place details response for ${alt}:`, data);
        
        if (data.result?.photos?.[0]?.photo_reference) {
          const photoRef = data.result.photos[0].photo_reference;
          console.log(`✅ Found photo reference for ${alt}: ${photoRef.substring(0, 20)}...`);
          setPhotoReference(photoRef);
        } else {
          console.log(`❌ No photos found for ${alt} (place_id: ${placeId})`);
          setError(true);
        }
      } catch (error) {
        console.error(`❌ Error fetching place photo for ${alt}:`, error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPhoto();
  }, [placeId, alt]);

  if (loading) {
    return (
      <div className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}>
        <span className="text-gray-400 text-sm">Loading photo...</span>
      </div>
    );
  }

  if (error || !photoReference) {
    console.log(`🔄 No photo available for ${alt} - showing fallback`);
    return null; // Let parent show fallback
  }

  return (
    <GooglePlacePhoto
      photoReference={photoReference}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}