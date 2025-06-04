// app/api/places/photo/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const photoReference = url.searchParams.get('photo_reference');
    const maxwidth = url.searchParams.get('maxwidth') || '400';
    const maxheight = url.searchParams.get('maxheight') || '300';
    
    if (!photoReference) {
      console.error('Missing photo_reference parameter');
      return new NextResponse(JSON.stringify({ error: 'Photo reference is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Important: Use the server-side key, not the public key
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      console.error('Google Places API key not configured in environment variables');
      return new NextResponse(JSON.stringify({ error: 'API configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log parameters for debugging
    console.log(`Fetching photo with reference: ${photoReference.substring(0, 20)}...`);
    
    // Construct Google Places Photo API URL
    const googlePlacesUrl = `https://maps.googleapis.com/maps/api/place/photo?photoreference=${photoReference}&maxwidth=${maxwidth}&maxheight=${maxheight}&key=${apiKey}`;

    // Fetch the photo from Google Places API
    const response = await fetch(googlePlacesUrl, { cache: 'force-cache' });
    
    if (!response.ok) {
      console.error(`Google API Error: ${response.status} ${response.statusText}`);
      return new NextResponse(JSON.stringify({ 
        error: 'Failed to fetch photo from Google Places API',
        status: response.status,
        statusText: response.statusText
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return the photo as binary data with appropriate content type
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      }
    });

  } catch (error) {
    console.error('Error processing Places photo request:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error', details: error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}