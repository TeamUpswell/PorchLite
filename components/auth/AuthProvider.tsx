"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  address: string | null;
  show_in_contacts: boolean;
  role: string;
}

interface AuthContextType {
  user: User | null;
  profileData: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileData: (updates: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profileData: null,
  loading: true,
  profileLoading: true,
  initialized: false,
  signIn: async () => {
    throw new Error("Not implemented");
  },
  signOut: async () => {
    throw new Error("Not implemented");
  },
  refreshProfile: async () => {
    throw new Error("Not implemented");
  },
  updateProfileData: () => {
    throw new Error("Not implemented");
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const fetchProfileRef = useRef(false);

  const updateProfileData = useCallback(
    (updates: Partial<Profile>) => {
      console.log("🔄 Updating profile data locally:", updates);
      setProfileData((prev) => (prev ? { ...prev, ...updates } : null));
      window.dispatchEvent(
        new CustomEvent("profileUpdated", { detail: updates })
      );
    },
    []
  );

  const createProfileSafely = useCallback(
    async (userId: string): Promise<Profile | null> => {
      try {
        console.log("📝 Creating profile with upsert...");

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new Error("No user data available");
        }

        const newProfile = {
          id: userId,
          full_name:
            userData.user.user_metadata?.full_name ||
            userData.user.email?.split("@")[0] ||
            "User",
          email: userData.user.email || "",
          avatar_url: "",
          phone_number: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          address: "",
          show_in_contacts: true,
          role: "user",
        };

        // Use upsert to avoid conflicts
        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .upsert(newProfile, {
            onConflict: "id",
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (createError) {
          console.error("❌ Error creating profile:", createError);
          return null;
        }

        console.log("✅ Profile created successfully");
        return createdProfile;
      } catch (error) {
        console.error("❌ createProfileSafely error:", error);
        return null;
      }
    },
    [supabase]
  );

  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      const startTime = Date.now();
      console.log("🔄 fetchProfile called with userId:", userId, "at", new Date().toISOString());

      if (!supabase || !userId) {
        console.log("❌ fetchProfile: Missing supabase client or userId");
        return null;
      }

      if (fetchProfileRef.current) {
        console.log("🔄 fetchProfile already in progress, skipping");
        return null;
      }

      fetchProfileRef.current = true;

      try {
        console.log("🔍 Starting profile query...");

        // Test basic connection first
        const { data: testData, error: testError } = await supabase
          .from("profiles")
          .select("count")
          .limit(1);

        console.log("🧪 Connection test:", { testData, testError });

        if (testError) {
          console.error("❌ Connection test failed:", testError);
          return null;
        }

        // Now try the actual query with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
          const queryStart = Date.now();
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          clearTimeout(timeoutId);
          const queryDuration = Date.now() - queryStart;

          console.log("🔍 Profile query completed in", queryDuration, "ms:", {
            error: error
              ? {
                  message: error.message,
                  code: error.code,
                  hint: error.hint,
                }
              : null,
            hasData: !!data,
          });

          if (error) {
            if (error.code === "PGRST116") {
              console.log("📝 Profile not found, creating new profile...");
              return await createProfileSafely(userId);
            }
            throw error;
          }

          if (data) {
            console.log("✅ Profile data fetched successfully");
            return data;
          }

          return null;
        } catch (queryError) {
          clearTimeout(timeoutId);
          if (queryError.name === "AbortError") {
            throw new Error("Query timed out after 8 seconds");
          }
          throw queryError;
        }
      } catch (error) {
        console.error("❌ fetchProfile error:", error);
        return null;
      } finally {
        const totalDuration = Date.now() - startTime;
        console.log("🏁 fetchProfile completed in", totalDuration, "ms");
        fetchProfileRef.current = false;
      }
    },
    [supabase, createProfileSafely]
  );

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      console.log("⚠️ refreshProfile: No user ID available");
      return;
    }

    console.log("🔄 refreshProfile: Starting refresh for user:", user.id);

    const freshProfile = await fetchProfile(user.id);
    if (freshProfile) {
      console.log("✅ refreshProfile: Profile refreshed successfully");
      setProfileData(freshProfile);

      window.dispatchEvent(
        new CustomEvent("profileDataChanged", {
          detail: { profileData: freshProfile },
        })
      );
    } else {
      console.log("❌ refreshProfile: Failed to refresh profile");
    }
  }, [user?.id, fetchProfile]);

  // Enhanced initialization with better error handling
  useEffect(() => {
    let mounted = true;
    setMounted(true);

    const initializeAuth = async () => {
      try {
        console.log("🔄 initializeAuth: Starting...");

        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log("🔐 initializeAuth: Session check:", {
          session: session ? `User: ${session.user.email}` : "No session",
          error: sessionError,
        });

        if (sessionError) {
          console.error("❌ Session error:", sessionError);
        }

        if (!mounted) {
          console.log("⚠️ initializeAuth: Component unmounted, aborting");
          return;
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          console.log("👤 initializeAuth: User found, fetching profile...");
          console.log("👤 User details:", {
            id: session.user.id,
            email: session.user.email,
            created_at: session.user.created_at,
          });

          setProfileLoading(true);

          const profile = await fetchProfile(session.user.id);

          if (mounted) {
            console.log("✅ initializeAuth: Setting profile data:", profile ? "Profile loaded" : "No profile");
            setProfileData(profile);
            setProfileLoading(false);
            setAuthLoading(false);
            setInitialized(true);

            if (profile) {
              console.log("🎉 initializeAuth: Complete with profile data");
            } else {
              console.log("⚠️ initializeAuth: Complete but no profile data");
            }
          }
        } else {
          console.log("✅ initializeAuth: No user, completing without profile");
          setProfileLoading(false);
          setAuthLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error("❌ initializeAuth: Unexpected error:", error);
        if (mounted) {
          setProfileLoading(false);
          setAuthLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Enhanced auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state change:", {
        event,
        session: session ? `User: ${session.user.email}` : "No session",
        mounted,
      });

      if (!mounted) {
        console.log("⚠️ Auth state change: Component unmounted, ignoring");
        return;
      }

      setUser(session?.user ?? null);

      // Only fetch profile on initial session and sign in, not on token refresh
      if (session?.user && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
        console.log("👤 Auth state change: User present, fetching profile...");
        setProfileLoading(true);

        const profile = await fetchProfile(session.user.id);

        if (mounted) {
          console.log("✅ Auth state change: Profile fetch complete");
          setProfileData(profile);
          setProfileLoading(false);
          setAuthLoading(false);
          setInitialized(true);
        }
      } else if (!session?.user) {
        console.log("✅ Auth state change: No user, clearing profile");
        setProfileData(null);
        setProfileLoading(false);
        setAuthLoading(false);
        setInitialized(true);
      } else if (event === "TOKEN_REFRESHED") {
        console.log("🔄 Token refreshed, keeping existing profile data");
        // Keep initialized as true during token refresh
      }
    });

    return () => {
      console.log("🧹 AuthProvider cleanup");
      mounted = false;
      setMounted(false);
      subscription.unsubscribe();
    };
  }, [fetchProfile, createProfileSafely]);

  const signIn = async (email: string, password: string) => {
    console.log("🔄 signIn: Starting login for:", email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ signIn: Login error:", error);
        throw error;
      }

      console.log("✅ signIn: Login successful:", data.user?.email);
      return data;
    } catch (error) {
      console.error("❌ signIn: Login failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log("🚪 Signing out...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("❌ Sign out error:", error);
      throw error;
    }
    console.log("✅ Signed out successfully");
  };

  // Enhanced render logging
  console.log("🔍 AuthProvider render state:", {
    user: user ? `${user.email} (${user.id.substring(0, 8)}...)` : "null",
    profileData:
      profileData && {
        hasData: true,
        fullName: profileData.full_name,
        avatarUrl: profileData.avatar_url
          ? `${profileData.avatar_url.substring(0, 50)}...`
          : "null",
        role: profileData.role,
      },
    profileLoading,
  });

  // Add this to your AuthProvider to debug the initialization process
  console.log("🔍 Auth Debug - Current state:", {
    user: !!user,
    initialized: initialized,
    authLoading: authLoading,
    profileLoading: profileLoading,
    profileData: !!profileData
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        profileData,
        loading: profileLoading,
        profileLoading,
        initialized,
        signIn,
        signOut,
        refreshProfile,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};