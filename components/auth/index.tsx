"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// Add role and permission types at the top:
type UserRole = 'manager' | 'family' | 'guest';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  // ✅ Add role and permission functions
  userRole: UserRole | null;
  hasPermission: (requiredRole: UserRole) => boolean;
  canAccess: (feature: string) => boolean;
}

// ✅ Add permission hierarchy
const ROLE_HIERARCHY: Record<UserRole, number> = {
  manager: 3,
  family: 2,
  guest: 1,
};

// ✅ Add feature permissions
const FEATURE_PERMISSIONS: Record<string, UserRole[]> = {
  // Manager only
  'property-management': ['manager'],
  'user-management': ['manager'],
  'financial-reports': ['manager'],
  'system-settings': ['manager'],
  
  // Manager + Family
  'inventory-management': ['manager', 'family'],
  'maintenance-tasks': ['manager', 'family'],
  'calendar-management': ['manager', 'family'],
  'document-upload': ['manager', 'family'],
  
  // All roles
  'view-inventory': ['manager', 'family', 'guest'],
  'view-calendar': ['manager', 'family', 'guest'],
  'basic-messaging': ['manager', 'family', 'guest'],
  'view-documents': ['manager', 'family', 'guest'],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 Checking initial auth session...');
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        console.log('✅ Initial session check complete:', session?.user?.email || 'No user');
      } catch (error) {
        console.error("❌ Error getting initial session:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
      
      if (session?.user) {
        // Fetch profile when user signs in
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, role')
          .eq('id', session.user.id)
          .single();
          
        session.user.profile = profile;
        setUser(session.user);
        setUserRole(profile?.role || 'guest');
      } else {
        setUser(null);
        setUserRole(null);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true); // Set loading during sign in
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true); // Set loading during sign up
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      // Redirect to login or home page after sign out
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  // Fetch user and profile data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();

        if (user) {
          // ✅ Also fetch profile data including role
          const { data: profile } = await supabase
            .from('profiles')
            .select('*, role')
            .eq('id', user.id)
            .single();

          // ✅ Attach profile to user object
          user.profile = profile;
          setUser(user);
          
          // ✅ Set user role (default to guest if not specified)
          setUserRole(profile?.role || 'guest');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // ✅ Add permission checking functions
  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!userRole) return false;
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
  };

  const canAccess = (feature: string): boolean => {
    if (!userRole) return false;
    const allowedRoles = FEATURE_PERMISSIONS[feature];
    return allowedRoles ? allowedRoles.includes(userRole) : false;
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    userRole,
    hasPermission,
    canAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthProvider;
