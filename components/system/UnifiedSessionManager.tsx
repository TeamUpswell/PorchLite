// components/system/UnifiedSessionManager.tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface SessionHealth {
  isValid: boolean;
  lastCheck: number;
  checkCount: number;
  errors: string[];
}

const SESSION_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

export default function UnifiedSessionManager() {
  const { user, loading } = useAuth();
  const sessionHealthRef = useRef<SessionHealth>({
    isValid: true,
    lastCheck: Date.now(),
    checkCount: 0,
    errors: [],
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Session validation function
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log("🔐 Validating session...");

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("❌ Session validation error:", error);
        sessionHealthRef.current.errors.push(`Session error: ${error.message}`);
        return false;
      }

      if (!session) {
        console.warn("⚠️ No active session found");
        return false;
      }

      // Check if token is close to expiring (within 5 minutes)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt ? expiresAt - now : 0;

      if (timeUntilExpiry < 300) {
        // Less than 5 minutes
        console.log("🔄 Session expiring soon, refreshing...");

        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("❌ Session refresh failed:", refreshError);
          sessionHealthRef.current.errors.push(
            `Refresh error: ${refreshError.message}`
          );
          return false;
        }

        console.log("✅ Session refreshed successfully");
        toast.success("Session refreshed", { duration: 2000 });
      }

      return true;
    } catch (error) {
      console.error("❌ Session validation exception:", error);
      sessionHealthRef.current.errors.push(`Validation exception: ${error}`);
      return false;
    }
  }, []);

  // Session recovery with retry logic
  const recoverSession = useCallback(async (): Promise<boolean> => {
    if (retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
      console.error("❌ Max retry attempts reached, giving up");
      toast.error("Session recovery failed. Please refresh the page.");
      return false;
    }

    retryCountRef.current++;
    console.log(
      `🔄 Attempting session recovery (${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`
    );

    try {
      // Wait before retry
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY * retryCountRef.current)
      );

      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        console.error("❌ Session recovery failed:", error);
        return false;
      }

      console.log("✅ Session recovered successfully");
      retryCountRef.current = 0; // Reset retry count on success
      sessionHealthRef.current.errors = []; // Clear errors
      toast.success("Connection restored");
      return true;
    } catch (error) {
      console.error("❌ Session recovery exception:", error);
      return false;
    }
  }, []);

  // Main session health check
  const performHealthCheck = useCallback(async () => {
    if (loading || !user) {
      return; // Skip check if still loading or no user
    }

    const now = Date.now();
    sessionHealthRef.current.lastCheck = now;
    sessionHealthRef.current.checkCount++;

    console.log(
      `🔍 Session health check #${sessionHealthRef.current.checkCount}`
    );

    const isValid = await validateSession();
    sessionHealthRef.current.isValid = isValid;

    if (!isValid) {
      console.warn("⚠️ Session validation failed, attempting recovery...");

      const recovered = await recoverSession();
      if (!recovered) {
        console.error("❌ Session recovery failed completely");

        // Optionally redirect to login or show error
        // This depends on your app's requirements
        if (retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
          toast.error("Session expired. Redirecting to login...", {
            duration: 5000,
          });

          // Give user a moment to see the message before redirecting
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        }
      }
    } else {
      // Reset retry count on successful validation
      retryCountRef.current = 0;
      sessionHealthRef.current.errors = [];
    }
  }, [loading, user, validateSession, recoverSession]);

  // Setup session monitoring
  useEffect(() => {
    if (!user || loading) {
      return;
    }

    console.log("🚀 Starting session health monitoring");

    // Perform initial check
    performHealthCheck();

    // Setup periodic checks
    intervalRef.current = setInterval(
      performHealthCheck,
      SESSION_CHECK_INTERVAL
    );

    // Setup auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth state changed:", event);

      switch (event) {
        case "SIGNED_OUT":
          console.log("👋 User signed out");
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          break;

        case "TOKEN_REFRESHED":
          console.log("🔄 Token refreshed automatically");
          sessionHealthRef.current.isValid = true;
          sessionHealthRef.current.errors = [];
          retryCountRef.current = 0;
          break;

        case "SIGNED_IN":
          console.log("👋 User signed in");
          sessionHealthRef.current.isValid = true;
          sessionHealthRef.current.errors = [];
          retryCountRef.current = 0;
          break;
      }
    });

    // Cleanup function
    return () => {
      console.log("🛑 Stopping session health monitoring");

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      subscription.unsubscribe();
    };
  }, [user, loading, performHealthCheck]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !loading) {
        console.log("👁️ Page became visible, checking session health");
        performHealthCheck();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, loading, performHealthCheck]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (user && !loading) {
        console.log("🌐 Connection restored, checking session health");
        toast.success("Connection restored");
        performHealthCheck();
      }
    };

    const handleOffline = () => {
      console.log("📡 Connection lost");
      toast.error("Connection lost", { duration: 3000 });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user, loading, performHealthCheck]);

  // This component doesn't render anything
  return null;
}
