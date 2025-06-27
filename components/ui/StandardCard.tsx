// components/ui/StandardCard.tsx
"use client";

import React from "react";

export interface StandardCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function StandardCard({
  title,
  subtitle,
  icon,
  headerActions,
  children,
  className = "",
  hover = false,
}: StandardCardProps) {
  // Only render header if there's content to show
  const shouldRenderHeader = title || subtitle || icon || headerActions;

  return (
    <div
      className={`rounded-lg shadow p-6 ${
        hover ? "hover:shadow-md transition-shadow duration-200" : ""
      } ${className}`}
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        color: "#111827",
      }}
    >
      {shouldRenderHeader && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              {icon && <span className="text-blue-600 dark:text-blue-400">{icon}</span>}
              {title && (
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h2>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center space-x-2">{headerActions}</div>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

// Export additional utility components for common patterns
export function StandardCardHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start space-x-3 min-w-0 flex-1">
        {icon && (
          <div className="flex-shrink-0 mt-0.5">
            <span className="text-blue-600 dark:text-blue-400">{icon}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              className={`text-sm text-gray-600 dark:text-gray-400 ${
                title ? "mt-1" : ""
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex-shrink-0 ml-4">
          <div className="flex items-center space-x-2">{actions}</div>
        </div>
      )}
    </div>
  );
}

// Utility component for card sections
export function StandardCardSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`py-3 first:pt-0 last:pb-0 ${className}`}>{children}</div>
  );
}
