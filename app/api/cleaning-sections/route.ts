import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logInfo, logError } from "@/lib/utils/logging";

// Helper to detect common database errors
const handleDatabaseError = (error: any) => {
  // Check for table not found error
  if (error?.code === "42P01" && error?.message?.includes("does not exist")) {
    return {
      code: "TABLE_NOT_FOUND",
      message:
        "The required database table is missing. Please run database migrations.",
      details: error.message,
      status: 500,
    };
  }

  // Permission errors
  if (error?.code === "42501" || error?.code === "28000") {
    return {
      code: "PERMISSION_DENIED",
      message: "Database permission denied. Check your API key permissions.",
      details: error.message,
      status: 403,
    };
  }

  // Default database error
  return {
    code: "DATABASE_ERROR",
    message: "A database error occurred",
    details: error.message,
    status: 500,
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    logInfo("Cleaning sections request body", body);

    // Standardize on property_id (snake_case) to match database schema
    const { property_id, ...otherFields } = body;

    // Validate required fields
    if (!property_id) {
      logError("Missing property ID in request", {
        body: { hasPropertyId: false },
      });
      return NextResponse.json(
        {
          error: "BAD_REQUEST",
          message: "property_id is required",
        },
        { status: 400 }
      );
    }

    logInfo("Looking for cleaning sections for property", { property_id });

    // Use property_id consistently in database operations
    const { data, error } = await supabase
      .from("cleaning_sections")
      .select("*")
      .eq("property_id", property_id)
      .order("order_index");

    if (error) {
      logError("Supabase cleaning sections error", error);

      // Handle specific database errors
      const dbError = handleDatabaseError(error);

      return NextResponse.json(
        {
          error: dbError.code,
          message: dbError.message,
        },
        { status: dbError.status }
      );
    }

    logInfo("Cleaning sections found", { count: data?.length || 0 });
    return NextResponse.json(data || []);
  } catch (error) {
    logError("Cleaning sections API error", error);

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const property_id = searchParams.get("property_id"); // Use snake_case

    if (!property_id) {
      return NextResponse.json(
        { error: "property_id is required" }, // Use snake_case in error message
        { status: 400 }
      );
    }

    logInfo("Looking for cleaning sections for property", { property_id });

    const { data, error } = await supabase
      .from("cleaning_tasks") // or whatever table you're querying
      .select("*")
      .eq("property_id", property_id) // Database uses snake_case
      .order("created_at", { ascending: false });

    if (error) {
      logError("Error fetching cleaning sections", error);
      return NextResponse.json(
        { error: "Failed to fetch cleaning sections" },
        { status: 500 }
      );
    }

    logInfo("GET cleaning sections for property", {
      property_id,
      count: data?.length,
    });
    return NextResponse.json(data);
  } catch (error) {
    logError("Unexpected error in cleaning-sections GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
