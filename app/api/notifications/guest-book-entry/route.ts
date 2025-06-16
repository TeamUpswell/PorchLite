import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { 
      propertyId, 
      guestName, 
      rating, 
      hasIssues, 
      hasRecommendations, 
      numberOfNights 
    } = await request.json();
    
    // Get property owner email
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('name, user_profiles!inner(email, full_name)')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Prepare email content
    const subject = `New Guest Book Entry for ${property.name}`;
    const emailBody = `
      A new guest book entry has been submitted for your property "${property.name}":
      
      Guest: ${guestName}
      Stay: ${numberOfNights} night${numberOfNights !== 1 ? 's' : ''}
      Rating: ${rating}/5 stars
      ${hasRecommendations ? '✨ Includes place recommendations' : ''}
      ${hasIssues ? '⚠️ Reported some issues that need attention' : ''}
      
      Please review and approve this entry in your dashboard.
    `;

    // Here you would integrate with your email service (SendGrid, etc.)
    // For now, we'll just log it
    console.log('Email notification:', {
      to: property.user_profiles.email,
      subject,
      body: emailBody
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}