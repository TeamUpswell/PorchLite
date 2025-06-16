import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Initialize Supabase with admin privileges using environment variables
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Interface for type safety
interface UserRoleRequest {
  userId: string;
  role: string;
  action: "add" | "remove";
}

export async function GET(request: NextRequest) {
  try {
    // Create client inside the function
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get user roles from your roles table
    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("*");

    if (rolesError) {
      return NextResponse.json({ error: rolesError.message }, { status: 500 });
    }

    // Combine user data with roles
    const usersWithRoles = data.users.map((user) => {
      const userRoles = rolesData
        .filter((role) => role.user_id === user.id)
        .map((role) => role.role);

      return {
        ...user,
        roles: userRoles,
      };
    });

    return NextResponse.json({ users: usersWithRoles });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { userId, role, action }: UserRoleRequest = await request.json();

    if (!userId || !role || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (action === "add") {
      const { error } = await supabaseAdmin.from("user_roles").upsert({
        user_id: userId,
        role,
        assigned_at: new Date().toISOString(),
      });

      if (error) throw error;
    } else if (action === "remove") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .match({ user_id: userId, role });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error managing user role:", error);
    return NextResponse.json(
      { error: "Failed to manage user role" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Implementation for updating a user role if needed
}

export async function DELETE(request: NextRequest) {
  // Implementation for deleting a user role if needed
}
