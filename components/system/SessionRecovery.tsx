'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SessionRecovery() {
  const router = useRouter();
  const lastActivityTime = useRef(Date.now());
  const isRefreshing = useRef(false);
  const isDebugEnabled = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Track user activity
    const updateActivity = () => {
      lastActivityTime.current = Date.now();
    };

    // Handle when the page becomes visible again
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const inactiveTime = Date.now() - lastActivityTime.current;
        
        // If inactive for more than 5 minutes, check session
        if (inactiveTime > 5 * 60 * 1000 && !isRefreshing.current) {
          if (isDebugEnabled) {
            console.log("🔄 App was inactive for", Math.round(inactiveTime / 1000), "seconds, checking session...");
          }
          
          isRefreshing.current = true;
          try {
            // Try to refresh the session
            const { error } = await supabase.auth.refreshSession();
            
            if (error) {
              console.error("Session refresh failed:", error);
              // If refresh fails, reload the page
              window.location.reload();
            } else {
              if (isDebugEnabled) {
                console.log("✅ Session refreshed successfully");
              }
              // Force refresh current route
              router.refresh();
            }
          } catch (e) {
            console.error("Error refreshing session:", e);
            window.location.reload();
          } finally {
            isRefreshing.current = false;
          }
        }
        
        updateActivity();
      }
    };

    // Handle network reconnection
    const handleOnline = () => {
      if (isDebugEnabled) {
        console.log("🌐 Network connection restored");
      }
      if (document.visibilityState === 'visible') {
        // When network reconnects, refresh the route
        router.refresh();
      }
    };

    // Event listeners for various user activities
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', () => {
      if (isDebugEnabled) {
        console.log("📵 Network connection lost");
      }
    });
    
    // User activity tracking
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check session status periodically when tab is visible
    const intervalCheck = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const inactiveTime = Date.now() - lastActivityTime.current;
        
        // If inactive for more than 15 minutes, force refresh
        if (inactiveTime > 15 * 60 * 1000) {
          if (isDebugEnabled) {
            console.log("⚠️ Extended inactivity detected, refreshing page");
          }
          window.location.reload();
        }
      }
    }, 60000); // Check every minute

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', () => {});
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      
      clearInterval(intervalCheck);
    };
  }, [router, isDebugEnabled]);

  return null; // This component doesn't render anything
}