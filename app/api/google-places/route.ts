import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json(
      { error: "Missing placeId parameter" },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("❌ Google Maps API key not found");
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`
    );

    const data = await response.json();

    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Google Place Details API response:", {
        status: data.status,
        hasPhotos: !!data.result?.photos,
        photoCount: data.result?.photos?.length || 0,
      });
    }

    if (data.status === "OK" && data.result?.photos?.[0]) {
      return NextResponse.json({
        photo_reference: data.result.photos[0].photo_reference,
        total_photos: data.result.photos.length,
      });
    }

    return NextResponse.json({
      photo_reference: null,
      total_photos: 0,
      status: data.status,
    });
  } catch (error) {
    console.error("❌ Error fetching place details:", error);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
