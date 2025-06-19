// components/system/UnifiedSessionManager.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UnifiedSessionManager() {
  const router = useRouter();
  const hasInitialized = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (process.env.NODE_ENV === "development") {
      console.log("🔧 UnifiedSessionManager initialized");
    }

    // Basic session health check every 5 minutes (not every 2 minutes)
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        // Only check if user is actively using the app
        const lastActivity = Date.now() - (window as any).lastActivity || 0;
        if (lastActivity < 10 * 60 * 1000) {
          // 10 minutes
          // Optionally refresh if needed
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Track activity
    const updateActivity = () => {
      (window as any).lastActivity = Date.now();
    };

    const events = ["click", "keydown", "scroll"];
    events.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      events.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });

      if (process.env.NODE_ENV === "development") {
        console.log("🔧 UnifiedSessionManager cleaned up");
      }

      hasInitialized.current = false;
    };
  }, []); // Empty dependency array is crucial

  return null;
}
