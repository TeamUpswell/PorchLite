import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create supabaseAdmin directly in the API route for reliability
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ✅ SINGLE POST FUNCTION - Remove the duplicate
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables in API route");
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase credentials" },
        { status: 500 }
      );
    }

    // Create client directly in the request handler
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { userId, userData } = await request.json();

    // Validate required fields
    if (!userId || !userData) {
      return NextResponse.json(
        { error: "userId and userData are required" },
        { status: 400 }
      );
    }

    // 1. Update auth user
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email: userData.email,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role,
        },
      }
    );

    if (authError) throw authError;

    // 2. ALSO update user_roles table
    const { data: roleData, error: roleCheckError } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", userId);

    if (roleCheckError) throw roleCheckError;

    // Update or insert role data
    if (roleData && roleData.length > 0) {
      const { error: roleUpdateError } = await supabaseAdmin
        .from("user_roles")
        .update({
          role: userData.role,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (roleUpdateError) throw roleUpdateError;
    } else {
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: userId,
          role: userData.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assigned_at: new Date().toISOString(),
        });

      if (roleInsertError) throw roleInsertError;
    }

    // 3. Also update the profiles table (including avatar_url)
    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: userData.full_name,
        email: userData.email,
        phone_number: userData.phone_number,
        address: userData.address,
        show_in_contacts: userData.show_in_contacts,
        avatar_url: userData.avatar_url, // ✅ Make sure this line exists
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError);
      throw profileUpdateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API route error:", error);
    
    // ✅ Proper error handling
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}

// ✅ GET function with proper typing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID parameter is required" },
        { status: 400 }
      );
    }

    // Add your GET logic here
    // Example: fetch user by id
    
    return NextResponse.json({ message: "Success", id });
  } catch (error) {
    console.error("GET error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ✅ PUT function with proper typing
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Add validation
    if (!body) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    // Add your PUT logic here

    return NextResponse.json({ message: "Updated", data: body });
  } catch (error) {
    console.error("PUT error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ✅ DELETE function with proper typing
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID parameter is required" },
        { status: 400 }
      );
    }

    // Add your DELETE logic here

    return NextResponse.json({ message: "Deleted", id });
  } catch (error) {
    console.error("DELETE error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
