import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log("🔐 Auth: Starting initialization...");
        
        // Check initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Auth: Session check failed:", error);
          if (mounted) {
            setUser(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (session?.user) {
          console.log("✅ Session restored for:", session.user.email);
          if (mounted) {
            setUser(session.user);
          }
        } else {
          console.log("🔐 No active session found");
          if (mounted) {
            setUser(null);
          }
        }

      } catch (error) {
        console.error("❌ Auth initialization error:", error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // ✅ ADD: Session monitoring with timeout detection
    const monitorSession = () => {
      const checkSession = async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("⚠️ Session check failed:", error);
            // Don't auto-logout on network errors, just log
            return;
          }

          if (!session && user) {
            console.log("🔐 Session expired, logging out user");
            if (mounted) {
              setUser(null);
              // Optionally redirect to login
              window.location.href = '/login';
            }
          }
        } catch (error) {
          console.error("⚠️ Session monitoring error:", error);
        }
      };

      // Check session every 5 minutes
      const interval = setInterval(checkSession, 5 * 60 * 1000);
      return () => clearInterval(interval);
    };

    initializeAuth();
    const stopMonitoring = monitorSession();

    // ✅ AUTH STATE LISTENER with cleanup
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔐 Auth event: ${event}`, session?.user?.email || 'No user');
        
        if (!mounted) return;

        switch (event) {
          case 'SIGNED_IN':
            setUser(session?.user || null);
            console.log("✅ User signed in:", session?.user?.email);
            break;
            
          case 'SIGNED_OUT':
            setUser(null);
            console.log("👋 User signed out");
            break;
            
          case 'TOKEN_REFRESHED':
            setUser(session?.user || null);
            console.log("🔄 Token refreshed for:", session?.user?.email);
            break;
            
          default:
            console.log(`🔐 Unhandled auth event: ${event}`);
        }
      }
    );

    // ✅ CLEANUP function
    return () => {
      mounted = false;
      subscription.unsubscribe();
      stopMonitoring();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, initialized }}>
      {children}
    </AuthContext.Provider>
  );
}