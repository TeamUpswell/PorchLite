"use client";

import { useProperty } from "@/lib/hooks/useProperty";
import { useRouter } from "next/navigation";

export function PropertySwitcher() {
  const { currentProperty, userProperties, setCurrentProperty } = useProperty();
  const router = useRouter();

  if (userProperties.length <= 1) {
    return (
      <div className="text-sm text-gray-600">
        {currentProperty?.name || "No property selected"}
      </div>
    );
  }

  const handlePropertyChange = (propertyId: string) => {
    const property = userProperties.find((p) => p.id === propertyId);
    if (property) {
      setCurrentProperty(property);
      // Optionally refresh the current page with new property context
      router.refresh();
    }
  };

  return (
    <div className="min-w-0 flex-1 max-w-xs">
      <label htmlFor="property-select" className="sr-only">
        Select Property
      </label>
      <select
        id="property-select"
        value={currentProperty?.id || ""}
        onChange={(e) => handlePropertyChange(e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        {userProperties.map((property) => (
          <option key={property.id} value={property.id}>
            {property.name}
          </option>
        ))}
      </select>
    </div>
  );
}
