// app/api/places/details/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const placeId = url.searchParams.get("place_id");

    if (!placeId) {
      console.error("❌ Missing place_id parameter");
      return NextResponse.json(
        { error: "place_id is required" },
        { status: 400 }
      );
    }

    // Use the public API key for Places API calls
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("❌ Google Maps API key not configured");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    console.log(`🔍 Fetching place details for: ${placeId}`);

    // Fetch place details to get photo references
    const googleApiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`;

    const response = await fetch(googleApiUrl);

    if (!response.ok) {
      console.error(`❌ Google API HTTP error: ${response.status}`);
      return NextResponse.json(
        {
          error: `Google API HTTP error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`📸 Google API response status: ${data.status}`);

    if (data.status !== "OK") {
      console.error(`❌ Google API error: ${data.status}`, data.error_message);
      return NextResponse.json(
        {
          error: `Google API error: ${data.status}`,
          details: data.error_message,
        },
        { status: 400 }
      );
    }

    if (data.result?.photos?.[0]?.photo_reference) {
      const photoRef = data.result.photos[0].photo_reference;
      console.log(`✅ Found photo reference: ${photoRef.substring(0, 20)}...`);

      return NextResponse.json({
        photo_reference: photoRef,
        total_photos: data.result.photos.length,
      });
    } else {
      console.log("⚠️ No photos found for this place");
      return NextResponse.json(
        {
          error: "No photos available for this place",
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("❌ Error fetching place details:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch place details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
