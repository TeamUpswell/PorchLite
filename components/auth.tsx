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
  initialized: boolean;
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
  hasPermission: (requiredRole?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(User & { user_metadata?: any }) | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
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
        setInitialized(false); // ✅ FIXED: Explicitly set to false

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
        setInitialized(true); // ✅ FIXED: Always set initialized to true
        console.log("✅ Auth: Initialization complete");
      }
    };

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth: State changed:", event);

      try {
        // ✅ FIXED: Don't reset loading/initialized on state changes after initial load
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session?.user) {
            setSession(session);
            setUser(session.user);
            await loadProfile(session.user.id);
          }
        } else if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setProfileData(null);
          // ✅ FIXED: Don't reset initialized on sign out
        }
      } catch (error) {
        console.error("❌ Auth: State change error:", error);
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
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const hasPermission = (requiredRole?: string) => {
    if (!requiredRole) return true;
    if (!user) return false;

    const userRole = user.user_metadata?.role || profileData?.role;
    const roleHierarchy = { owner: 4, manager: 3, family: 2, friend: 1 };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  };

  const value = {
    user,
    session,
    loading,
    initialized,
    profileData,
    signIn,
    signUp,
    signOut,
    hasPermission,
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