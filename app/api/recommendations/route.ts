import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { debugLog, debugError } from "@/lib/utils/debug";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const property_id = searchParams.get("property_id");

    console.log(
      "🔍 API: Fetching recommendations with property_id:",
      property_id
    );

    let query = supabase
      .from("recommendations")
      .select("*")
      .order("created_at", { ascending: false });

    if (property_id) {
      console.log("🎯 API: Applying property filter:", property_id);
      query = query.eq("property_id", property_id);
    } else {
      console.log("📋 API: No property filter - fetching all recommendations");
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ API: Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ API: Query result:", {
      count: data?.length || 0,
      data: data,
      property_id: property_id,
    });

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("❌ API: Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    debugLog("📝 Creating recommendation:", body);

    // Validate required fields
    if (!body.name || !body.category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("recommendations")
      .insert([
        {
          name: body.name,
          category: body.category,
          description: body.description || null,
          address: body.address || null,
          phone: body.phone || null,
          website: body.website || null,
          place_id: body.place_id || null,
          rating: body.rating || null,
          price_level: body.price_level || null,
          notes: body.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      debugError("❌ Error creating recommendation:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    debugLog("✅ Recommendation created successfully:", data);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    debugError("❌ Server error creating recommendation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
