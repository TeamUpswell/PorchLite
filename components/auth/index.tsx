"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
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
  profileLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data?: any; error?: any }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(User & { user_metadata?: any }) | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const initializationRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Enhanced loadProfile with better error handling
  const loadProfile = useCallback(async (userId: string) => {
    try {
      setProfileLoading(true);
      console.log("🔍 Auth: Loading profile for user:", userId);

      let { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // If profile doesn't exist, create it
      if (error && error.code === "PGRST116") {
        console.log("📝 Auth: Creating new profile for user");

        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([
            {
              id: userId,
              email: user?.email,
              full_name: user?.user_metadata?.full_name || user?.user_metadata?.name,
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error("❌ Auth: Failed to create profile:", createError);
          return null;
        }

        profile = newProfile;
        console.log("✅ Auth: New profile created");
      } else if (error) {
        console.log("⚠️ Auth: Profile error:", error.message);
        return null;
      }

      if (profile) {
        setProfileData(profile);
        console.log("✅ Auth: Profile loaded:", profile);
        return profile;
      }
    } catch (profileError) {
      console.log("⚠️ Auth: No profile found:", profileError);
    } finally {
      setProfileLoading(false);
    }
    return null;
  }, [user?.email, user?.user_metadata]);

  // ✅ Enhanced refreshProfile with callback
  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      console.log("🔄 Auth: Refreshing profile data...");
      await loadProfile(user.id);
    } catch (error) {
      console.error("❌ Auth: Failed to refresh profile:", error);
    }
  }, [user, loadProfile]);

  // ✅ Enhanced updateProfile with optimistic updates and broadcasting
  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<Profile> => {
    if (!user) {
      throw new Error("No authenticated user");
    }

    try {
      setProfileLoading(true);
      console.log("🔄 Auth: Updating profile with:", updates);

      // ✅ Optimistic update - update local state immediately
      const optimisticProfile = profileData ? { ...profileData, ...updates } : null;
      if (optimisticProfile) {
        setProfileData(optimisticProfile);
      }

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("❌ Auth: Profile update error:", error);
        // Revert optimistic update on error
        await refreshProfile();
        throw error;
      }

      // ✅ Update with server response
      setProfileData(data);

      // ✅ Broadcast avatar updates to other components
      if (updates.avatar_url) {
        // Use localStorage for cross-tab communication
        localStorage.setItem('avatar_updated', Date.now().toString());
        window.dispatchEvent(new Event('storage'));
        
        // Use custom event for same-tab communication
        window.dispatchEvent(new CustomEvent('avatarUpdated', { 
          detail: { 
            avatarUrl: updates.avatar_url,
            profile: data,
            timestamp: Date.now()
          } 
        }));

        console.log("📡 Auth: Avatar update broadcasted:", updates.avatar_url);
      }

      console.log("✅ Auth: Profile updated successfully", data);
      return data;
    } catch (error) {
      console.error("❌ Auth: Failed to update profile:", error);
      throw error;
    } finally {
      setProfileLoading(false);
    }
  }, [user, profileData, refreshProfile]);

  // ✅ Listen for avatar updates from other components
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      console.log("🔄 Auth: Received avatar update event:", event.detail);
      if (event.detail?.profile) {
        setProfileData(event.detail.profile);
      } else {
        // Fallback: refresh from server
        refreshProfile();
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'avatar_updated') {
        console.log("🔄 Auth: Cross-tab avatar update detected");
        refreshProfile();
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshProfile]);

  // ✅ Main initialization effect
  useEffect(() => {
    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;
    console.log("🚀 Auth Provider mounted");

    // Add timeout fallback
    timeoutRef.current = setTimeout(() => {
      console.warn("⚠️ Auth: Initialization timeout - forcing completion");
      setLoading(false);
      setInitialized(true);
    }, 10000); // 10 second timeout

    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log("🔍 Auth: Testing Supabase connection...");

        const startTime = Date.now();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        const endTime = Date.now();

        console.log(`🔍 Auth: Session fetch took ${endTime - startTime}ms`);

        if (error) {
          console.log("❌ Auth: Error getting session:", error.message);
          setSession(null);
          setUser(null);
          setProfileData(null);
        } else if (session?.user) {
          console.log("✅ Session restored");
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
        // Clear timeout and complete initialization
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setLoading(false);
        setInitialized(true);
        console.log("✅ Auth: Initialization complete");
      }
    };

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth: State changed:", event);

      try {
        if (session?.user) {
          setSession(session);
          setUser(session.user);

          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            await loadProfile(session.user.id);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfileData(null);
        }
      } catch (error) {
        console.error("❌ Auth: State change error:", error);
      }
    });

    initializeAuth();

    // Cleanup function
    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loadProfile]);

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
      console.log("🔄 Auth: Signing out...");
      
      // Clear local state immediately
      setProfileData(null);
      
      await supabase.auth.signOut();
      
      // Clear any cached avatar data
      localStorage.removeItem('avatar_updated');
      
      console.log("✅ Auth: Signed out successfully");
    } catch (error) {
      console.error("❌ Auth: Sign out error:", error);
    }
  };

  const value = {
    user,
    session,
    loading,
    initialized,
    profileData,
    profileLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  };

  console.log("🔧 Auth Provider render:", {
    user: user ? `${user.email} (${user.id.slice(0, 8)}...)` : 'null',
    loading,
    initialized,
    profileData: profileData ? `Profile loaded (avatar: ${!!profileData.avatar_url})` : 'null',
    profileLoading
  });

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
