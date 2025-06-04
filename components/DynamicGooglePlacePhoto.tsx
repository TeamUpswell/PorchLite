"use client";

import { useState, useEffect } from 'react';
import GooglePlacePhoto from './GooglePlacePhoto';

interface DynamicGooglePlacephotoProps {
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
  className
}: DynamicGooglePlacePhotoProps) {
  const [photoReference, setPhotoReference] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        const response = await fetch(`/api/places/details?place_id=${placeId}`);
        const data = await response.json();
        
        if (data.result?.photos?.[0]?.photo_reference) {
          setPhotoReference(data.result.photos[0].photo_reference);
        }
      } catch (error) {
        console.error('Error fetching place photo:', error);
      } finally {
        setLoading(false);
      }
    };

    if (placeId) {
      fetchPhoto();
    } else {
      setLoading(false);
    }
  }, [placeId]);

  if (loading) {
    return (
      <div className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}>
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!photoReference) {
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