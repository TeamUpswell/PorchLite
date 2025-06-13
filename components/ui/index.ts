import { NextRequest, NextResponse } from "next/server";
export { Button } from "./button";
export { Input } from "./input";
export { Label } from "./label";
export { Card, CardHeader, CardTitle, CardContent } from "./card";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("place_id");
  const maxWidth = searchParams.get("max_width") || "1600";
  const maxHeight = searchParams.get("max_height") || "1600";

  if (!placeId) {
    return NextResponse.json(
      { error: "Place ID is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  try {
    // First, get place details to get photo references
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`;

    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (!detailsResponse.ok || detailsData.status !== "OK") {
      console.error("Places API error:", detailsData);
      return NextResponse.json(
        { error: "Failed to fetch place details" },
        { status: 500 }
      );
    }

    if (!detailsData.result?.photos || detailsData.result.photos.length === 0) {
      return NextResponse.json(
        { error: "No photos available" },
        { status: 404 }
      );
    }

    // Get the first photo reference
    const photoReference = detailsData.result.photos[0].photo_reference;

    // Build the photo URL
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&maxheight=${maxHeight}&photo_reference=${photoReference}&key=${apiKey}`;

    return NextResponse.json({
      photo_url: photoUrl,
      photo_reference: photoReference,
      total_photos: detailsData.result.photos.length,
    });
  } catch (error) {
    console.error("Error fetching Google Place photo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
