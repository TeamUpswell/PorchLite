import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logInfo, logError } from "@/lib/utils/logging";

// Helper to detect common database errors
const handleDatabaseError = (error: any) => {
  // Check for table not found error
  if (error?.code === '42P01' && error?.message?.includes('does not exist')) {
    return {
      code: 'TABLE_NOT_FOUND',
      message: 'The required database table is missing. Please run database migrations.',
      details: error.message,
      status: 500
    };
  }
  
  // Permission errors
  if (error?.code === '42501' || error?.code === '28000') {
    return {
      code: 'PERMISSION_DENIED',
      message: 'Database permission denied. Check your API key permissions.',
      details: error.message,
      status: 403
    };
  }
  
  // Default database error
  return {
    code: 'DATABASE_ERROR',
    message: 'A database error occurred',
    details: error.message,
    status: 500
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    logInfo("Cleaning sections request body", body);

    // Handle both propertyId and property_id
    const propertyId = body.propertyId || body.property_id;

    if (!propertyId) {
      logError("Missing property ID in request", { body: { hasPropertyId: false } });
      return NextResponse.json(
        { 
          error: "BAD_REQUEST", 
          message: "propertyId is required" 
        },
        { status: 400 }
      );
    }

    logInfo("Looking for cleaning sections for property", { propertyId });

    const { data, error } = await supabase
      .from("cleaning_sections")
      .select("*")
      .eq("property_id", propertyId)
      .order("order_index");

    if (error) {
      logError("Supabase cleaning sections error", error);
      
      // Handle specific database errors
      const dbError = handleDatabaseError(error);
      
      return NextResponse.json({ 
        error: dbError.code,
        message: dbError.message
      }, { status: dbError.status });
    }

    logInfo("Cleaning sections found", { count: data?.length || 0 });
    return NextResponse.json(data || []);
  } catch (error) {
    logError("Cleaning sections API error", error);
    
    return NextResponse.json(
      { 
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred" 
      },
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
        { 
          error: "BAD_REQUEST",
          message: "propertyId query parameter is required" 
        },
        { status: 400 }
      );
    }

    logInfo("GET cleaning sections for property", { propertyId });

    const { data, error } = await supabase
      .from("cleaning_sections")
      .select("*")
      .eq("property_id", propertyId)
      .order("order_index");

    if (error) {
      logError("GET cleaning sections error", error);
      
      // Handle specific database errors
      const dbError = handleDatabaseError(error);
      
      return NextResponse.json({ 
        error: dbError.code,
        message: dbError.message
      }, { status: dbError.status });
    }

    logInfo("GET cleaning sections found", { count: data?.length || 0 });
    return NextResponse.json(data || []);
  } catch (error) {
    logError("GET cleaning sections API error", error);
    
    return NextResponse.json(
      { 
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred" 
      },
      { status: 500 }
    );
  }
}