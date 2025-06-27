import { supabase } from "./supabase";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  exponentialBackoff: true,
  onRetry: (attempt, error) => {
    console.warn(
      `🔄 Retry attempt ${attempt} due to:`,
      error?.message || error
    );
  },
};

/**
 * Enhanced function to handle Supabase queries with automatic session refresh and retry logic
 */
export async function withSessionRetry<T>(
  queryFn: () => PostgrestFilterBuilder<any, any, any>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      // Check session before query
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        console.warn("⚠️ Session invalid, attempting refresh...");

        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          throw new Error(`Session refresh failed: ${refreshError.message}`);
        }
      }

      // Execute the query
      const result = await queryFn();

      // Check for auth-related errors
      if (
        result.error?.code === "PGRST301" ||
        result.error?.message?.includes("JWT")
      ) {
        throw new Error("Authentication error");
      }

      // Return successful result
      return { data: result.data as T, error: result.error };
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === config.maxAttempts) {
        break;
      }

      // Call retry callback
      config.onRetry(attempt, error);

      // Calculate delay (with exponential backoff if enabled)
      const delay = config.exponentialBackoff
        ? config.delay * Math.pow(2, attempt - 1)
        : config.delay;

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All attempts failed
  console.error(
    `❌ All ${config.maxAttempts} attempts failed. Last error:`,
    lastError
  );
  return { data: null, error: lastError };
}

/**
 * Simplified wrapper for common query patterns
 */
export const apiHelpers = {
  /**
   * Get data with automatic retry
   */
  async get<T>(
    table: string,
    filters?: Record<string, any>,
    options?: RetryOptions
  ): Promise<{ data: T[] | null; error: any }> {
    return withSessionRetry(() => {
      let query = supabase.from(table).select("*");

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        });
      }

      return query;
    }, options);
  },

  /**
   * Get single record with automatic retry
   */
  async getOne<T>(
    table: string,
    id: string,
    options?: RetryOptions
  ): Promise<{ data: T | null; error: any }> {
    const result = await withSessionRetry(
      () => supabase.from(table).select("*").eq("id", id).single(),
      options
    );

    return { data: result.data as T, error: result.error };
  },

  /**
   * Insert data with automatic retry
   */
  async insert<T>(
    table: string,
    data: any,
    options?: RetryOptions
  ): Promise<{ data: T | null; error: any }> {
    return withSessionRetry(
      () => supabase.from(table).insert(data).select().single(),
      options
    );
  },

  /**
   * Update data with automatic retry
   */
  async update<T>(
    table: string,
    id: string,
    data: any,
    options?: RetryOptions
  ): Promise<{ data: T | null; error: any }> {
    return withSessionRetry(
      () => supabase.from(table).update(data).eq("id", id).select().single(),
      options
    );
  },

  /**
   * Delete data with automatic retry
   */
  async delete(
    table: string,
    id: string,
    options?: RetryOptions
  ): Promise<{ data: any; error: any }> {
    return withSessionRetry(
      () => supabase.from(table).delete().eq("id", id),
      options
    );
  },
};

/**
 * Helper to ensure consistent API parameter naming
 * Converts camelCase frontend state to snake_case for API calls
 */
export function createApiParams(params: Record<string, any>): URLSearchParams {
  const apiParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Convert property_id to property_id for API consistency
      const apiKey = key === "property_id" ? "property_id" : key;
      apiParams.append(apiKey, String(value));
    }
  });

  return apiParams;
}

// Usage example:
const params = createApiParams({
  property_id: currentProperty.id, // Frontend uses camelCase
  userId: user.id,
});
// Results in: ?property_id=xxx&userId=xxx

/**
 * Example usage in your existing functions
 */
export const fetchUpcomingVisits = async (property_id: string) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const result = await withSessionRetry(() =>
      supabase
        .from("reservations")
        .select("id, title, start_date, end_date, status")
        .eq("property_id", property_id)
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(10)
    );

    if (result.error) {
      console.error("Error fetching visits:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("Exception fetching visits:", error);
    return [];
  }
};
