"use client";

import { useAuth } from "@/components/auth";
import { useEffect, useRef } from "react";

export default function SessionMonitor() {
  const auth = useAuth();
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const lastSessionCheck = useRef<Date | null>(null);

  useEffect(() => {
    if (!auth.session) return;

    // Check session every 30 seconds
    sessionCheckInterval.current = setInterval(() => {
      const now = new Date();
      lastSessionCheck.current = now;
      
      if (auth.session?.expires_at) {
        const expiryTime = new Date(auth.session.expires_at * 1000);
        const timeToExpiry = expiryTime.getTime() - now.getTime();
        
        console.log('🕐 Session Check:', {
          now: now.toISOString(),
          expires: expiryTime.toISOString(),
          timeToExpiry: Math.round(timeToExpiry / 1000) + 's',
          hasUser: !!auth.user,
          hasSession: !!auth.session
        });
        
        // Warn if session expires soon
        if (timeToExpiry < 120000 && timeToExpiry > 0) { // 2 minutes
          console.warn('⚠️ Session expiring in less than 2 minutes!');
        }
        
        // Error if session expired
        if (timeToExpiry <= 0) {
          console.error('🚨 SESSION EXPIRED!', {
            expired: Math.abs(timeToExpiry / 1000) + 's ago',
            timestamp: now.toISOString()
          });
        }
      }
    }, 30000); // Every 30 seconds

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [auth.session, auth.user]);

  return null;
}