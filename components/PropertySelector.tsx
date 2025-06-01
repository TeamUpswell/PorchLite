// components/PropertySelector.tsx
"use client";

import { useProperty } from "@/lib/hooks/useProperty";

export default function PropertySelector() {
  const { currentProperty, properties, setCurrentProperty } = useProperty();

  if (!properties || properties.length === 0) {
    return <div className="text-sm text-gray-500">No properties available</div>;
  }

  return (
    <select
      value={currentProperty?.id || ""}
      onChange={(e) => {
        const selected = properties.find((p) => p.id === e.target.value);
        setCurrentProperty(selected || null);
      }}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">Select a property</option>
      {properties.map((property) => (
        <option key={property.id} value={property.id}>
          {property.name}
        </option>
      ))}
    </select>
  );
}
