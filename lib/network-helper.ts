import { supabase } from './supabase';

interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Enhanced wrapper for Supabase requests with timeout and retry logic
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retry logic for failed requests
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RequestOptions = {}
): Promise<T> {
  const { retries = 3, retryDelay = 1000 } = options;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
  
  throw new Error('All retry attempts failed');
}

/**
 * Enhanced Supabase request with timeout and retry
 */
export async function robustSupabaseRequest<T>(
  requestFn: () => Promise<{ data: T; error: any }>,
  options: { timeout?: number; retries?: number } = {}
) {
  const { timeout = 5000, retries = 1 } = options; // Reduced timeout and retries

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout)
      );

      const result = await Promise.race([requestFn(), timeoutPromise]);
      return result;
    } catch (error) {
      if (attempt === retries) {
        // Only log on final failure
        if (process.env.NODE_ENV === 'development') {
          console.error('Final request failed:', error);
        }
        throw error;
      }
      // Small delay between retries
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('All retry attempts failed');
}

/**
 * Session refresh with proper timeout handling
 */
export async function refreshSessionSafely(): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await withTimeout(
      supabase.auth.refreshSession(),
      8000 // 8 second timeout for session refresh
    );
    
    if (result.error) {
      console.error('Session refresh failed:', result.error);
      return { success: false, error: result.error.message };
    }
    
    console.log('✅ Session refreshed successfully');
    return { success: true };
  } catch (error) {
    console.error('Session refresh timed out or failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Session refresh failed' 
    };
  }
}

/**
 * Test network connectivity to Supabase
 */
export async function testSupabaseConnection() {
  try {
    // Simplified connection test
    const result = await robustSupabaseRequest(
      () => supabase.from('properties').select('id').limit(1),
      { timeout: 3000, retries: 0 }
    );
    return { connected: !result.error };
  } catch {
    return { connected: false };
  }
}