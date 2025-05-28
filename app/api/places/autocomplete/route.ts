// app/api/places/autocomplete/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Keep only this one

export async function GET(request: NextRequest) {
  try {
    // Use searchParams instead of request.url
    const searchParams = request.nextUrl.searchParams;
    const input = searchParams.get('input');
    const location = searchParams.get('location');
    const radius = searchParams.get('radius') || '5000';

    if (!input || input.length < 2) {
      return NextResponse.json({ predictions: [] });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 });
    }

    // Use Google Places Autocomplete API
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.append('input', input);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('types', 'establishment');
    
    if (location) {
      url.searchParams.append('location', location);
      url.searchParams.append('radius', radius);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_message || 'Failed to get autocomplete suggestions');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Places Autocomplete API error:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}