/**
 * Secure logging utility that sanitizes sensitive information
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Fields that should be redacted in logs
const SENSITIVE_FIELDS = [
  'apikey', 'api_key', 'key', 'token', 'jwt', 'password', 'secret',
  'authorization', 'accessToken', 'refreshToken', 'supabaseKey',
  'headers', 'Authorization', 'Bearer', 'apiKey'
];

// Sanitize objects to remove sensitive information
const sanitizeData = (data: any): any => {
  if (!data) return undefined;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  // Handle objects
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    
    for (const key in sanitized) {
      // Redact sensitive fields
      if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } 
      // Recursively sanitize nested objects
      else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    }
    
    return sanitized;
  }
  
  // Return primitives as-is
  return data;
};

// Only enable debug logs in development
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log debug information (development only)
 */
export const logDebug = (message: string, data?: any): void => {
  if (isDevelopment) {
    console.log(`🔍 ${message}`, data ? sanitizeData(data) : '');
  }
};

/**
 * Log general information (development only)
 */
export const logInfo = (message: string, data?: any): void => {
  if (isDevelopment) {
    console.log(`ℹ️ ${message}`, data ? sanitizeData(data) : '');
  }
};

/**
 * Log warnings (all environments, sanitized in production)
 */
export const logWarning = (message: string, data?: any): void => {
  console.warn(`⚠️ ${message}`, isDevelopment && data ? sanitizeData(data) : '');
};

/**
 * Log errors (all environments, sanitized in production)
 */
export const logError = (message: string, error?: any): void => {
  if (isDevelopment) {
    console.error(`❌ ${message}`, error || '');
  } else {
    // In production, just log the message and error type without details
    console.error(`❌ ${message}${error?.code ? ` [${error.code}]` : ''}`);
  }
};

/**
 * Safe version of the Supabase client debug function
 */
export const logSupabaseConfig = (url: string, key: string): void => {
  if (!isDevelopment) return;
  
  console.log('🔧 === SUPABASE CONFIG ===');
  console.log(`🔧 URL: ${url}`);
  
  // Only show first few characters of the key in dev
  if (key && key.length > 8) {
    console.log(`🔧 API Key: ${key.substring(0, 8)}...`);
  } else {
    console.log('🔧 API Key: [Invalid]');
  }
};