// Add this debug component to test your property context
// Create: /app/debug-property.tsx
"use client";
import { useProperty } from "@/lib/hooks/useProperty";
import { useTenant } from "@/lib/hooks/useTenant";

export default function PropertyDebug() {
  const { properties, currentProperty, isLoading, error } = useProperty();
  const { currentTenant, userTenants } = useTenant();

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold mb-2">🔍 Property Context Debug:</h3>
      <div className="space-y-2 text-sm">
        <div>Current Tenant: {currentTenant?.name || 'None'}</div>
        <div>Current Tenant ID: {currentTenant?.id || 'None'}</div>
        <div>Properties Count: {properties?.length || 0}</div>
        <div>Current Property: {currentProperty?.name || 'None'}</div>
        <div>Loading: {String(isLoading)}</div>
        <div>Error: {error || 'None'}</div>
        <details className="mt-2">
          <summary>Full Properties Data:</summary>
          <pre className="bg-white p-2 text-xs overflow-auto">
            {JSON.stringify(properties, null, 2)}
          </pre>
        </details>
        <details className="mt-2">
          <summary>All Tenants:</summary>
          <pre className="bg-white p-2 text-xs overflow-auto">
            {JSON.stringify(userTenants, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}