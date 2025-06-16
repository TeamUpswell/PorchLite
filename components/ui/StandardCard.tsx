// components/ui/StandardCard.tsx
"use client";

import React from "react";

export interface StandardCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode; // ✅ Add this
  children: React.ReactNode;
  className?: string;
  hover?: boolean; // ✅ Add hover effect support
}

export default function StandardCard({
  title,
  subtitle,
  icon,
  headerActions, // ✅ Add this parameter
  children,
  className = "",
  hover = false, // ✅ Add hover parameter
}: StandardCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow p-6 ${
        hover ? "hover:shadow-md transition-shadow duration-200" : ""
      } ${className}`}
    >
      {(title || subtitle || headerActions) && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              {icon && <span className="text-blue-600">{icon}</span>}
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
            {headerActions && (
              <div className="flex items-center space-x-2">{headerActions}</div>
            )}
          </div>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

