import { createClient } from "@supabase/supabase-js";

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Only basic logging in development
if (process.env.NODE_ENV === "development") {
  console.log("🔧 Supabase initialized");
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// TypeScript types
export type SupabaseError = {
  error: string;
  data: null;
};

// Legacy function for backwards compatibility
export function getSupabase() {
  return supabase;
}

// Add this export for server-side operations
export function getSupabaseClient() {
  return supabase;
}

// Error handling helper function
export function handleSupabaseError(error: any): SupabaseError {
  console.error("Supabase error:", error);
  return {
    error: error.message || "An unexpected error occurred",
    data: null,
  };
}

// Helper function to explore table schemas
export const exploreTableSchema = async (tableName: string) => {
  try {
    const { data, error } = await supabase.from(tableName).select("*").limit(1);

    if (error) {
      console.error("Error details:", error.details);
      console.error(`Error exploring ${tableName}:`, error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`No data found in ${tableName}`);
      return null;
    }

    const columns = Object.keys(data[0]);
    console.log(`${tableName} columns:`, columns);
    return columns;
  } catch (err) {
    console.error(`Error exploring ${tableName}:`, err);
    return null;
  }
};

// Test Supabase connection function
export async function testSupabaseConnection() {
  console.log("🔍 Testing Supabase connection...");

  try {
    console.log("📡 Supabase client:", supabase);
    console.log("📡 Supabase URL:", supabase.supabaseUrl);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log("👤 Current session:", session);
    console.log("❌ Session error:", sessionError);

    const { data, error } = await supabase
      .from("properties")
      .select("count")
      .limit(1);
    console.log("✅ Test query result:", data);
    console.log("❌ Test query error:", error);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    console.log("👤 Current user:", user);
    console.log("❌ User error:", userError);

    return { session, user, data, error };
  } catch (err) {
    console.error("💥 Supabase test failed:", err);
    return { error: err };
  }
}

// Debug function
export function debugSupabaseConfig() {
  console.log("🔧 === SUPABASE CONFIG DEBUG ===");
  console.log("🔧 URL from env:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(
    "🔧 Key from env (first 20):",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)
  );
  console.log("🔧 Client instance:", supabase);
  console.log("🔧 Client auth:", supabase.auth);
  console.log("🔧 Client rest URL:", supabase.restUrl);
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    keyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20),
    client: supabase,
  };
}

// Only call debug in development
if (process.env.NODE_ENV === "development") {
  debugSupabaseConfig();
}
