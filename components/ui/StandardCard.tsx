// components/ui/StandardCard.tsx
"use client";

import React from "react";
import Link from "next/link";

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
      className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 ${
        hover ? "hover:shadow-md transition-shadow duration-200" : ""
      } ${className}`}
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
            <p className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

// New ManualStyleCard component based on your manual page cards
export function ManualStyleCard({
  title,
  description,
  icon,
  badge,
  priority = false,
  onClick,
  href,
  className = "",
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  priority?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const cardClasses = `
    bg-white dark:bg-gray-800 
    rounded-lg shadow 
    border border-gray-200 dark:border-gray-700
    transition-all p-6 h-full relative
    hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
    ${onClick || href ? "cursor-pointer" : ""}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const content = (
    <>
      {/* Badge */}
      {badge && (
        <div className={`absolute top-3 right-3 text-xs px-2 py-1 rounded font-medium ${
          badge === 'Available' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {badge}
        </div>
      )}

      {/* Icon */}
      <div className="mb-3">
        {icon}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
          {description}
        </p>
      )}

      {/* Children */}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cardClasses} onClick={onClick}>
      {content}
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
              className={`text-sm text-gray-600 dark:text-gray-300 ${
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
