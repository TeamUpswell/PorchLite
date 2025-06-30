"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { PropertySwitcher } from "@/components/property/PropertySwitcher";
import SideNavigation from "@/components/SideNavigation";
import Header from "@/components/layout/Header";
import { usePathname } from "next/navigation";

interface MainLayoutProps {
  children: React.ReactNode;
  showSideNav?: boolean;
  showHeader?: boolean;
  className?: string;
  theme?: "light" | "dark";
}

export default function MainLayout({
  children,
  showSideNav = true,
  showHeader = true,
  className = "",
  theme = "light",
}: MainLayoutProps) {
  const { user } = useAuth();
  const { userProperties } = useProperty();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Don't show layout on auth pages
  if (pathname?.startsWith("/auth") || !user) {
    return <>{children}</>;
  }

  return (
    <div className={`min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 ${className}`}>
      {/* SideNavigation - Fixed height and positioned */}
      {showSideNav && (
        <div className="fixed left-0 top-0 h-full z-30">
          <SideNavigation
            user={user}
            onCollapseChange={setIsCollapsed}
            isCollapsed={isCollapsed}
            standalone={true}
          />
        </div>
      )}

      {/* Main Content Area - with left margin to account for fixed sidebar */}
      <div className={`flex-1 flex flex-col min-h-screen ${
        showSideNav ? (isCollapsed ? "ml-16" : "ml-64") : ""
      }`}>
        {/* Site Header */}
        {showHeader && <Header />}

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>

          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">PorchLite</h1>

          {userProperties.length > 1 && (
            <div className="w-32">
              <PropertySwitcher />
            </div>
          )}
        </div>

        {/* Main Content with proper container and background for better text contrast */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
