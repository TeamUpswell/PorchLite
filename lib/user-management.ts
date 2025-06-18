import { createClient } from "@supabase/supabase-js";

// ✅ Helper for development-only logging
const logInfo = (message: string, ...data: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...data);
  }
};

// ✅ Helper for error logging (always log errors, but conditionally include details)
const logError = (message: string, error: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error);
  } else {
    console.error(message);
  }
};

export async function resetUserAndRecreate(
  userId: string,
  email: string,
  newPassword: string
) {
  // ✅ Removed console.log
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    // ✅ Use helper for error logging
    logError("Missing Supabase URL or service key", null);
    return { success: false, error: "Configuration error" };
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ✅ Removed console.log
    
    // Delete in correct order (child records first)
    try {
      await adminSupabase.from("notes").delete().eq("user_id", userId);
      // ✅ Removed console.log
    } catch (e) {
      // ✅ Use helper for error logging
      logError("Note deletion error", e);
    }

    try {
      await adminSupabase.from("tasks").delete().eq("created_by", userId);
      // ✅ Removed console.log
    } catch (e) {
      // ✅ Use helper for error logging
      logError("Tasks (created_by) deletion error", e);
    }

    try {
      await adminSupabase.from("tasks").delete().eq("assigned_to", userId);
      // ✅ Removed console.log
    } catch (e) {
      // ✅ Use helper for error logging
      logError("Tasks (assigned_to) deletion error", e);
    }

    try {
      await adminSupabase.from("inventory").delete().eq("user_id", userId);
      // ✅ Removed console.log
    } catch (e) {
      // ✅ Use helper for error logging
      logError("Inventory deletion error", e);
    }

    try {
      await adminSupabase.from("reservations").delete().eq("user_id", userId);
      // ✅ Removed console.log
    } catch (e) {
      // ✅ Use helper for error logging
      logError("Reservations deletion error", e);
    }

    try {
      await adminSupabase.from("user_roles").delete().eq("user_id", userId);
      // ✅ Removed console.log
    } catch (e) {
      // ✅ Use helper for error logging
      logError("User roles deletion error", e);
    }

    try {
      await adminSupabase.from("profiles").delete().eq("id", userId);
      // ✅ Removed console.log
    } catch (e) {
      // ✅ Use helper for error logging
      logError("Profile deletion error", e);
    }

    // ✅ Removed console.log
    
    const { error: authDeleteError } =
      await adminSupabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      // ✅ Use helper for error logging
      logError("Error deleting user from Auth", authDeleteError);
      throw authDeleteError;
    }

    // ✅ Removed console.log
    
    const { data, error: createError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password: newPassword,
        email_confirm: true,
      });

    if (createError) {
      // ✅ Use helper for error logging
      logError("Error creating new user", createError);
      throw createError;
    }

    // ✅ Removed console.log
    
    const newUserId = data.user.id;

    const { error: profileError } = await adminSupabase
      .from("profiles")
      .insert({
        id: newUserId,
        full_name: "Drew R Bernard",
        email: email,
        avatar_url: "",
        phone_number: "",
      });

    if (profileError) {
      // ✅ Use helper for error logging
      logError("Error creating profile", profileError);
      throw profileError;
    }

    const { error: roleError } = await adminSupabase.from("user_roles").insert({
      user_id: newUserId,
      role: "owner",
    });

    if (roleError) {
      // ✅ Use helper for error logging
      logError("Error creating role", roleError);
      throw roleError;
    }

    // ✅ Removed console.log
    
    return { success: true, userId: newUserId };
  } catch (error) {
    // ✅ Use helper for error logging
    logError("Error in resetUserAndRecreate", error);
    return { success: false, error };
  }
}