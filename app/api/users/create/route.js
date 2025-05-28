import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const requestData = await request.json();
    console.log("Creating user with data:", requestData);

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Create the auth user first with service role (without a password)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: requestData.email,
        email_confirm: true,
        password: null, // No password, will require user to set it
        user_metadata: {
          full_name: requestData.full_name,
          role: requestData.role,
        },
      });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;
    console.log("User created successfully with ID:", userId);

    // 2. Create profile using the new user's ID
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        full_name: requestData.full_name,
        email: requestData.email,
        phone_number: requestData.phone_number,
        address: requestData.address,
        show_in_contacts: requestData.show_in_contacts,
        role: requestData.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Profile error:", profileError);
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    // 3. Add user role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: requestData.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assigned_at: new Date().toISOString(),
    });

    if (roleError) {
      console.error("Role error:", roleError);
      // Don't fail the whole operation if just the role fails
    }

    // 4. Send invitation email after everything is set up
    console.log("Sending invitation email to:", requestData.email);
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(requestData.email, {
        redirectTo: process.env.NEXT_PUBLIC_BASE_URL
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('.supabase.co', '.vercel.app')}/auth/callback`,
        data: {
          property_name:
            process.env.NEXT_PUBLIC_PROPERTY_NAME || "Your Property",
        },
      });

    if (inviteError) {
      console.error("Invite error:", inviteError);
      // Continue anyway since the user is already created
    } else {
      console.log("Invitation sent successfully");
    }

    return NextResponse.json({
      success: true,
      userId,
      inviteSent: !inviteError,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
