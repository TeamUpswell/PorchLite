// components/layout/StandardPageLayout.tsx
"use client";

import { ReactNode } from "react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";

interface StandardPageLayoutProps {
  title?: string; // ← Make title optional
  subtitle?: string;
  headerIcon?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function StandardPageLayout({
  title,
  subtitle,
  headerIcon,
  headerActions,
  children,
  className = "",
}: StandardPageLayoutProps) {
  return (
    <AuthenticatedLayout>
      {/* Header Section - Only show if title is provided */}
      {title && (
        <div className="bg-gray-900 border-b border-slate-700">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {headerIcon && (
                  <div className="p-2 bg-slate-700 rounded-lg">
                    {headerIcon}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white">{title}</h1>
                  {subtitle && (
                    <p className="text-slate-300 mt-1">{subtitle}</p>
                  )}
                </div>
              </div>
              {headerActions && (
                <div className="flex items-center space-x-3">
                  {headerActions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="min-h-screen bg-gray-900">
        <div
          className={`container mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}
        >
          {children}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
