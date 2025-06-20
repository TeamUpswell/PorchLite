// components/LoadingWrapper.tsx
"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useTenant } from "@/lib/hooks/useTenant";
import { useProperty } from "@/lib/hooks/useProperty";

interface LoadingWrapperProps {
  children: React.ReactNode;
}

export function LoadingWrapper({ children }: LoadingWrapperProps) {
  const { loading: authLoading } = useAuth();
  const { loading: tenantLoading } = useTenant();
  const { loading: propertyLoading } = useProperty();

  const isLoading = authLoading || tenantLoading || propertyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
