"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name?: string;
  phone_number?: string;
  email?: string;
  avatar_url?: string;
  role?: string;
  user_metadata?: any;
}

interface AuthContextType {
  user: (User & { user_metadata?: any }) | null;
  session: Session | null;
  loading: boolean;
  profileData: Profile | null;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data?: any; error?: any }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(User & { user_metadata?: any }) | null>(
    null
  );
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<Profile | null>(null);

  const initializationRef = useRef(false);

  const loadProfile = async (userId: string) => {
    try {
      console.log("🔍 Auth: Loading profile for user:", userId);
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.log("⚠️ Auth: Profile error:", error.message);
        return null;
      }

      if (profile) {
        setProfileData(profile);
        console.log("✅ Auth: Profile loaded");
        return profile;
      }
    } catch (profileError) {
      console.log("⚠️ Auth: No profile found:", profileError);
    }
    return null;
  };

  useEffect(() => {
    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;
    console.log("🔍 Auth: Initializing...");

    const initializeAuth = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.log("❌ Auth: Error getting session:", error.message);
          setSession(null);
          setUser(null);
          setProfileData(null);
        } else if (session?.user) {
          console.log("✅ Auth: Found session for:", session.user.email);
          setSession(session);
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          console.log("🔍 Auth: No session found");
          setSession(null);
          setUser(null);
          setProfileData(null);
        }
      } catch (error) {
        console.error("❌ Auth: Initialization error:", error);
        setSession(null);
        setUser(null);
        setProfileData(null);
      } finally {
        setLoading(false);
        console.log("✅ Auth: Initialization complete");
      }
    };

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth: State changed:", event);

      // Don't set loading during initialization
      if (initializationRef.current && loading) {
        setLoading(true);
      }

      try {
        if (session?.user) {
          setSession(session);
          setUser(session.user);

          // Load profile for signed in users
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            await loadProfile(session.user.id);
          }
        } else {
          // User signed out or session ended
          setSession(null);
          setUser(null);
          setProfileData(null);
        }
      } catch (error) {
        console.error("❌ Auth: State change error:", error);
      } finally {
        // Always ensure loading is false after auth state changes
        if (initializationRef.current) {
          setLoading(false);
        }
      }
    });

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Remove loading dependency

  // Add safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log("⚠️ Auth: Safety timeout - forcing loading to false");
        setLoading(false);
      }
    }, 10000); // 10 second safety timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        // Profile will be loaded by the auth state change listener
      }

      return { data, error };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfileData(null);
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    profileData,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
