// app/api/places/search/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query, location, types, radius = 50000 } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Places API key not configured" },
        { status: 500 }
      );
    }

    // Build the Places API URL
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&key=${apiKey}`;

    // Add location bias if provided
    if (location) {
      if (typeof location === "string") {
        // If location is a string (address), add it to query
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          query + " near " + location
        )}&key=${apiKey}`;
      } else if (location.lat && location.lng) {
        // If location is coordinates, add location bias
        url += `&location=${location.lat},${location.lng}&radius=${radius}`;
      }
    }

    // Add type filtering if provided
    if (types && types.length > 0) {
      url += `&type=${types.join("|")}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK") {
      return NextResponse.json({
        results: data.results.slice(0, 10), // Limit to 10 results
        status: "success",
      });
    } else {
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Places search error:", error);
    return NextResponse.json(
      { error: "Failed to search places" },
      { status: 500 }
    );
  }
}
