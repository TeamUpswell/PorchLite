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
import { debugLog, debugError } from "@/lib/utils/debug";

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
  const [initialized, setInitialized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // ✅ Use refs to prevent dependency loops
  const fetchProfileRef = useRef(false);
  const mountedRef = useRef(true);

  const updateProfileData = useCallback((updates: Partial<Profile>) => {
    debugLog("🔄 Updating profile data locally:", updates);
    setProfileData((prev) => (prev ? { ...prev, ...updates } : null));
    window.dispatchEvent(
      new CustomEvent("profileUpdated", { detail: updates })
    );
  }, []);

  // ✅ Stable function - no dependencies that change
  const createProfileSafely = useCallback(
    async (userId: string): Promise<Profile | null> => {
      try {
        debugLog("📝 Creating profile with upsert...");

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

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .upsert(newProfile, {
            onConflict: "id",
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (createError) {
          debugError("❌ Error creating profile:", createError);
          return null;
        }

        debugLog("✅ Profile created successfully");
        return createdProfile;
      } catch (error) {
        debugError("❌ createProfileSafely error:", error);
        return null;
      }
    },
    [] // ✅ No dependencies to prevent loops
  );

  // ✅ Stable function - no changing dependencies
  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      const startTime = Date.now();
      debugLog(
        "🔄 fetchProfile called with userId:",
        userId,
        "at",
        new Date().toISOString()
      );

      if (!supabase || !userId) {
        debugLog("❌ fetchProfile: Missing supabase client or userId");
        return null;
      }

      if (fetchProfileRef.current) {
        debugLog("🔄 fetchProfile already in progress, skipping");
        return null;
      }

      fetchProfileRef.current = true;

      try {
        debugLog("🔍 Starting profile query...");

        // ✅ Add timeout to prevent hanging
        const queryPromise = supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Profile query timeout")), 8000)
        );

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

        const queryDuration = Date.now() - startTime;

        debugLog("🔍 Profile query completed in", queryDuration, "ms:", {
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
            debugLog("📝 Profile not found, creating new profile...");
            return await createProfileSafely(userId);
          }
          throw error;
        }

        if (data) {
          debugLog("✅ Profile data fetched successfully");
          return data;
        }

        return null;
      } catch (error) {
        debugError("❌ fetchProfile error:", error);

        // ✅ Don't let profile errors block auth completely
        if (error.message?.includes("timeout")) {
          debugLog("⚠️ Profile fetch timed out, continuing without profile");
          return null;
        }

        return null;
      } finally {
        const totalDuration = Date.now() - startTime;
        debugLog("🏁 fetchProfile completed in", totalDuration, "ms");
        fetchProfileRef.current = false;
      }
    },
    [createProfileSafely]
  );

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      debugLog("⚠️ refreshProfile: No user ID available");
      return;
    }

    debugLog("🔄 refreshProfile: Starting refresh for user:", user.id);

    const freshProfile = await fetchProfile(user.id);
    if (freshProfile) {
      debugLog("✅ refreshProfile: Profile refreshed successfully");
      setProfileData(freshProfile);

      window.dispatchEvent(
        new CustomEvent("profileDataChanged", {
          detail: { profileData: freshProfile },
        })
      );
    } else {
      debugLog("❌ refreshProfile: Failed to refresh profile");
    }
  }, [user?.id, fetchProfile]);

  // ✅ MAIN FIX: Removed circular dependencies
  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      try {
        debugLog("🔄 initializeAuth: Starting...");

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        debugLog("🔐 initializeAuth: Session check:", {
          session: session ? `User: ${session.user.email}` : "No session",
          error: sessionError,
        });

        if (sessionError) {
          debugError("❌ Session error:", sessionError);
        }

        if (!mountedRef.current) {
          debugLog("⚠️ initializeAuth: Component unmounted, aborting");
          return;
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          debugLog("👤 initializeAuth: User found, fetching profile...");
          debugLog("👤 User details:", {
            id: session.user.id,
            email: session.user.email,
            created_at: session.user.created_at,
          });

          setProfileLoading(true);

          const profile = await fetchProfile(session.user.id);

          if (mountedRef.current) {
            debugLog(
              "✅ initializeAuth: Setting profile data:",
              profile ? "Profile loaded" : "No profile"
            );
            setProfileData(profile);
            setProfileLoading(false);
            setAuthLoading(false);
            setInitialized(true);

            if (profile) {
              debugLog("🎉 initializeAuth: Complete with profile data");
            } else {
              debugLog("⚠️ initializeAuth: Complete but no profile data");
            }
          }
        } else {
          debugLog("✅ initializeAuth: No user, completing without profile");
          setProfileLoading(false);
          setAuthLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        debugError("❌ initializeAuth: Unexpected error:", error);
        if (mountedRef.current) {
          setProfileLoading(false);
          setAuthLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      debugLog("🔄 Auth state change:", {
        event,
        session: session ? `User: ${session.user.email}` : "No session",
        mounted: mountedRef.current,
      });

      if (!mountedRef.current) {
        debugLog("⚠️ Auth state change: Component unmounted, ignoring");
        return;
      }

      setUser(session?.user ?? null);

      if (
        session?.user &&
        (event === "INITIAL_SESSION" || event === "SIGNED_IN")
      ) {
        debugLog("👤 Auth state change: User present, fetching profile...");
        setProfileLoading(true);

        const profile = await fetchProfile(session.user.id);

        if (mountedRef.current) {
          debugLog("✅ Auth state change: Profile fetch complete");
          setProfileData(profile);
          setProfileLoading(false);
          setAuthLoading(false);
          setInitialized(true);
        }
      } else if (!session?.user) {
        debugLog("✅ Auth state change: No user, clearing profile");
        setProfileData(null);
        setProfileLoading(false);
        setAuthLoading(false);
        setInitialized(true);
      } else if (event === "TOKEN_REFRESHED") {
        debugLog("🔄 Token refreshed, keeping existing profile data");
      }
    });

    return () => {
      debugLog("🧹 AuthProvider cleanup");
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []); // ✅ CRITICAL: Empty dependency array prevents infinite loops

  const signIn = async (email: string, password: string) => {
    debugLog("🔄 signIn: Starting login for:", email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        debugError("❌ signIn: Login error:", error);
        throw error;
      }

      debugLog("✅ signIn: Login successful:", data.user?.email);
      return data;
    } catch (error) {
      debugError("❌ signIn: Login failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    debugLog("🚪 Signing out...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      debugError("❌ Sign out error:", error);
      throw error;
    }
    debugLog("✅ Signed out successfully");
  };

  debugLog("🔍 AuthProvider render state:", {
    user: user ? `${user.email} (${user.id.substring(0, 8)}...)` : "null",
    profileData: profileData ? "loaded" : "null",
    profileLoading,
  });

  debugLog("🔍 Auth Debug - Current state:", {
    user: !!user,
    initialized: initialized,
    authLoading: authLoading,
    profileLoading: profileLoading,
    profileData: !!profileData,
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        profileData,
        loading: authLoading,
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