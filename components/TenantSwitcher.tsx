"use client";

import { useTenant } from "@/lib/hooks/useTenant";
import { useProperty } from "@/lib/hooks/useProperty";
import { Building2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export function TenantSwitcher() {
  // Property switching functionality moved to Account Settings page
  // This component is kept for backward compatibility but doesn't render
  return null;

  /* COMMENTED OUT - keeping for reference
  const { userTenants, isLoading: tenantLoading } = useTenant();
  const { currentProperty, properties, switchProperty, isLoading: propertyLoading } = useProperty();
  const router = useRouter();

  if (tenantLoading) return null;

  const handleSelectChange = (value: string) => {
    if (value === "add-property") {
      router.push("/properties/create");
    } else {
      switchProperty(value);
    }
  };

  // Get tenant name for a property
  const getTenantName = (tenantId: string) => {
    const tenant = userTenants.find((t) => t.id === tenantId);
    return tenant?.name || "Unknown Portfolio";
  };

  // Group properties by tenant if user has multiple tenants
  const groupedProperties = properties.reduce((groups, property) => {
    const tenantName = getTenantName(property.tenant_id);
    if (!groups[tenantName]) {
      groups[tenantName] = [];
    }
    groups[tenantName].push(property);
    return groups;
  }, {} as Record<string, typeof properties>);

  const showTenantGrouping = userTenants.length > 1;

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
        <Building2 className="h-3 w-3" />
        <span>Property</span>
      </div>
      <select
        value={currentProperty?.id || ""}
        onChange={(e) => handleSelectChange(e.target.value)}
        className="w-full text-sm bg-transparent border-0 text-gray-700 dark:text-gray-200 focus:ring-0 focus:outline-none cursor-pointer appearance-none pr-6"
        disabled={propertyLoading}
        style={{ backgroundImage: "none" }}
      >
        {showTenantGrouping ? (
          // Show grouped by tenant
          Object.entries(groupedProperties).map(([tenantName, tenantProperties]) => (
            <optgroup key={tenantName} label={tenantName} className="bg-white dark:bg-gray-900">
              {tenantProperties.map((property) => (
                <option key={property.id} value={property.id} className="bg-white dark:bg-gray-900 pl-4">
                  {property.name}
                </option>
              ))}
            </optgroup>
          ))
        ) : (
          // Show flat list
          properties.map((property) => (
            <option key={property.id} value={property.id} className="bg-white dark:bg-gray-900">
              {property.name}
            </option>
          ))
        )}

        {properties.length === 0 && (
          <option value="" disabled className="bg-white dark:bg-gray-900">
            No properties found
          </option>
        )}

        <option value="add-property" className="bg-white dark:bg-gray-900 border-t">
          + Add New Property
        </option>
      </select>
      <ChevronDown className="absolute right-0 top-6 h-3 w-3 text-gray-400 pointer-events-none" />
    </div>
  );
  */
}