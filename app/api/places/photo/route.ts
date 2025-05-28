// app/api/places/photo/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Use searchParams instead of request.url
    const searchParams = request.nextUrl.searchParams;
    const photoReference = searchParams.get('photo_reference');
    const maxWidth = searchParams.get('maxwidth') || '400';
    const maxHeight = searchParams.get('maxheight') || '300';

    if (!photoReference) {
      return NextResponse.json({ error: 'Photo reference is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 });
    }

    // Google Places Photo API URL
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&maxheight=${maxHeight}&photo_reference=${photoReference}&key=${apiKey}`;

    console.log('🖼️ Fetching photo from Google:', photoUrl.replace(apiKey, 'API_KEY_HIDDEN'));

    // Fetch the actual image from Google
    const response = await fetch(photoUrl);
    
    if (!response.ok) {
      console.error('❌ Google Photo API error:', response.status, response.statusText);
      throw new Error(`Failed to fetch photo: ${response.status}`);
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log('✅ Photo fetched successfully, type:', contentType, 'size:', imageBuffer.byteLength);

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error('❌ Places Photo API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo' },
      { status: 500 }
    );
  }
}