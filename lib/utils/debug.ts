const isDevelopment = process.env.NODE_ENV === "development";

export const debug = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log("[DEBUG]", ...args);
    }
  },
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error("[DEBUG ERROR]", ...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn("[DEBUG WARN]", ...args);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info("[DEBUG INFO]", ...args);
    }
  },
};

// Also export individual functions for convenience
export const debugLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

export const debugError = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
};

export const debugWarn = debug.warn;
export const debugInfo = debug.info;

export const logDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    // In development, log the message but sanitize sensitive data
    if (data && typeof data === 'object') {
      console.log(message, JSON.stringify(data, null, 2).slice(0, 200) + '...');
    } else {
      console.log(message, data);
    }
  }
};

// Usage in your components:
// import { debugLog, debugError, debugWarn } from '@/lib/utils/debug';
// debugLog('Property data loaded:', currentProperty);
// debugLog("This will only appear in development");
// debugError("This is an error message", errorObject);
// debugWarn("This is a warning message", warningData);
