// components/SideNavigation.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { useTheme } from "@/components/ThemeProvider";
import { getUserRole } from "@/lib/utils/roles";
import {
  Home as HomeIcon,
  Calendar as CalendarIcon,
  ClipboardCheck as ClipboardCheckIcon,
  Package as PackageIcon,
  BookOpen as BookOpenIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  ChevronRight,
  ChevronLeft,
  FileText as DocumentTextIcon,
  Menu,
  X,
  CheckSquare as CheckSquareIcon,
  Building2 as HouseIcon,
  Heart as HeartIcon,
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
  permissionCheck?: (user: any) => boolean;
  permissions?: string[];
}

interface SideNavigationProps {
  user?: any;
  onCollapseChange?: (collapsed: boolean) => void;
  isCollapsed?: boolean;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
  standalone?: boolean;
}

// Helper function for basic role checking
const hasMinimumRole = (user: any, minRole: string) => {
  const userRole = getUserRole(user);
  const roleHierarchy = {
    guest: 0,
    friend: 1,
    family: 2,
    staff: 3,
    manager: 4,
    admin: 5,
    owner: 6,
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const minLevel = roleHierarchy[minRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= minLevel;
};

// Navigation structure
const navigationItems: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: HomeIcon },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
  { name: "The House", href: "/house", icon: HouseIcon },
  { name: "Instructions", href: "/manual", icon: BookOpenIcon },
  { name: "Tasks", href: "/tasks", icon: CheckSquareIcon },
  { name: "Guest Book", href: "/guest-book", icon: HeartIcon },
  { name: "Nearby Places", href: "/recommendations", icon: StarIcon },
  { name: "Inventory", href: "/inventory", icon: PackageIcon },
  { name: "Contacts", href: "/contacts", icon: PhoneIcon },
];

export default function SideNavigation({
  user: propUser,
  onCollapseChange,
  isCollapsed = false,
  isMobileMenuOpen = false,
  setIsMobileMenuOpen,
  standalone = true,
}: SideNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const { theme } = useTheme();

  // State for mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(isMobileMenuOpen);
  const [isCollapsedState, setIsCollapsed] = useState(isCollapsed);

  // Sync with external props
  useEffect(() => {
    setIsCollapsed(isCollapsed);
  }, [isCollapsed]);

  useEffect(() => {
    setMobileMenuOpen(isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  // Use either the passed user or the auth user
  const user = propUser || authUser;

  // Don't render navigation until auth is ready
  if (!user) {
    return null;
  }

  // Mobile menu handlers
  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    setIsMobileMenuOpen?.(newState);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setIsMobileMenuOpen?.(false);
  };

  const handleLinkClick = (href: string) => {
    closeMobileMenu();
    // Small delay to allow menu animation to start
    setTimeout(() => {
      router.push(href);
    }, 150);
  };

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const sidebar = document.getElementById("mobile-sidebar");
      const menuButton = document.getElementById("mobile-menu-button");

      if (
        mobileMenuOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        menuButton &&
        !menuButton.contains(event.target as Node)
      ) {
        closeMobileMenu();
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Toggle functions
  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsedState;
    setIsCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);
  };

  const isActive = (href: string) => pathname === href;

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <>
      {/* Mobile Menu Button - Fixed positioning for better accessibility */}
      {standalone && (
        <button
          id="mobile-menu-button"
          onClick={toggleMobileMenu}
          className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          style={{
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
            minHeight: "48px",
            minWidth: "48px",
          }}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <div className="relative w-6 h-6">
            <Menu 
              className={`h-6 w-6 text-gray-600 dark:text-gray-300 absolute inset-0 transition-all duration-200 ${
                mobileMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'
              }`} 
            />
            <X 
              className={`h-6 w-6 text-gray-600 dark:text-gray-300 absolute inset-0 transition-all duration-200 ${
                mobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
              }`} 
            />
          </div>
        </button>
      )}

      {/* Mobile Overlay - Enhanced with smooth transitions */}
      <div
        className={`lg:hidden fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          mobileMenuOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileMenu}
        style={{
          WebkitTapHighlightColor: "transparent",
        }}
      />

      {/* Sidebar - Enhanced mobile animations */}
      <div
        id="mobile-sidebar"
        className={`
          ${standalone ? "fixed lg:static" : "relative"} 
          top-0 left-0 z-40
          h-screen
          ${isCollapsedState ? "w-16" : "w-64"}
          ${isDarkMode ? "bg-gray-900" : "bg-white"}
          border-r ${isDarkMode ? "border-gray-800" : "border-gray-200"}
          transition-all duration-300 ease-in-out
          ${
            standalone
              ? `transform ${
                  mobileMenuOpen
                    ? "translate-x-0"
                    : "-translate-x-full lg:translate-x-0"
                } lg:transform-none`
              : ""
          }
          shadow-xl lg:shadow-none
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header with logo - Enhanced mobile spacing */}
          <div
            className={`p-4 lg:p-4 border-b ${
              isDarkMode
                ? "border-gray-800 bg-gray-900"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="rounded-lg p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-amber-500/20 via-transparent to-transparent"></div>

              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick("/");
                }}
                className={`flex items-center ${
                  isCollapsedState ? "justify-center" : "space-x-3"
                } relative z-10`}
                style={{
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                }}
              >
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

                {!isCollapsedState && (
                  <div>
                    <h1 className="text-lg font-bold text-white">PorchLite</h1>
                    <p className="text-xs text-amber-200">Always Welcome</p>
                  </div>
                )}
              </Link>
            </div>

            {/* Desktop collapse toggle */}
            <div className="hidden lg:block mt-3">
              <button
                onClick={toggleSidebar}
                className={`w-full flex items-center justify-center p-2 rounded-md ${
                  isDarkMode
                    ? "hover:bg-gray-800 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                } transition-colors duration-200`}
                aria-label={isCollapsedState ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsedState ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation items - Enhanced mobile touch targets */}
          <div
            className="flex-1 overflow-y-auto p-2"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="space-y-1">
              {navigationItems.map((item) => {
                // Check permissions
                if (item.permissionCheck && !item.permissionCheck(user)) {
                  return null;
                }

                const IconComponent = item.icon || DocumentTextIcon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(item.href);
                    }}
                    className={`flex items-center ${
                      isCollapsedState ? "justify-center px-2" : "px-3"
                    } py-3 lg:py-2.5 text-sm rounded-md group relative transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
                    }`}
                    title={isCollapsedState ? item.name : undefined}
                    style={{
                      WebkitTapHighlightColor: "transparent",
                      touchAction: "manipulation",
                      minHeight: "48px", // Larger touch target on mobile
                    }}
                  >
                    <IconComponent
                      className={`${
                        isCollapsedState ? "" : "mr-3"
                      } flex-shrink-0 h-5 w-5 ${
                        isActive(item.href)
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                      }`}
                    />
                    {!isCollapsedState && (
                      <span className="truncate font-medium lg:font-normal">{item.name}</span>
                    )}

                    {/* Tooltip for collapsed state - Hidden on mobile */}
                    {isCollapsedState && (
                      <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div
            className={`border-t ${
              isDarkMode ? "border-gray-800" : "border-gray-200"
            } px-3 py-2 text-center`}
          >
            {!isCollapsedState && (
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
      </div>
    </>
  );
}
