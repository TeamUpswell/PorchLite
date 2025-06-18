"use client";

import { useEffect } from 'react';

export default function ClientErrorTracker() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Unhandled JavaScript Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'javascript_error',
            message: event.message,
            stack: event.error?.stack,
            url: window.location.href,
            timestamp: new Date().toISOString()
          })
        }).catch(() => {});
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Unhandled Promise Rejection:', {
        reason: event.reason,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'promise_rejection',
            reason: String(event.reason),
            url: window.location.href,
            timestamp: new Date().toISOString()
          })
        }).catch(() => {});
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}