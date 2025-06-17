import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock cleaning sections data - replace with actual database query later
    const sections = [
      {
        id: 1,
        name: "Living Room",
        description: "Clean and organize the main living area",
        order: 1
      },
      {
        id: 2,
        name: "Kitchen",
        description: "Clean counters, appliances, and sink",
        order: 2
      },
      {
        id: 3,
        name: "Bathroom",
        description: "Clean toilet, shower, and sink",
        order: 3
      },
      {
        id: 4,
        name: "Bedrooms",
        description: "Make beds and tidy up sleeping areas",
        order: 4
      },
      {
        id: 5,
        name: "Final Check",
        description: "Walk through and ensure everything is complete",
        order: 5
      }
    ];

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching cleaning sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cleaning sections' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}