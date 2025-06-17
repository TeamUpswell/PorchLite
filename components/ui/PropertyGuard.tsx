"use client";

import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";

interface PropertyGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PropertyGuard({ children, fallback }: PropertyGuardProps) {
  const { initialized: authInitialized, loading: authLoading, user } = useAuth();
  const { currentProperty, loading: propertyLoading, hasInitialized: propertyInitialized } = useProperty();

  // 🔍 ADD DEBUG LOGGING
  console.log('🛡️ PropertyGuard state:', {
    authInitialized,
    authLoading,
    propertyInitialized,
    propertyLoading,
    hasUser: !!user,
    hasProperty: !!currentProperty,
    userId: user?.id
  });

  // 🔑 FIX: Handle undefined loading states properly
  const isAuthLoading = authLoading === true; // undefined or false = not loading
  const isPropertyLoading = propertyLoading === true; // undefined or false = not loading

  // Show loading while auth or properties are initializing
  if (!authInitialized || isAuthLoading || (!propertyInitialized && user && isPropertyLoading)) {
    console.log('🛡️ PropertyGuard: Showing loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show fallback if no property selected (but only if auth is complete)
  if (authInitialized && !isAuthLoading && user && !currentProperty) {
    console.log('🛡️ PropertyGuard: No property, showing fallback');
    return fallback || (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No Property Selected</h2>
        <p className="text-gray-600 mt-2">Please select a property to continue.</p>
      </div>
    );
  }

  console.log('🛡️ PropertyGuard: Rendering children');
  return <>{children}</>;
}