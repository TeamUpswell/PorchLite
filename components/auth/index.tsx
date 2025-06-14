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

  useEffect(() => {
    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;
    console.log("🔍 Auth: Initializing...");

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.log("❌ Auth: Error getting session:", error.message);
        } else if (session?.user) {
          console.log("✅ Auth: Found session for:", session.user.email);
          setSession(session);
          setUser(session.user);

          // Fetch profile data only
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (profile) {
              setProfileData(profile);
              console.log("✅ Auth: Profile loaded");
            }
          } catch (profileError) {
            console.log("⚠️ Auth: No profile found");
          }
        } else {
          console.log("🔍 Auth: No session found");
        }
      } catch (error) {
        console.error("❌ Auth: Initialization error:", error);
      } finally {
        setLoading(false);
        console.log("✅ Auth: Initialization complete");
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth: State changed:", event);

      if (session?.user) {
        setSession(session);
        setUser(session.user);

        if (event === "SIGNED_IN") {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (profile) {
              setProfileData(profile);
            }
          } catch (profileError) {
            console.log("No profile found");
          }
        }
      } else {
        setSession(null);
        setUser(null);
        setProfileData(null);
      }
    });

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfileData(null);
    } catch (error) {
      console.error("Sign out error:", error);
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
