// components/ui/StandardCard.tsx
"use client";

import * as React from "react";

interface StandardCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode; // ✅ Make sure this is here
}

export default function StandardCard({
  title,
  subtitle,
  children,
  className = "",
  headerActions, // ✅ Destructure this
  ...restProps
}: StandardCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      {...restProps}
    >
      {(title || subtitle || headerActions) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
            </div>
            {headerActions && <div>{headerActions}</div>}
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
