// components/GooglePlacePhoto.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface GooglePlacePhotoProps {
  photoReference: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function GooglePlacePhoto({
  photoReference,
  alt,
  width = 400,
  height = 300,
  className = "",
}: GooglePlacePhotoProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (photoReference) {
      // Create the photo URL using our API endpoint
      const url = `/api/places/photo?photo_reference=${photoReference}&maxwidth=${width}&maxheight=${height}`;
      setPhotoUrl(url);
      setLoading(false);
    } else {
      setLoading(false);
      setError(true);
    }
  }, [photoReference, width, height]);

  const handleImageError = () => {
    console.error('❌ Failed to load photo:', photoReference);
    setError(true);
    setLoading(false);
  };

  const handleImageLoad = () => {
    console.log('✅ Photo loaded successfully:', photoReference);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}>
        <div className="text-gray-400 text-sm">Loading image...</div>
      </div>
    );
  }

  if (error || !photoUrl) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center`}>
        <span className="text-white text-2xl">📸</span>
      </div>
    );
  }

  return (
    <Image
      src={photoUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'cover' }}
      onError={handleImageError}
      onLoad={handleImageLoad}
      unoptimized={true} // Important: Disable Next.js optimization for external images
    />
  );
}