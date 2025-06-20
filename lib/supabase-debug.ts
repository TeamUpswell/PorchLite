// lib/supabase-debug.ts - Create this file to test storage
import { supabase } from "@/lib/supabase";

export const debugSupabaseStorage = async () => {
  console.log("🔍 === SUPABASE STORAGE DEBUG ===");
  
  // Check if avatars bucket exists
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  console.log("📦 Available buckets:", buckets);
  if (bucketsError) console.error("❌ Buckets error:", bucketsError);
  
  // Check avatars bucket specifically
  const { data: avatarFiles, error: avatarError } = await supabase.storage
    .from('avatars')
    .list();
  console.log("🖼️ Files in avatars bucket:", avatarFiles);
  if (avatarError) console.error("❌ Avatar bucket error:", avatarError);
  
  // Test public URL generation
  const testUrl = supabase.storage
    .from('avatars')
    .getPublicUrl('test-file.jpg');
  console.log("🔗 Test public URL:", testUrl);
};

// Call this in your browser console: debugSupabaseStorage()