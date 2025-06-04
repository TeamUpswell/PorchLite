"use client";

import { useState, useEffect } from "react";
import GooglePlacePhoto from "./GooglePlacePhoto";

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
  className = "",
}: DynamicGooglePlacePhotoProps) {
  const [photoReference, setPhotoReference] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPhoto = async () => {
      if (!placeId) {
        console.log("❌ No placeId provided");
        setError(true);
        setLoading(false);
        return;
      }

      try {
        console.log(`🔍 Fetching photo reference for place_id: ${placeId}`);

        // Step 1: Get photo reference from place ID
        const response = await fetch(`/api/places/details?place_id=${placeId}`);
        console.log(`📡 API response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API error: ${response.status} - ${errorText}`);
          throw new Error(
            `API responded with ${response.status}: ${errorText}`
          );
        }

        const data = await response.json();
        console.log("📸 Place details response:", data);

        if (data.photo_reference) {
          console.log(
            `✅ Got photo reference: ${data.photo_reference.substring(
              0,
              20
            )}...`
          );
          setPhotoReference(data.photo_reference);
        } else {
          console.log("⚠️ No photo reference found");
          setError(true);
        }
      } catch (error) {
        console.error("❌ Error fetching photo reference:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPhoto();
  }, [placeId]);

  if (loading) {
    return (
      <div
        className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}
      >
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    );
  }

  if (error || !photoReference) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center`}
      >
        <span className="text-white text-2xl">📍</span>
      </div>
    );
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
