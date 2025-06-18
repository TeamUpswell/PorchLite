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

// ✅ FIXED: Better singleton that handles page refreshes properly
class AuthManager {
  private static instance: AuthManager;
  private session: Session | null = null;
  private user: (User & { user_metadata?: any }) | null = null;
  private profileData: any = null;
  private initialized = false;
  private loading = false;
  private listeners: Set<(state: any) => void> = new Set();
  private authListenerSetup = false;

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  subscribe(listener: (state: any) => void) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error("Auth listener error:", error);
      }
    });
  }

  getState() {
    return {
      session: this.session,
      user: this.user,
      profileData: this.profileData,
      initialized: this.initialized,
      loading: this.loading,
    };
  }

  async initialize() {
    if (this.initialized) {
      console.log("🔄 Auth Manager: Already initialized");
      return;
    }

    if (this.loading) {
      console.log("🔄 Auth Manager: Already loading, waiting...");
      // Wait for current initialization to complete
      while (this.loading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.loading = true;
    this.notify();

    try {
      console.log("🔍 Auth Manager: Initializing...");

      // ✅ FIXED: Properly get session on refresh
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("❌ Auth Manager: Session error:", error);
        this.session = null;
        this.user = null;
        this.profileData = null;
      } else if (session?.user) {
        console.log(
          "✅ Auth Manager: Found existing session for:",
          session.user.email
        );
        this.session = session;
        this.user = session.user;
        await this.loadProfile(session.user.id);
      } else {
        console.log("🔍 Auth Manager: No session found");
        this.session = null;
        this.user = null;
        this.profileData = null;
      }

      // ✅ FIXED: Setup auth listener only once
      if (!this.authListenerSetup) {
        this.setupAuthListener();
        this.authListenerSetup = true;
      }
    } catch (error) {
      console.error("❌ Auth Manager: Init error:", error);
      this.session = null;
      this.user = null;
      this.profileData = null;
    } finally {
      this.loading = false;
      this.initialized = true;
      this.notify();
      console.log("✅ Auth Manager: Initialization complete");
    }
  }

  private async loadProfile(userId: string) {
    try {
      console.log("🔍 Auth Manager: Loading profile for:", userId);
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && profile) {
        this.profileData = profile;
        console.log("✅ Auth Manager: Profile loaded");
      } else {
        console.log("⚠️ Auth Manager: Profile not found or error:", error);
      }
    } catch (error) {
      console.log("⚠️ Auth Manager: Profile load failed:", error);
    }
  }

  private setupAuthListener() {
    console.log("🔧 Auth Manager: Setting up auth listener");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth Manager: Auth state changed:", event);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          console.log("✅ Auth Manager: User signed in:", session.user.email);
          this.session = session;
          this.user = session.user;
          await this.loadProfile(session.user.id);
          this.notify();
        }
      } else if (event === "SIGNED_OUT") {
        console.log("👋 Auth Manager: User signed out");
        this.session = null;
        this.user = null;
        this.profileData = null;
        this.notify();
      }
    });

    return () => subscription.unsubscribe();
  }

  async signIn(email: string, password: string) {
    console.log("🔑 Auth Manager: Signing in user:", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async signOut() {
    console.log("👋 Auth Manager: Signing out user");
    // Reset state immediately
    this.session = null;
    this.user = null;
    this.profileData = null;
    this.notify();

    await supabase.auth.signOut();
  }
}

// ✅ FIXED: Get singleton instance
const authManager = AuthManager.getInstance();

interface AuthContextType {
  user: (User & { user_metadata?: any }) | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  profileData: any | null;
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
  const [authState, setAuthState] = useState(() => {
    // ✅ FIXED: Start with loading state on fresh mount
    return {
      session: null,
      user: null,
      profileData: null,
      initialized: false,
      loading: true,
    };
  });

  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  const isInitializing = useRef(false);

  useEffect(() => {
    console.log(`🚀 Auth Provider MOUNTED - Instance: ${instanceId.current}`);

    // ✅ FIXED: Subscribe to auth manager
    const unsubscribe = authManager.subscribe(setAuthState);

    // ✅ FIXED: Initialize auth manager (handles multiple calls gracefully)
    const initAuth = async () => {
      if (!isInitializing.current) {
        isInitializing.current = true;
        await authManager.initialize();
        isInitializing.current = false;
      }
    };

    initAuth();

    return () => {
      console.log(
        `💀 Auth Provider UNMOUNTED - Instance: ${instanceId.current}`
      );
      unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  const hasPermission = (requiredRole?: string) => {
    if (!requiredRole) return true;
    if (!authState.user) return false;

    const userRole =
      authState.user.user_metadata?.role || authState.profileData?.role;
    const roleHierarchy = { owner: 4, manager: 3, family: 2, friend: 1 };

    const userLevel =
      roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel =
      roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  };

  const value = {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    initialized: authState.initialized,
    profileData: authState.profileData,
    signIn: authManager.signIn.bind(authManager),
    signUp,
    signOut: authManager.signOut.bind(authManager),
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
