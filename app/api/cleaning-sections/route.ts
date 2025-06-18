import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("🧹 Cleaning sections request body:", body);

    // ✅ FIX: Handle both propertyId and property_id
    const propertyId = body.propertyId || body.property_id;

    if (!propertyId) {
      console.error("🧹 Missing property ID in request:", body);
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    console.log("🧹 Looking for cleaning sections for property:", propertyId);

    const { data, error } = await supabase
      .from("cleaning_sections")
      .select("*")
      .eq("property_id", propertyId)
      .order("order_index");

    if (error) {
      console.error("🧹 Supabase cleaning sections error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("🧹 Cleaning sections found:", data?.length || 0);
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("🧹 Cleaning sections API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId query parameter is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("cleaning_sections")
      .select("*")
      .eq("property_id", propertyId)
      .order("order_index");

    if (error) {
      console.error("🧹 GET cleaning sections error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("🧹 GET cleaning sections API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
