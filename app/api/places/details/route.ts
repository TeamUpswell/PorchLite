// app/api/places/details/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placeId = searchParams.get('place_id');

    if (!placeId) {
      return NextResponse.json({ error: 'Place ID is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 });
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.append('place_id', placeId);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('fields', 'name,formatted_address,geometry,rating,price_level,types,formatted_phone_number,website,opening_hours,photos');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_message || 'Failed to get place details');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Places Details API error:', error);
    return NextResponse.json(
      { error: 'Failed to get place details' },
      { status: 500 }
    );
  }
}