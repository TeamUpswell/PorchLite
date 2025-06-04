// components/layout/SideNavigation.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth";
import { useTheme } from "@/components/ThemeProvider";
import {
  Home as HomeIcon,
  Calendar as CalendarIcon,
  ClipboardCheck as ClipboardCheckIcon,
  Package as PackageIcon,
  BookOpen as BookOpenIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  Users as UserGroupIcon,
  Settings as CogIcon,
  ChevronRight,
  FileText as DocumentTextIcon,
  User as UserIcon,
  Plus,
  Menu,
  X,
  Activity,
  AlertTriangle,
  CheckSquare as CheckSquareIcon,
  LogOut,
  Building2 as HouseIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

// Define interfaces for navigation items
interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
      title?: string | undefined;
      titleId?: string | undefined;
    } & React.RefAttributes<SVGSVGElement>
  >;
  requiredRole?: "family" | "owner" | "manager" | "friend";
  permissions?: string[]; // Add permissions field
}

interface NavigationSection {
  category: string;
  items: NavigationItem[];
}

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    role?: string;
  };
}

interface SideNavigationProps {
  user?: User | null;
}

// ✅ UPDATE: Navigation structure - add The House section
const navigationStructure: NavigationSection[] = [
  {
    category: "General",
    items: [
      { name: "Dashboard", href: "/", icon: HomeIcon },
      { name: "Calendar", href: "/calendar", icon: CalendarIcon },
      { name: "The House", href: "/house", icon: HouseIcon }, // Add The House here
      { name: "Instructions", href: "/manual", icon: BookOpenIcon },
      { name: "Tasks", href: "/tasks", icon: CheckSquareIcon },
      { name: "Nearby Places", href: "/recommendations", icon: StarIcon },
      { name: "Inventory", href: "/inventory", icon: PackageIcon },
      { name: "Contacts", href: "/contacts", icon: PhoneIcon },
    ],
  },
];

// ✅ UPDATE: Move account items to a section structure
const accountSection: NavigationSection = {
  category: "Account",
  items: [
    { name: "Profile", href: "/account/profile", icon: UserIcon },
    {
      name: "Property Settings",
      href: "/account/properties",
      icon: CogIcon,
      requiredRole: "manager",
    },
    {
      name: "User Management",
      href: "/account/users",
      icon: UserGroupIcon,
      requiredRole: "manager",
    },
  ],
};

export default function SideNavigation({
  user: propUser,
}: SideNavigationProps) {
  const pathname = usePathname();
  const { user: authUser, signOut } = useAuth();
  const { theme } = useTheme();
  // ✅ UPDATE: Add Account to expanded categories state
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    General: true,
    Account: false, // Account starts collapsed
  });

  // Use either the passed user or the auth user
  const user = propUser || authUser;

  // Simple permission checker since we don't have the hasPermission function
  const hasPermission = (requiredRole: string) => {
    if (!user) return false;
    if (!requiredRole) return true;

    // Simple role check - you can enhance this based on your needs
    const userRole = user.user_metadata?.role || "family";

    // Basic hierarchy: owner > manager > family > friend
    const roleHierarchy = {
      owner: 4,
      manager: 3,
      family: 2,
      friend: 1,
    };

    const userLevel =
      roleHierarchy[userRole as keyof typeof roleHierarchy] || 1;
    const requiredLevel =
      roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 1;

    return userLevel >= requiredLevel;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category],
    });
  };

  const isActive = (href: string) => pathname === href;

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Add mobile state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        !(event.target as Element).closest(".side-navigation")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Menu Button - Back at top but with better positioning */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`fixed top-4 left-4 z-50 p-2 rounded-md ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
          } shadow-lg md:hidden border ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      )}

      {/* Backdrop for mobile */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Side Navigation */}
      <div
        className={`
          side-navigation
          fixed inset-y-0 left-0 z-50 
          w-64
          ${isDarkMode ? "bg-gray-900" : "bg-white"}
          border-r 
          ${isDarkMode ? "border-gray-800" : "border-gray-200"}
          transition-transform duration-300 ease-in-out
          ${
            isMobile && !isMobileMenuOpen
              ? "-translate-x-full"
              : "translate-x-0"
          }
          md:translate-x-0
          flex flex-col
        `}
      >
        {/* Header with logo */}
        <div
          className={`p-4 border-b ${
            isDarkMode
              ? "border-gray-800 bg-gray-900"
              : "border-gray-200 bg-white"
          }`}
        >
          {/* Logo content with dark theme styles */}
          {/* Classic lantern aesthetic */}
          <div className="rounded-lg p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
            {/* Subtle glow background */}
            <div className="absolute inset-0 bg-gradient-radial from-amber-500/20 via-transparent to-transparent"></div>

            <Link
              href="/"
              className="flex items-center space-x-3 relative z-10"
            >
              {/* Logo with glow effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-30"></div>
                <Image
                  src="/images/logo-dark.png" // Updated to PNG
                  alt="PorchLite"
                  width={40}
                  height={40}
                  className="w-12 h-12 relative z-10"
                  priority
                />
              </div>

              <div>
                <h1 className="text-lg font-bold text-white">PorchLite</h1>
                <p className="text-xs text-amber-200">Always Welcome</p>
              </div>
            </Link>
          </div>
        </div>

        {/* ✅ UPDATE: Main Navigation - now includes account section */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navigationStructure.map((section) => {
            const isExpanded = expandedCategories[section.category] ?? true;

            return (
              <div key={section.category} className="space-y-1.5">
                <button
                  onClick={() => toggleCategory(section.category)}
                  className={`w-full flex items-center justify-between text-left text-sm font-medium px-4 py-2 ${
                    isDarkMode
                      ? "text-gray-300 hover:text-white"
                      : "text-gray-600 hover:text-gray-900"
                  } mb-1 transition-colors duration-200`}
                >
                  <span>{section.category}</span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="space-y-1 pl-1">
                    {section.items.map((item) => {
                      if (
                        item.requiredRole &&
                        !hasPermission(item.requiredRole)
                      ) {
                        return null;
                      }

                      const IconComponent = item.icon || DocumentTextIcon;

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => isMobile && setIsMobileMenuOpen(false)}
                          className={`flex items-center px-4 py-2 text-sm rounded-md ${
                            isActive(item.href)
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          <IconComponent
                            className={`mr-3 flex-shrink-0 h-5 w-5 ${
                              isActive(item.href)
                                ? "text-gray-500"
                                : "text-gray-400 group-hover:text-gray-500"
                            }`}
                          />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ✅ UPDATE: Account Section at Bottom - now expandable */}
        <div
          className={`border-t ${
            isDarkMode ? "border-gray-800" : "border-gray-200"
          } px-3 py-4`}
        >
          <div className="space-y-1.5">
            {/* Account Header - now clickable to expand */}
            <button
              onClick={() => toggleCategory("Account")}
              className={`w-full flex items-center justify-between text-left text-sm font-medium px-4 py-2 ${
                isDarkMode
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              } mb-1 transition-colors duration-200`}
            >
              <span>Account</span>
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  expandedCategories.Account ? "rotate-90" : ""
                }`}
              />
            </button>

            {/* Account Navigation Items - only show when expanded */}
            {expandedCategories.Account && (
              <div className="space-y-1 pl-1">
                {accountSection.items.map((item) => {
                  // Check permissions
                  if (item.requiredRole && !hasPermission(item.requiredRole)) {
                    return null;
                  }

                  const IconComponent = item.icon || DocumentTextIcon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => isMobile && setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-2 text-sm rounded-md ${
                        isActive(item.href)
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <IconComponent
                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          isActive(item.href)
                            ? "text-gray-500"
                            : "text-gray-400 group-hover:text-gray-500"
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}

                {/* ✅ Sign Out Button - inside the expanded section */}
                <button
                  onClick={async () => {
                    try {
                      await signOut();
                      if (isMobile) setIsMobileMenuOpen(false);
                    } catch (error) {
                      console.error("Error signing out:", error);
                    }
                  }}
                  className={`w-full flex items-center px-4 py-2 text-sm rounded-md ${
                    isDarkMode
                      ? "text-gray-200 hover:bg-gray-800"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes flicker {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.95;
          }
          51% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
