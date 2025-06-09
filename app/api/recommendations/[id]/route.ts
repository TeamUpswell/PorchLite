import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { debugLog, debugError } from "@/lib/utils/debug";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    debugLog("🗑️ Deleting recommendation:", id);

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("recommendations")
      .delete()
      .eq("id", id);

    if (error) {
      debugError("❌ Error deleting recommendation:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    debugLog("✅ Recommendation deleted successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    debugError("❌ Server error deleting recommendation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    debugLog("📝 Updating recommendation:", id, body);

    const { data, error } = await supabase
      .from("recommendations")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      debugError("❌ Error updating recommendation:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    debugLog("✅ Recommendation updated successfully");
    return NextResponse.json(data);
  } catch (error) {
    debugError("❌ Server error updating recommendation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
