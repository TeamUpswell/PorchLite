import { createClient } from "@supabase/supabase-js";

// Validate Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseKey) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}`);
}

// Validate key format (basic check)
if (supabaseKey.length < 20) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)");
}

// Only basic logging in development
if (process.env.NODE_ENV === "development") {
  console.log("🔧 Supabase initialized successfully");
  console.log("🔧 URL:", supabaseUrl);
  console.log("🔧 Key preview:", supabaseKey.substring(0, 20) + "...");
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Test the connection on initialization (development only)
if (process.env.NODE_ENV === "development") {
  supabase.auth.getSession().then(({ error }) => {
    if (error) {
      console.error("🚨 Supabase connection test failed:", error.message);
    } else {
      console.log("✅ Supabase connection test passed");
    }
  }).catch((error) => {
    console.error("🚨 Supabase initialization error:", error);
  });
}

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
    if (sessionError) console.log("❌ Session error:", sessionError);

    const { data, error } = await supabase
      .from("properties")
      .select("count")
      .limit(1);
    console.log("✅ Test query result:", data);
    if (error) console.log("❌ Test query error:", error);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    console.log("👤 Current user:", user);
    if (userError) console.log("❌ User error:", userError);

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