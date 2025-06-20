// components/auth/AuthProvider.tsx - Check for these issues
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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
  profileData: any;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>; // ✅ Add this
  signOut: () => Promise<void>; // ✅ Add this
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profileData: null,
  loading: true,
  profileLoading: true,
  signIn: async () => {
    throw new Error("Not implemented");
  }, // ✅ Add this
  signOut: async () => {
    throw new Error("Not implemented");
  }, // ✅ Add this
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log("🚀 Auth Provider mounted");

  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const updateProfileData = useCallback(
    (updates: Partial<Profile>) => {
      console.log("🔄 Updating profile data locally:", updates);
      setProfileData((prev) => (prev ? { ...prev, ...updates } : null));

      window.dispatchEvent(
        new CustomEvent("profileDataChanged", {
          detail: {
            profileData: profileData ? { ...profileData, ...updates } : null,
          },
        })
      );
    },
    [profileData]
  );

  const fetchProfile = async (userId: string) => {
    try {
      console.log("🔄 fetchProfile called with userId:", userId);
      console.log(
        "🔍 Supabase client status:",
        supabase ? "Available" : "Null"
      );

      // Test basic connectivity
      const { data: testData, error: testError } = await supabase
        .from("profiles")
        .select("count")
        .limit(1);

      console.log("🔍 Supabase connectivity test:", { testData, testError });

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      console.log("🔍 Profile query result:", { data, error, userId });

      if (error) {
        console.error("❌ Error fetching profile:", error);
        console.error("❌ Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // If profile doesn't exist, create one
        if (error.code === "PGRST116") {
          console.log("📝 Profile doesn't exist, creating one...");

          const newProfileData = {
            id: userId,
            full_name: null,
            phone_number: null,
            email: null, // We'll get this from the user object
            avatar_url: null,
            address: null,
            show_in_contacts: true,
            role: "guest",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          console.log("📝 Creating profile with data:", newProfileData);

          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert([newProfileData])
            .select()
            .single();

          console.log("📝 Profile creation result:", {
            newProfile,
            createError,
          });

          if (createError) {
            console.error("❌ Error creating profile:", createError);
            return null;
          }

          console.log("✅ Profile created successfully:", newProfile);
          return newProfile;
        }

        return null;
      }

      console.log("✅ Profile data fetched successfully:", data);

      // Specifically log avatar URL
      if (data?.avatar_url) {
        console.log("🖼️ Avatar URL found in database:", data.avatar_url);

        // Test if avatar URL is accessible
        try {
          const response = await fetch(data.avatar_url, { method: "HEAD" });
          console.log("🔍 Avatar URL accessibility test:", {
            url: data.avatar_url,
            status: response.status,
            ok: response.ok,
          });
        } catch (fetchError) {
          console.error("❌ Avatar URL not accessible:", fetchError);
        }
      } else {
        console.log("🖼️ No avatar URL in database");
      }

      return data;
    } catch (error) {
      console.error("❌ Unexpected error in fetchProfile:", error);
      return null;
    }
  };

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
  }, [user?.id]);

  // ✅ Enhanced initialization with better error handling
  useEffect(() => {
    let mounted = true;

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
            console.log(
              "✅ initializeAuth: Setting profile data:",
              profile ? "Profile loaded" : "No profile"
            );
            setProfileData(profile);
            setProfileLoading(false);

            if (profile) {
              console.log("🎉 initializeAuth: Complete with profile data");
            } else {
              console.log("⚠️ initializeAuth: Complete but no profile data");
            }
          } else {
            console.log(
              "⚠️ initializeAuth: Component unmounted during profile fetch"
            );
          }
        } else {
          console.log("✅ initializeAuth: No user, completing without profile");
          setProfileLoading(false);
        }
      } catch (error) {
        console.error("❌ initializeAuth: Unexpected error:", error);
        if (mounted) {
          setProfileLoading(false);
        }
      }
    };

    initializeAuth();

    // ✅ Enhanced auth state change listener
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

      if (session?.user) {
        console.log("👤 Auth state change: User present, fetching profile...");
        setProfileLoading(true);

        const profile = await fetchProfile(session.user.id);

        if (mounted) {
          console.log("✅ Auth state change: Profile fetch complete");
          setProfileData(profile);
          setProfileLoading(false);
        }
      } else {
        console.log("✅ Auth state change: No user, clearing profile");
        setProfileData(null);
        setProfileLoading(false);
      }
    });

    return () => {
      console.log("🧹 AuthProvider cleanup");
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

  // ✅ Enhanced render logging
  console.log("🔍 AuthProvider render state:", {
    user: user ? `${user.email} (${user.id.substring(0, 8)}...)` : "null",
    profileData: profileData
      ? {
          hasData: true,
          fullName: profileData.full_name,
          avatarUrl: profileData.avatar_url
            ? `${profileData.avatar_url.substring(0, 50)}...`
            : "null",
          role: profileData.role,
        }
      : "null",
    profileLoading,
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        profileData,
        loading: profileLoading, // This should not be undefined
        initialized: true, // This should be set somewhere
        signOut,
        refreshProfile,
        updateProfileData,
        signIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};