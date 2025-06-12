"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import SideNavigation from "@/components/SideNavigation";
import { usePathname } from "next/navigation";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        !(event.target as Element).closest(".mobile-menu")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // ✅ Don't show layout on auth pages
  if (pathname?.startsWith("/auth") || !user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* ✅ Desktop Sidebar - Persistent */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className={`flex flex-col ${isCollapsed ? "w-16" : "w-64"}`}>
            <SideNavigation
              user={user}
              onCollapseChange={setIsCollapsed}
              isCollapsed={isCollapsed}
            />
          </div>
        </div>

        {/* ✅ Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Menu */}
            <div className="mobile-menu relative flex flex-col w-64 bg-white dark:bg-gray-900">
              <SideNavigation
                user={user}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
              />
            </div>
          </div>
        )}

        {/* ✅ Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header - Show menu button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              PorchLite
            </h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* ✅ Page Content - This is where smooth transitions happen */}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
