// components/GooglePlacePhoto.tsx
"use client";

import { useState } from "react";
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
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!photoReference || imageError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-400">No image available</span>
      </div>
    );
  }

  const imageUrl = `/api/places/photo?photo_reference=${encodeURIComponent(photoReference)}&maxwidth=${width}&maxheight=${height}`;

  return (
    <div className={className}>
      {loading && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onLoad={() => setLoading(false)}
        onError={() => {
          setImageError(true);
          setLoading(false);
        }}
      />
    </div>
  );
}