// components/layout/SideNavigation.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
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
  ChevronLeft, // Add this import
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
  Heart as HeartIcon, // Add this import
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
  user?: any;
  onCollapseChange?: (collapsed: boolean) => void;
  useGridLayout?: boolean;
  isMobileMenuOpen?: boolean; // Add this
  setIsMobileMenuOpen?: (open: boolean) => void; // Add this
}

// ✅ UPDATE: Navigation structure - add The House section
const navigationStructure: NavigationSection[] = [
  {
    category: "General",
    items: [
      { name: "Dashboard", href: "/", icon: HomeIcon },
      { name: "Calendar", href: "/calendar", icon: CalendarIcon },
      { name: "The House", href: "/house", icon: HouseIcon },
      { name: "Instructions", href: "/manual", icon: BookOpenIcon },
      { name: "Tasks", href: "/tasks", icon: CheckSquareIcon },
      { name: "Guest Book", href: "/guest-book", icon: HeartIcon }, // Add this line
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
    { name: "Profile", href: "/profile", icon: UserIcon }, // Updated profile link
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
  onCollapseChange,
  isCollapsed = false,
}: {
  user?: any;
  onCollapseChange?: (collapsed: boolean) => void;
  isCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const { user: authUser, signOut } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const { theme } = useTheme();

  // Add collapsed state
  const [isCollapsedState, setIsCollapsed] = useState(isCollapsed);

  // ✅ UPDATE: Simplified expanded categories - only for non-collapsed state
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    General: true,
    Account: false,
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

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsedState;
    setIsCollapsed(newCollapsedState);

    // Notify parent component of the state change
    onCollapseChange?.(newCollapsedState);

    // Close all expanded categories when collapsing
    if (!newCollapsedState) {
      setExpandedCategories({
        General: false,
        Account: false,
      });
    } else {
      setExpandedCategories({
        General: true,
        Account: false,
      });
    }
  };

  const toggleCategory = (category: string) => {
    if (isCollapsedState) return; // Don't allow category expansion when collapsed
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

  // ✅ FIXED: Don't render navigation until auth is ready
  if (!user) {
    return null;
  }

  return (
    <div
      className={`
      h-full flex flex-col
      ${isCollapsed ? "w-16" : "w-64"}
      ${isDarkMode ? "bg-gray-900" : "bg-white"}
      border-r ${isDarkMode ? "border-gray-800" : "border-gray-200"}
      transition-all duration-300 ease-in-out
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
        {/* Logo content - adaptive to collapsed state */}
        <div className="rounded-lg p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-amber-500/20 via-transparent to-transparent"></div>

          <Link
            href="/"
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "space-x-3"
            } relative z-10`}
          >
            {/* Logo with glow effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-30"></div>
              <Image
                src="/images/logo-dark.png"
                alt="PorchLite"
                width={40}
                height={40}
                className="w-10 h-10 relative z-10"
                priority
              />
            </div>

            {/* Hide text when collapsed */}
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-white">PorchLite</h1>
                <p className="text-xs text-amber-200">Always Welcome</p>
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto">
        {navigationStructure.map((section) => {
          // Always show General section expanded, only allow Account to collapse
          const isExpanded =
            section.category === "General"
              ? true
              : expandedCategories[section.category] ?? true;

          return (
            <div key={section.category} className="space-y-1.5">
              {/* Category header - hide when collapsed, and don't show toggle for General */}
              {!isCollapsed && section.category !== "General" && (
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
              )}

              {/* Show General category label when not collapsed */}
              {!isCollapsed && section.category === "General" && (
                <div
                  className={`text-sm font-medium px-4 py-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  } mb-1`}
                >
                  <span>{section.category}</span>
                </div>
              )}

              {/* Navigation items */}
              {(isExpanded || isCollapsed) && (
                <div className={`space-y-1 ${!isCollapsed ? "pl-1" : ""}`}>
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
                        className={`flex items-center ${
                          isCollapsed ? "justify-center px-2" : "px-4"
                        } py-2 text-sm rounded-md group relative ${
                          isActive(item.href)
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <IconComponent
                          className={`${
                            isCollapsed ? "" : "mr-3"
                          } flex-shrink-0 h-5 w-5 ${
                            isActive(item.href)
                              ? "text-gray-500"
                              : "text-gray-400 group-hover:text-gray-500"
                          }`}
                        />
                        {!isCollapsed && item.name}

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            {item.name}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Simple footer/version info (optional) */}
      <div
        className={`border-t ${
          isDarkMode ? "border-gray-800" : "border-gray-200"
        } px-3 py-2 text-center`}
      >
        {!isCollapsed && (
          <p
            className={`text-xs ${
              isDarkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            PorchLite v1.0
          </p>
        )}
      </div>
    </div>
  );
}

// Standard fix pattern for any page:
export function PageName() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const [dataLoading, setDataLoading] = useState(true);

  // Early return for loading states
  if (authLoading || propertyLoading) {
    return (
      <ProtectedPageWrapper>
        <PageContainer>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  // Early return for no user
  if (!user) {
    return null;
  }

  // Early return for no property (if property is required)
  if (!currentProperty) {
    return (
      <ProtectedPageWrapper>
        <PageContainer>
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900">
              No Property Selected
            </h3>
            <p className="text-gray-500">
              Please select a property to continue.
            </p>
          </div>
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  // Data fetching useEffect
  useEffect(() => {
    if (authLoading || propertyLoading || !user?.id || !currentProperty?.id) {
      return;
    }

    fetchData();
  }, [user?.id, currentProperty?.id, authLoading, propertyLoading]);

  // Rest of component...
}
