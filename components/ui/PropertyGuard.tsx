// components/ui/PropertyGuard.tsx
"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { useMemo, useRef } from "react";

interface PropertyGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PropertyGuard({ children, fallback }: PropertyGuardProps) {
  const {
    initialized: authInitialized,
    loading: authLoading,
    user,
  } = useAuth();
  const {
    currentProperty,
    loading: propertyLoading,
    hasInitialized: propertyInitialized,
  } = useProperty();

  // Track previous state to only log when it actually changes
  const prevStateRef = useRef<string>("");

  // Memoize the guard state to prevent unnecessary re-renders
  const guardState = useMemo(() => {
    const isAuthLoading = authLoading === true;
    const isPropertyLoading = propertyLoading === true;

    const state = {
      authInitialized: authInitialized === true, // Ensure boolean
      authLoading: isAuthLoading,
      propertyInitialized: propertyInitialized === true, // Ensure boolean
      propertyLoading: isPropertyLoading,
      hasUser: !!user,
      hasProperty: !!currentProperty,
      userId: user?.id,
      // Computed states - fix the logic here
      showLoading:
        authInitialized !== true || // Wait for auth to be explicitly initialized
        isAuthLoading ||
        (user && propertyInitialized !== true && isPropertyLoading), // Only wait for property if we have a user
      showFallback:
        authInitialized === true && !isAuthLoading && user && !currentProperty,
      showChildren:
        authInitialized === true && !isAuthLoading && user && currentProperty,
    };

    // Only log when state actually changes
    const stateKey = `${state.authInitialized}-${state.authLoading}-${
      state.propertyInitialized
    }-${state.propertyLoading}-${!!user}-${!!currentProperty}`;

    if (
      process.env.NODE_ENV === "development" &&
      prevStateRef.current !== stateKey
    ) {
      console.log("🛡️ PropertyGuard state changed:", {
        authInitialized: state.authInitialized,
        authLoading: state.authLoading,
        propertyInitialized: state.propertyInitialized,
        propertyLoading: state.propertyLoading,
        hasUser: state.hasUser,
        hasProperty: state.hasProperty,
        userId: state.userId,
        // Add debug info
        showLoading: state.showLoading,
        showFallback: state.showFallback,
        showChildren: state.showChildren,
      });
      prevStateRef.current = stateKey;
    }

    return state;
  }, [
    authInitialized,
    authLoading,
    propertyInitialized,
    propertyLoading,
    user?.id, // Only depend on user ID, not the entire user object
    currentProperty?.id, // Only depend on property ID, not the entire property object
    // Add these for extra safety (though probably not needed)
    !!user,
    !!currentProperty,
  ]);

  // Show loading state
  if (guardState.showLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            ⏳ Waiting for user and property to load...
          </p>
        </div>
      </div>
    );
  }

  // Show fallback if no property selected
  if (guardState.showFallback) {
    return (
      fallback || (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">
            No Property Selected
          </h2>
          <p className="text-gray-600 mt-2">
            Please select a property to continue.
          </p>
        </div>
      )
    );
  }

  // Render children - only log this once per state change
  return <>{children}</>;
}
