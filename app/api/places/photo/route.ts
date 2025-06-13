// app/api/places/photo/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("🚀 Photo API called");
  
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("place_id");
  const photoReference = searchParams.get("photo_reference");
  const maxWidth = searchParams.get("max_width") || searchParams.get("maxwidth") || "400";
  const maxHeight = searchParams.get("max_height") || searchParams.get("maxheight") || "400";

  console.log("📸 Photo API params:", { placeId, photoReference, maxWidth, maxHeight });

  // Use the same API key variable as your search route
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.error("❌ Google Places API key not configured");
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    // If we have a photo_reference, serve the image directly
    if (photoReference) {
      console.log("📸 Serving photo with reference:", photoReference);
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;

      const response = await fetch(photoUrl);
      if (!response.ok) {
        console.error("❌ Google photo fetch failed:", response.status);
        throw new Error("Failed to fetch photo from Google");
      }

      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
        },
      });
    }

    // If we have a place_id, get place details first
    if (placeId) {
      console.log("📍 Fetching place details for:", placeId);
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`;

      console.log("🔗 Calling Google API for place details");
      const detailsResponse = await fetch(detailsUrl);
      
      if (!detailsResponse.ok) {
        console.error("❌ Google details fetch failed:", detailsResponse.status);
        throw new Error("Failed to fetch place details");
      }

      const detailsData = await detailsResponse.json();
      console.log("📋 Place details response status:", detailsData.status);

      if (detailsData.status !== "OK") {
        console.error("❌ Google API error:", detailsData.status, detailsData.error_message);
        return NextResponse.json(
          { error: `Google API error: ${detailsData.status}` },
          { status: 400 }
        );
      }

      if (!detailsData.result?.photos || detailsData.result.photos.length === 0) {
        console.log("📷 No photos found for place:", placeId);
        return NextResponse.json(
          { error: "No photos found for this place" },
          { status: 404 }
        );
      }

      const firstPhotoReference = detailsData.result.photos[0].photo_reference;
      console.log("✅ Found photo reference:", firstPhotoReference);

      return NextResponse.json({
        photo_url: `/api/places/photo?photo_reference=${firstPhotoReference}&maxwidth=${maxWidth}`,
      });
    }

    console.log("❌ Missing required parameters");
    return NextResponse.json(
      { error: "Missing place_id or photo_reference parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ Error in photo API:", error);
    return NextResponse.json(
      { error: "Failed to fetch photo", details: error.message },
      { status: 500 }
    );
  }
}