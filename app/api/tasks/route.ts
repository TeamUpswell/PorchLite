import { NextRequest, NextResponse } from "next/server"; // ADD: NextRequest import
import { supabase } from "@/lib/supabase";

// ADD: Interface for type safety
interface TaskRequest {
  title: string;
  description?: string;
  due_date?: string;
  priority?: "low" | "medium" | "high";
  status?: "pending" | "in_progress" | "completed";
  property_id?: string;
}

interface TaskUpdateRequest extends Partial<TaskRequest> {
  id: string;
}

// Handler for GET requests to retrieve tasks
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ tasks: data });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// CHANGE: Request → NextRequest
export async function POST(request: NextRequest) {
  try {
    const body: TaskRequest = await request.json();

    const { data, error } = await supabase
      .from("tasks")
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ task: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

// CHANGE: Request → NextRequest
export async function PUT(request: NextRequest) {
  try {
    const body: TaskUpdateRequest = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ task: data });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// CHANGE: Request → NextRequest
export async function DELETE(request: NextRequest) {
  try {
    const { id }: { id: string } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
