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

class AuthManager {
  private static instance: AuthManager;
  private session: Session | null = null;
  private user: (User & { user_metadata?: any }) | null = null;
  private profileData: any = null;
  private initialized = false;
  private loading = false;
  private listeners: Set<(state: any) => void> = new Set();
  private authListenerSetup = false;

  // ✅ REDUCED: Only enable debug logs in development mode
  private isDebugEnabled = process.env.NODE_ENV === 'development';

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
      return;
    }

    if (this.loading) {
      while (this.loading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.loading = true;
    this.notify();

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("❌ Auth error:", error);
        this.session = null;
        this.user = null;
        this.profileData = null;
      } else if (session?.user) {
        // ✅ SIMPLIFIED: Only log in development
        if (this.isDebugEnabled) {
          console.log("✅ Session restored");
        }
        this.session = session;
        this.user = session.user;
        await this.loadProfile(session.user.id);
      } else {
        this.session = null;
        this.user = null;
        this.profileData = null;
      }

      if (!this.authListenerSetup) {
        this.setupAuthListener();
        this.authListenerSetup = true;
      }
    } catch (error) {
      console.error("❌ Auth init error:", error);
      this.session = null;
      this.user = null;
      this.profileData = null;
    } finally {
      this.loading = false;
      this.initialized = true;
      this.notify();
    }
  }

  private async loadProfile(userId: string) {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && profile) {
        this.profileData = profile;
      }
    } catch (error) {
      // ✅ SIMPLIFIED: Only log profile errors in development
      if (this.isDebugEnabled) {
        console.log("⚠️ Profile load failed:", error);
      }
    }
  }

  private setupAuthListener() {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // ✅ SIMPLIFIED: Only log auth state changes in development
      if (this.isDebugEnabled) {
        if (event === "SIGNED_OUT") {
          console.log('👋 User signed out');
        } else if (event === "SIGNED_IN") {
          console.log('✅ User signed in');
        }
      }
      
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          this.session = session;
          this.user = session.user;
          await this.loadProfile(session.user.id);
          this.notify();
        }
      } else if (event === "SIGNED_OUT") {
        this.session = null;
        this.user = null;
        this.profileData = null;
        this.notify();
      }
    });

    return () => subscription.unsubscribe();
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  async signOut() {
    this.session = null;
    this.user = null;
    this.profileData = null;
    this.notify();
    
    await supabase.auth.signOut();
  }
}

const authManager = AuthManager.getInstance();

interface AuthContextType {
  user: (User & { user_metadata?: any }) | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  profileData: any | null;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signUp: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRole?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState(() => {
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

  // ✅ REDUCED: Only enable debug logs in development mode
  const isDebugEnabled = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // ✅ SIMPLIFIED: Only log provider mount in development
    if (isDebugEnabled) {
      console.log(`🚀 Auth Provider mounted`);
    }
    
    const unsubscribe = authManager.subscribe(setAuthState);
    
    const initAuth = async () => {
      if (!isInitializing.current) {
        isInitializing.current = true;
        await authManager.initialize();
        isInitializing.current = false;
      }
    };
    
    initAuth();

    return () => {
      unsubscribe();
    };
  }, [isDebugEnabled]);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  const hasPermission = (requiredRole?: string) => {
    if (!requiredRole) return true;
    if (!authState.user) return false;

    const userRole = authState.user.user_metadata?.role || authState.profileData?.role;
    const roleHierarchy = { owner: 4, manager: 3, family: 2, friend: 1 };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

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