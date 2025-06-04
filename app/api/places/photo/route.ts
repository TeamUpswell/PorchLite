// app/api/places/photo/route.ts
import { NextRequest, NextResponse } from "next/server";

// Add this line to make the route dynamic
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const photoReference = url.searchParams.get("photo_reference");
    const maxWidth = url.searchParams.get("maxwidth") || "400";

    if (!photoReference) {
      console.error("❌ Missing photo_reference parameter");
      return NextResponse.json(
        { error: "photo_reference is required" },
        { status: 400 }
      );
    }

    // Important: Use the server-side key, not the public key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("❌ Google Maps API key not configured");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    console.log(`📸 Fetching photo with reference: ${photoReference.substring(0, 20)}...`);

    // Construct the Google Places Photo API URL
    const googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?photo_reference=${photoReference}&maxwidth=${maxWidth}&key=${apiKey}`;

    // Fetch the photo from Google Places API
    const response = await fetch(googlePhotoUrl);

    if (!response.ok) {
      console.error(`❌ Google Photo API HTTP error: ${response.status}`);
      return NextResponse.json(
        {
          error: `Google Photo API HTTP error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    // Get the image as a buffer
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log(`✅ Successfully fetched photo (${imageBuffer.byteLength} bytes)`);

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error("❌ Error fetching photo:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch photo",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}