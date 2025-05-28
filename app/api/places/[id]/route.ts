import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const placeId = params.id;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key is not configured' }, 
      { status: 500 }
    );
  }
  
  try {
    console.log(`Fetching details for place ID: ${placeId}`);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`
    );
    
    const data = await response.json();
    console.log('Places API response:', data);
    
    // Check if we actually got photos back
    if (!data.result?.photos?.length) {
      console.log('No photos found for this place');
      return NextResponse.json({ photoUrl: null });
    }

    // Get the photo reference
    const photoReference = data.result.photos[0].photo_reference;
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${photoReference}&key=${apiKey}`;
    console.log('Photo URL generated:', photoUrl);

    return NextResponse.json({ photoUrl });
  } catch (error) {
    console.error("Error fetching place details:", error);
    return NextResponse.json({ error: 'Failed to fetch place details' }, { status: 500 });
  }
}