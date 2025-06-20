"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function SessionMonitor() {
  const auth = useAuth();
  const router = useRouter();
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const lastSessionCheck = useRef<Date | null>(null);
  const isRefreshing = useRef(false);
  const [lastRefreshResult, setLastRefreshResult] = useState<{
    success: boolean;
    timestamp: Date;
  } | null>(null);

  // Add visibility change handler to detect when user returns to the page
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        // If the user returns to the page, check if session is still valid
        const now = new Date();

        // If we haven't checked session in over 1 minute or the session might be expired
        if (
          !lastSessionCheck.current ||
          now.getTime() - lastSessionCheck.current.getTime() > 60000
        ) {
          if (!isRefreshing.current) {
            isRefreshing.current = true;
            try {
              // Try to refresh the session
              await auth.refreshSession?.();
              lastSessionCheck.current = new Date();
              setLastRefreshResult({ success: true, timestamp: new Date() });

              // Use router.refresh() instead of full page reload when possible
              router.refresh();
            } catch (error) {
              console.error("Session refresh failed:", error);
              setLastRefreshResult({ success: false, timestamp: new Date() });

              // If session refresh fails, reload the page
              window.location.reload();
            } finally {
              isRefreshing.current = false;
            }
          }
        }
      }
    };

    // Handle network reconnection
    const handleOnline = () => {
      if (document.visibilityState === "visible") {
        console.log("🌐 Network connection restored");

        // Try to refresh the route instead of full page reload
        try {
          router.refresh();

          // Also refresh session when network reconnects
          if (!isRefreshing.current) {
            isRefreshing.current = true;
            auth
              .refreshSession?.()
              .then(() => {
                setLastRefreshResult({ success: true, timestamp: new Date() });
              })
              .catch(() => {
                setLastRefreshResult({ success: false, timestamp: new Date() });
              })
              .finally(() => {
                isRefreshing.current = false;
              });
          }
        } catch (e) {
          // Fall back to full reload if refresh fails
          window.location.reload();
        }
      }
    };

    const handleOffline = () => {
      console.log("📵 Network connection lost");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [auth, router]);

  // Keep the existing interval check functionality
  useEffect(() => {
    if (!auth.session) return;

    // Check session every 30 seconds
    sessionCheckInterval.current = setInterval(() => {
      const now = new Date();
      lastSessionCheck.current = now;

      if (auth.session?.expires_at) {
        const expiryTime = new Date(auth.session.expires_at * 1000);
        const timeToExpiry = expiryTime.getTime() - now.getTime();

        const isDebug = process.env.NODE_ENV === "development";
        if (isDebug) {
          console.log("🕐 Session Check:", {
            now: now.toISOString(),
            expires: expiryTime.toISOString(),
            timeToExpiry: Math.round(timeToExpiry / 1000) + "s",
            hasUser: !!auth.user,
            hasSession: !!auth.session,
          });
        }

        // Warn if session expires soon
        if (timeToExpiry < 120000 && timeToExpiry > 0) {
          // 2 minutes
          console.warn("⚠️ Session expiring in less than 2 minutes!");

          // Try to refresh the session when it's about to expire
          if (!isRefreshing.current) {
            isRefreshing.current = true;
            auth
              .refreshSession?.()
              .then(() => {
                setLastRefreshResult({ success: true, timestamp: new Date() });
              })
              .catch((error) => {
                console.error("Failed to refresh session:", error);
                setLastRefreshResult({ success: false, timestamp: new Date() });
              })
              .finally(() => {
                isRefreshing.current = false;
              });
          }
        }

        // Error if session expired
        if (timeToExpiry <= 0) {
          console.error("🚨 SESSION EXPIRED!", {
            expired: Math.abs(timeToExpiry / 1000) + "s ago",
            timestamp: now.toISOString(),
          });

          // Try one last refresh before reloading
          if (!isRefreshing.current) {
            isRefreshing.current = true;
            auth
              .refreshSession?.()
              .then(() => {
                setLastRefreshResult({ success: true, timestamp: new Date() });
                router.refresh(); // Use router refresh if refresh succeeds
              })
              .catch(() => {
                // Reload the page if session is expired and refresh fails
                window.location.reload();
              })
              .finally(() => {
                isRefreshing.current = false;
              });
          } else {
            // If already refreshing, wait a bit then reload
            setTimeout(() => window.location.reload(), 3000);
          }
        }
      }
    }, 30000); // Every 30 seconds

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [auth.session, auth.user, auth, router]);

  return null;
}
