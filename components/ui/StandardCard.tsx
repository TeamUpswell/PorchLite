// components/ui/StandardCard.tsx
"use client";

import { ReactNode } from "react";

interface StandardCardProps {
  title?: string;
  subtitle?: string;
  headerIcon?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

export default function StandardCard({
  title,
  subtitle,
  headerIcon,
  headerActions,
  children,
  className = "",
  padding = "md",
  hover = false,
}: StandardCardProps) {
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div className={`
      bg-white rounded-xl shadow-sm border border-gray-200
      ${hover ? "hover:shadow-md transition-shadow duration-200" : ""}
      ${className}
    `}>
      {(title || headerActions) && (
        <div className={`border-b border-gray-100 ${paddingClasses[padding]} pb-4`}>
          <div className="flex items-center justify-between">
            {(title || headerIcon) && (
              <div className="flex items-center space-x-3">
                {headerIcon && (
                  <div className="p-2 bg-blue-50 rounded-lg">
                    {headerIcon}
                  </div>
                )}
                <div>
                  {title && (
                    <h3 className="text-lg font-semibold text-gray-900">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                  )}
                </div>
              </div>
            )}
            {headerActions && (
              <div className="flex items-center space-x-2">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={title || headerActions ? `${paddingClasses[padding]} pt-4` : paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
}