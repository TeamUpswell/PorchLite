import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Singleton pattern to ensure only one instance
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
};

// Export the instance
export const supabase = getSupabase();

// Add this export for server-side operations
export function getSupabaseClient() {
  return supabase;
}

// Error handling helper function
export function handleSupabaseError(error: any) {
  console.error("Supabase error:", error);
  return {
    error: error.message || "An unexpected error occurred",
    data: null,
  };
}

// Helper function to explore table schemas
export const exploreTableSchema = async (tableName: string) => {
  try {
    // Get a single row to examine structure
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

    // Log column names
    const columns = Object.keys(data[0]);
    console.log(`${tableName} columns:`, columns);

    return columns;
  } catch (err) {
    console.error(`Error exploring ${tableName}:`, err);
    return null;
  }
};

// Create a storage bucket for property images
export async function createStorageBuckets() {
  const { data, error } = await supabase.storage.createBucket("properties", {
    public: true,
    fileSizeLimit: 10485760, // 10MB limit
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  if (error) {
    console.error("Error creating storage bucket:", error);
  }
}

// Add validation helpers like this to your supabase.ts
export const validateDatabaseRecord = (
  data: any,
  requiredFields: string[]
): boolean => {
  return requiredFields.every(
    (field) => data[field] !== undefined && data[field] !== null
  );
};
