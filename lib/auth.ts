import { supabase } from './supabase';
import { useAuth as useSupabaseAuth } from "@/components/AuthProvider";

// Re-export the hook from AuthProvider
export { useAuth } from '@/components/AuthProvider';

// Additional auth utilities
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
}

export async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
}

export const useAuthWithPermissions = () => {
  const auth = useSupabaseAuth();

  const hasPermission = (requiredRole?: string) => {
    if (!requiredRole) return true;
    if (!auth.user) return false;
    
    const userRole = auth.user.user_metadata?.role;
    
    // Define role hierarchy
    const roleHierarchy = {
      'owner': 4,
      'manager': 3,
      'family': 2,
      'friend': 1
    };
    
    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    
    return userLevel >= requiredLevel;
  };

  return {
    ...auth,
    hasPermission,
  };
};

// Export the permission checker separately if needed
export const checkPermission = (user: any, requiredRole?: string) => {
  if (!requiredRole) return true;
  if (!user) return false;
  
  const userRole = user.user_metadata?.role;
  
  const roleHierarchy = {
    'owner': 4,
    'manager': 3,
    'family': 2,
    'friend': 1
  };
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  
  return userLevel >= requiredLevel;
};
