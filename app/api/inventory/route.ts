import { NextRequest, NextResponse } from "next/server"; // ADD: NextRequest import
import { supabase } from "@/lib/supabase";

// ADD: Interface for type safety
interface InventoryItemRequest {
  name: string;
  description?: string;
  category?: string;
  quantity?: number;
  location?: string;
  purchase_date?: string;
  purchase_price?: number;
  condition?: "excellent" | "good" | "fair" | "poor";
  property_id?: string;
}

interface InventoryUpdateRequest extends Partial<InventoryItemRequest> {
  id: string;
}

// GET: Retrieve all inventory items
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ inventory: data });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// POST: Add a new inventory item
export async function POST(request: NextRequest) {
  try {
    const body: InventoryItemRequest = await request.json();

    const { data, error } = await supabase
      .from("inventory")
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing inventory item
export async function PUT(request: NextRequest) {
  try {
    const body: InventoryUpdateRequest = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Inventory item ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("inventory")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    );
  }
}

// DELETE: Remove an inventory item
export async function DELETE(request: NextRequest) {
  try {
    const { id }: { id: string } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Inventory item ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("inventory").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    );
  }
}
