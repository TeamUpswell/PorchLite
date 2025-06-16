// components/layout/StandardPageLayout.tsx
"use client";

import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import SideNavigation from "@/components/SideNavigation";
import { useState } from "react";

interface StandardPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  headerContent?: React.ReactNode;
  className?: string;
  theme?: "light" | "dark";
  showSideNav?: boolean;
}

export default function StandardPageLayout({
  children,
  title,
  subtitle,
  showHeader = true,
  headerContent,
  className = "",
  theme = "dark",
  showSideNav = true,
}: StandardPageLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`min-h-screen flex ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      } ${className}`}
    >
      {/* ✅ Integrated SideNavigation */}
      {showSideNav && (
        <SideNavigation
          onCollapseChange={setIsCollapsed}
          isCollapsed={isCollapsed}
          standalone={false} // ✅ Use integrated mode
        />
      )}

      {/* ✅ Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* ✅ Site Header - Always at the top */}
        <Header />

        {/* ✅ Page Header - Optional page-specific header */}
        {showHeader && (title || subtitle || headerContent) && (
          <div
            className={`${
              theme === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } shadow-sm border-b`}
          >
            <PageContainer spacing="tight">
              <div className="py-4">
                {headerContent || (
                  <>
                    {title && (
                      <h1
                        className={`text-2xl font-bold ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {title}
                      </h1>
                    )}
                    {subtitle && (
                      <p
                        className={`mt-1 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {subtitle}
                      </p>
                    )}
                  </>
                )}
              </div>
            </PageContainer>
          </div>
        )}

        {/* ✅ Main Content - Takes remaining space */}
        <div className="flex-1 overflow-auto">
          <PageContainer spacing="tight">{children}</PageContainer>
        </div>
      </div>
    </div>
  );
}

// ✅ ADD THIS LINE:
