"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface GooglePlacePhotoProps {
  placeId: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: React.ReactNode;
  maxWidth?: number;
  maxHeight?: number;
}

export default function GooglePlacePhoto({
  placeId,
  alt,
  width = 400,
  height = 300,
  className = "",
  fallback,
  maxWidth = 1600,
  maxHeight = 1600,
}: GooglePlacePhotoProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!placeId) {
      setError(true);
      setLoading(false);
      return;
    }

    const fetchPhotoUrl = async () => {
      try {
        const response = await fetch(
          `/api/places/photo?place_id=${placeId}&max_width=${maxWidth}&max_height=${maxHeight}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch photo");
        }

        const data = await response.json();

        if (data.photo_url) {
          setPhotoUrl(data.photo_url);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching Google Place photo:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotoUrl();
  }, [placeId, maxWidth, maxHeight]);

  if (loading) {
    return (
      <div
        className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}
        style={{ width, height }}
      >
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !photoUrl) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div
        className={`${className} bg-gray-200 flex items-center justify-center`}
        style={{ width, height }}
      >
        <div className="text-gray-400">📷</div>
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
      onError={() => setError(true)}
    />
  );
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("place_id");
  const photoReference = searchParams.get("photo_reference");
  const maxWidth =
    searchParams.get("max_width") || searchParams.get("maxwidth") || "400";
  const maxHeight =
    searchParams.get("max_height") || searchParams.get("maxheight") || "400";

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    // If we have a photo_reference, use it directly (your existing functionality)
    if (photoReference) {
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${process.env.GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(photoUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch photo");
      }

      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
        },
      });
    }

    // If we have a place_id, get place details first to find photo reference
    if (placeId) {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${process.env.GOOGLE_PLACES_API_KEY}`;

      const detailsResponse = await fetch(detailsUrl);
      if (!detailsResponse.ok) {
        throw new Error("Failed to fetch place details");
      }

      const detailsData = await detailsResponse.json();

      if (!detailsData.result?.photos || detailsData.result.photos.length === 0) {
        return NextResponse.json(
          { error: "No photos found for this place" },
          { status: 404 }
        );
      }

      const firstPhotoReference = detailsData.result.photos[0].photo_reference;

      // Now fetch the actual photo using the photo reference
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${firstPhotoReference}&key=${process.env.GOOGLE_PLACES_API_KEY}`;

      const photoResponse = await fetch(photoUrl);
      if (!photoResponse.ok) {
        throw new Error("Failed to fetch photo");
      }

      // Return the photo URL for the component to use
      return NextResponse.json({
        photo_url: `/api/places/photo?photo_reference=${firstPhotoReference}&maxwidth=${maxWidth}`,
      });
    }

    return NextResponse.json(
      { error: "Missing place_id or photo_reference parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in photo API:", error);
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 }
    );
  }
}
