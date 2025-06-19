"use client";

import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { debugLog } from "@/lib/debug";

export default function DebugPage() {
  const auth = useAuth();
  const property = useProperty();

  debugLog("Auth state", auth);
  debugLog("Property state", property);

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Debug Info</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Auth State:</h2>
        <pre>{JSON.stringify({
          hasUser: !!auth.user,
          loading: auth.loading,
          hasInitialized: auth.hasInitialized,
          email: auth.user?.email
        }, null, 2)}</pre>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Property State:</h2>
        <pre>{JSON.stringify({
          hasProperty: !!property.currentProperty,
          loading: property.loading,
          hasInitialized: property.hasInitialized,
          propertyName: property.currentProperty?.name
        }, null, 2)}</pre>
      </div>
    </div>
  );
}