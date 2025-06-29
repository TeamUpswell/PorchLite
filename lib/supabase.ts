import { createClient } from "@supabase/supabase-js";
import { debugLog, debugError } from "@/lib/utils/debug";

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
  debugLog("🔧 Supabase initialized successfully");
  debugLog("🔧 URL:", supabaseUrl);
  debugLog("🔧 Key preview:", supabaseKey.substring(0, 20) + "...");
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
      debugError("🚨 Supabase connection test failed:", error.message);
    } else {
      debugLog("✅ Supabase connection test passed");
    }
  }).catch((error) => {
    debugError("🚨 Supabase initialization error:", error);
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
  debugError("Supabase error:", error);
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
      debugError("Error details:", error.details);
      debugError(`Error exploring ${tableName}:`, error);
      return null;
    }

    if (!data || data.length === 0) {
      debugLog(`No data found in ${tableName}`);
      return null;
    }

    const columns = Object.keys(data[0]);
    debugLog(`${tableName} columns:`, columns);
    return columns;
  } catch (err) {
    debugError(`Error exploring ${tableName}:`, err);
    return null;
  }
};

// Test Supabase connection function
export async function testSupabaseConnection() {
  debugLog("🔍 Testing Supabase connection...");

  try {
    debugLog("📡 Supabase client:", supabase);
    debugLog("📡 Supabase URL:", supabase.supabaseUrl);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    debugLog("👤 Current session:", session);
    if (sessionError) debugLog("❌ Session error:", sessionError);

    const { data, error } = await supabase
      .from("properties")
      .select("count")
      .limit(1);
    debugLog("✅ Test query result:", data);
    if (error) debugLog("❌ Test query error:", error);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    debugLog("👤 Current user:", user);
    if (userError) debugLog("❌ User error:", userError);

    return { session, user, data, error };
  } catch (err) {
    debugError("💥 Supabase test failed:", err);
    return { error: err };
  }
};

// Debug function
export function debugSupabaseConfig() {
  debugLog("🔧 === SUPABASE CONFIG DEBUG ===");
  debugLog("🔧 URL from env:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  debugLog(
    "🔧 Key from env (first 20):",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)
  );
  debugLog("🔧 Client instance:", supabase);
  debugLog("🔧 Client auth:", supabase.auth);
  debugLog("🔧 Client rest URL:", supabase.restUrl);
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    keyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20),
    client: supabase,
  };
}