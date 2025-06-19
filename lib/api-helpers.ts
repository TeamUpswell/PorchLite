import { supabase } from './supabase';

/**
 * Helper function to automatically retry API calls with session refresh
 * when authentication errors occur
 */
export async function withSessionRetry<T>(
  apiCall: () => Promise<{ data: T | null; error: any }>, 
  maxRetries = 1
): Promise<{ data: T | null; error: any }> {
  let retryCount = 0;
  
  async function attempt(): Promise<{ data: T | null; error: any }> {
    try {
      const result = await apiCall();
      
      if (result.error) {
        // Check if error is auth-related (401 Unauthorized)
        if ((result.error.status === 401 || result.error.code === 'PGRST301') && retryCount < maxRetries) {
          console.log(`Auth error detected (${result.error.code || result.error.status}), refreshing session...`);
          // Try to refresh the session
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (!refreshError) {
            // If session refresh was successful, retry the API call
            retryCount++;
            return attempt();
          }
        }
      }
      
      return result;
    } catch (error) {
      // Handle unexpected errors
      console.error("API call exception:", error);
      return { data: null, error };
    }
  }
  
  return attempt();
}