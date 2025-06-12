import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

interface CalendarEventRequest {
  title: string;
  start_date: string;
  end_date: string;
  property_id?: string;
}

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get reservations
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("start_date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reservations: data });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    const body: CalendarEventRequest = await request.json();

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add user_id to reservation data
    const reservationData = {
      ...body,
      user_id: session.user.id,
    };

    // Insert reservation
    const { data, error } = await supabase
      .from("reservations")
      .insert([reservationData])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reservation: data[0] });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
