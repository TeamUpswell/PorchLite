import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key for server operations
);

export async function POST(request: NextRequest) {
  try {
    const {
      property_id, // Use snake_case to match database schema
      guestName,
      rating,
      hasIssues,
      hasRecommendations,
      numberOfNights,
    } = await request.json();

    // Validate required fields
    if (!property_id) {
      return NextResponse.json(
        { error: "property_id is required" },
        { status: 400 }
      );
    }

    // Get property and owner information
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select(
        `
        id,
        name,
        created_by,
        profiles!properties_created_by_fkey(
          email,
          full_name
        )
      `
      )
      .eq("id", property_id)
      .single();

    if (propertyError) {
      console.error("Property fetch error:", propertyError);
      return NextResponse.json(
        { error: "Failed to fetch property details" },
        { status: 500 }
      );
    }

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    if (!property.profiles?.email) {
      console.error("Property owner email not found:", property_id);
      return NextResponse.json(
        { error: "Property owner email not found" },
        { status: 404 }
      );
    }

    // Prepare email content
    const subject = `New Guest Book Entry for ${property.name}`;
    const emailBody = `
      A new guest book entry has been submitted for your property "${property.name}":
      
      Guest: ${guestName}
      Stay: ${numberOfNights} night${numberOfNights !== 1 ? "s" : ""}
      Rating: ${rating}/5 stars
      ${hasRecommendations ? "✨ Includes place recommendations" : ""}
      ${hasIssues ? "⚠️ Reported some issues that need attention" : ""}
      
      Please review and approve this entry in your dashboard.
    `;

    // TODO: Integrate with your email service (SendGrid, Resend, etc.)
    // For now, we'll just log it
    console.log("Email notification prepared:", {
      to: property.profiles.email,
      subject,
      body: emailBody.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Notification queued successfully",
    });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
