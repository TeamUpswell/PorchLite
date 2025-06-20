// lib/debug-profile.ts - Create this file to test profile queries
import { supabase } from "@/lib/supabase";

export const debugProfile = async (userId: string) => {
  console.log("🔍 === PROFILE DEBUG ===");
  console.log("🔍 User ID:", userId);
  
  try {
    // Test 1: Check if profiles table exists and is accessible
    const { data: tableTest, error: tableError } = await supabase
      .from("profiles")
      .select("count");
    
    console.log("🔍 Table access test:", { tableTest, tableError });
    
    // Test 2: List all profiles (limited)  
    const { data: allProfiles, error: allError } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .limit(5);
    
    console.log("🔍 All profiles (sample):", { allProfiles, allError });
    
    // Test 3: Look for specific user profile
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId);
    
    console.log("🔍 User profile query result:", { userProfile, userError });
    
    // Test 4: Check current user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("🔍 Current auth user:", { user: user?.email, authError });
    
    return userProfile;
    
  } catch (error) {
    console.error("❌ Debug profile error:", error);
    return null;
  }
};

// Call this function in your browser console:
// debugProfile('your-user-id-here')