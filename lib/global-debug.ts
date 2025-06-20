// lib/global-debug.ts - Create this file
import { supabase } from "@/lib/supabase";

// Make supabase available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  (window as any).debugProfile = async (userId: string) => {
    console.log("🔍 === GLOBAL PROFILE DEBUG ===");
    console.log("🔍 User ID:", userId);
    
    try {
      // Test 1: Check profiles table
      const { data: allProfiles, error: allError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .limit(5);
      
      console.log("🔍 Sample profiles:", { allProfiles, allError });
      
      // Test 2: Check specific user
      const { data: userProfile, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId);
      
      console.log("🔍 User profile:", { userProfile, userError });
      
      // Test 3: Current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log("🔍 Current user:", { 
        user: user ? { id: user.id, email: user.email } : null, 
        authError 
      });
      
      return { userProfile, allProfiles };
      
    } catch (error) {
      console.error("❌ Debug error:", error);
      return null;
    }
  };
}