import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("property_id");

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID required" },
        { status: 400 }
      );
    }

    const { data: sections, error } = await supabase
      .from("instruction_sections")
      .select("*")
      .eq("property_id", propertyId)
      .order("order_index");

    if (error) {
      console.error("Error fetching cleaning sections:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { property_id, name, instructions, order_index } = body;

    if (!property_id || !name) {
      return NextResponse.json(
        { error: "Property ID and name required" },
        { status: 400 }
      );
    }

    const { data: section, error } = await supabase
      .from("instruction_sections")
      .insert({
        property_id,
        name,
        instructions: instructions || "",
        order_index: order_index || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating cleaning section:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
