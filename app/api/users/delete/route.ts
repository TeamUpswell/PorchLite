import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const requestData = await request.json();
    const userId = requestData.userId;
    
    // Validate the request
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // First delete from user_roles (to handle foreign key constraints)
    const { error: roleDeleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (roleDeleteError) {
      console.error("Error deleting user role:", roleDeleteError);
      // Continue anyway since the main tables are more important
    }

    // Delete from profiles table
    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.error("Error deleting profile:", profileDeleteError);
      return NextResponse.json(
        { error: `Failed to delete profile: ${profileDeleteError.message}` },
        { status: 500 }
      );
    }

    // Finally delete the user from auth system
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError);
      return NextResponse.json(
        { 
          error: `User removed from profiles but failed to delete from auth: ${authDeleteError.message}`,
          partialSuccess: true 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Server error deleting user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}