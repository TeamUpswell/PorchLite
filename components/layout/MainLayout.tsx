"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import SideNavigation from "@/components/SideNavigation";
import Header from "@/components/layout/Header"; // Add this
import { useAuth } from "@/components/auth";
import { useTheme } from "@/components/ThemeProvider";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        !target.closest(".sidebar") &&
        !target.closest(".mobile-menu-button")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  return (
    <div
      className={`h-screen flex overflow-hidden ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`
            mobile-menu-button
            fixed top-4 left-4 z-50 p-2 rounded-md shadow-lg
            ${
              isDarkMode
                ? "bg-gray-800 text-white border-gray-700"
                : "bg-white text-gray-900 border-gray-200"
            }
            border transition-all duration-200 hover:shadow-xl
            ${isMobileMenuOpen ? "translate-x-64" : ""}
          `}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`
        sidebar
        ${isMobile ? "fixed inset-y-0 left-0 z-40" : "relative"}
        ${isMobile && !isMobileMenuOpen ? "-translate-x-full" : "translate-x-0"}
        transition-transform duration-300 ease-in-out
      `}
      >
        <SideNavigation
          user={user}
          isCollapsed={!isMobile && isSidebarCollapsed}
          onCollapseChange={setIsSidebarCollapsed}
        />
      </div>

      {/* Main Content with Header */}
      <main
        className={`
        flex-1 flex flex-col overflow-hidden
        ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}
      `}
      >
        {/* Add Header */}
        <Header />

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  );
}
