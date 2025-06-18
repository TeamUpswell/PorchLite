"use client";

import { useAuth } from "@/components/auth";
import { useEffect, useRef } from "react";

export default function AuthStateMonitor() {
  const auth = useAuth();
  const lastAuthState = useRef<any>(null);
  const checkCount = useRef(0);

  useEffect(() => {
    checkCount.current++;
    
    const currentState = {
      hasUser: !!auth.user,
      hasSession: !!auth.session,
      loading: auth.loading,
      initialized: auth.initialized,
      userId: auth.user?.id,
      sessionExpiry: auth.session?.expires_at
    };

    if (lastAuthState.current && lastAuthState.current.hasUser && !currentState.hasUser) {
      console.error('🚨 USER LOST UNEXPECTEDLY:', {
        previous: lastAuthState.current,
        current: currentState,
        checkCount: checkCount.current,
        timestamp: new Date().toISOString()
      });
      
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'auth_state_loss',
            previous: lastAuthState.current,
            current: currentState,
            timestamp: new Date().toISOString()
          })
        }).catch(() => {});
      }
    }

    if (currentState.sessionExpiry) {
      const expiryTime = new Date(currentState.sessionExpiry * 1000);
      const now = new Date();
      const timeToExpiry = expiryTime.getTime() - now.getTime();
      
      if (timeToExpiry < 60000 && timeToExpiry > 0) {
        console.warn('⚠️ Session expiring soon:', {
          expiresAt: expiryTime.toISOString(),
          timeToExpiry: Math.round(timeToExpiry / 1000) + 's'
        });
      }
    }

    lastAuthState.current = currentState;
  }, [auth.user, auth.session, auth.loading, auth.initialized]);

  return null;
}