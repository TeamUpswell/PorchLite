// components/GooglePlacePhoto.tsx
"use client";

import { useState } from "react";

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
      <div
        className={`bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center ${className}`}
      >
        <span className="text-gray-600 text-lg">📷</span>
      </div>
    );
  }

  const imageUrl = `/api/places/photo?photo_reference=${encodeURIComponent(
    photoReference
  )}&maxwidth=${width}&maxheight=${height}`;

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onLoad={() => {
          console.log("✅ Photo loaded successfully");
          setLoading(false);
        }}
        onError={(e) => {
          console.error("❌ Photo failed to load:", e);
          setImageError(true);
          setLoading(false);
        }}
      />
    </div>
  );
}
