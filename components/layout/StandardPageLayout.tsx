// components/layout/StandardPageLayout.tsx
"use client";

import React from "react";
import Link from "next/link";
import ProtectedPageWrapper from "./ProtectedPageWrapper";

interface StandardPageLayoutProps {
  title: string;
  children: React.ReactNode;
  breadcrumb?: Array<{ label: string; href?: string }>;
  headerIcon?: React.ReactNode;
  action?: React.ReactNode; // ✅ Add action prop
  className?: string;
}

export default function StandardPageLayout({
  title,
  children,
  breadcrumb,
  headerIcon,
  action, // ✅ Add action parameter
  className = "",
}: StandardPageLayoutProps) {
  return (
    <ProtectedPageWrapper>
      <div className={`flex flex-col h-full bg-gray-800 ${className}`}>
        {/* Header - also make it darker */}
        <div className="bg-gray-900 shadow-sm border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                {headerIcon}
                <div>
                  {breadcrumb && (
                    <nav className="text-sm text-gray-400 mb-1">
                      {breadcrumb.map((crumb, index) => (
                        <span key={index}>
                          {crumb.href ? (
                            <Link
                              href={crumb.href}
                              className="hover:text-gray-300"
                            >
                              {crumb.label}
                            </Link>
                          ) : (
                            crumb.label
                          )}
                          {index < breadcrumb.length - 1 && " / "}
                        </span>
                      ))}
                    </nav>
                  )}
                  <h1 className="text-2xl font-bold text-white ml-16 md:ml-0">
                    {title}
                  </h1>
                </div>
              </div>

              {/* ✅ Action section */}
              {action && <div className="flex-shrink-0">{action}</div>}
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedPageWrapper>
  );
}
