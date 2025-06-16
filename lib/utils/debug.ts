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
export const debugLog = debug.log;
export const debugError = debug.error;
export const debugWarn = debug.warn;
export const debugInfo = debug.info;

// Usage in your components:
// import { debugLog, debugError, debugWarn } from '@/lib/utils/debug';
// debugLog('Property data loaded:', currentProperty);
// debugLog("This will only appear in development");
// debugError("This is an error message", errorObject);
// debugWarn("This is a warning message", warningData);
