import { createClient } from "@supabase/supabase-js";

export async function resetUserAndRecreate(
  userId: string,
  email: string,
  newPassword: string
) {
  console.log("Starting user reset process for:", userId);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase URL or service key");
    return { success: false, error: "Configuration error" };
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("1. Deleting user data from tables...");
    // Delete in correct order (child records first)
    try {
      await adminSupabase.from("notes").delete().eq("user_id", userId);
      console.log("Notes deleted");
    } catch (e) {
      console.log("Note deletion error:", e);
    }

    try {
      await adminSupabase.from("tasks").delete().eq("created_by", userId);
      console.log("Tasks (created_by) deleted");
    } catch (e) {
      console.log("Tasks (created_by) deletion error:", e);
    }

    try {
      await adminSupabase.from("tasks").delete().eq("assigned_to", userId);
      console.log("Tasks (assigned_to) deleted");
    } catch (e) {
      console.log("Tasks (assigned_to) deletion error:", e);
    }

    try {
      await adminSupabase.from("inventory").delete().eq("user_id", userId);
      console.log("Inventory deleted");
    } catch (e) {
      console.log("Inventory deletion error:", e);
    }

    try {
      await adminSupabase.from("reservations").delete().eq("user_id", userId);
      console.log("Reservations deleted");
    } catch (e) {
      console.log("Reservations deletion error:", e);
    }

    try {
      await adminSupabase.from("user_roles").delete().eq("user_id", userId);
      console.log("User roles deleted");
    } catch (e) {
      console.log("User roles deletion error:", e);
    }

    try {
      await adminSupabase.from("profiles").delete().eq("id", userId);
      console.log("Profile deleted");
    } catch (e) {
      console.log("Profile deletion error:", e);
    }

    console.log("2. Deleting user from Auth...");
    const { error: authDeleteError } =
      await adminSupabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("Error deleting user from Auth:", authDeleteError);
      throw authDeleteError;
    }

    console.log("3. Creating new user...");
    const { data, error: createError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password: newPassword,
        email_confirm: true,
      });

    if (createError) {
      console.error("Error creating new user:", createError);
      throw createError;
    }

    console.log("4. Creating profile and role for new user...");
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
      console.error("Error creating profile:", profileError);
      throw profileError;
    }

    const { error: roleError } = await adminSupabase.from("user_roles").insert({
      user_id: newUserId,
      role: "owner",
    });

    if (roleError) {
      console.error("Error creating role:", roleError);
      throw roleError;
    }

    console.log("User successfully reset with new ID:", newUserId);
    return { success: true, userId: newUserId };
  } catch (error) {
    console.error("Error in resetUserAndRecreate:", error);
    return { success: false, error };
  }
}
