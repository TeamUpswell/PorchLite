"use client";

import React, { useState, useEffect } from "react";
import GooglePlacePhoto from "./GooglePlacePhoto";
import { debugLog, debugError } from "@/lib/utils/debug";

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
    const fetchPhotoReference = async () => {
      debugLog("🔍 Fetching photo reference for place_id:", placeId);

      try {
        const response = await fetch(`/api/google-places?placeId=${placeId}`);

        debugLog("📡 API response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          debugLog("📸 Place details response:", {
            photo_reference: data.photo_reference ? "Found" : "None",
            total_photos: data.total_photos,
            status: data.status,
          });

          if (data.photo_reference) {
            debugLog("✅ Got photo reference");
            setPhotoReference(data.photo_reference);
          } else {
            debugLog("❌ No photo reference found");
            setError(true);
          }
        } else {
          const errorData = await response.json();
          debugError("❌ API error:", errorData);
          setError(true);
        }
      } catch (error) {
        debugError("❌ Error fetching photo reference:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (placeId) {
      fetchPhotoReference();
    } else {
      setError(true);
      setLoading(false);
    }
  }, [placeId]);

  if (loading) {
    return (
      <div
        className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}
      >
        <span className="text-gray-400 text-sm">Loading photo...</span>
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
