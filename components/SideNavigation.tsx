// components/layout/SideNavigation.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  ChevronLeft,
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
  Heart as HeartIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

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
  permissions?: string[];
}

interface NavigationSection {
  category: string;
  items: NavigationItem[];
}

interface SideNavigationProps {
  user?: any;
  onCollapseChange?: (collapsed: boolean) => void;
  isCollapsed?: boolean;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

// Navigation structure
const navigationStructure: NavigationSection[] = [
  {
    category: "General",
    items: [
      { name: "Dashboard", href: "/", icon: HomeIcon },
      { name: "Calendar", href: "/calendar", icon: CalendarIcon },
      { name: "The House", href: "/house", icon: HouseIcon },
      { name: "Instructions", href: "/manual", icon: BookOpenIcon },
      { name: "Tasks", href: "/tasks", icon: CheckSquareIcon },
      { name: "Guest Book", href: "/guest-book", icon: HeartIcon },
      { name: "Nearby Places", href: "/recommendations", icon: StarIcon },
      { name: "Inventory", href: "/inventory", icon: PackageIcon },
      { name: "Contacts", href: "/contacts", icon: PhoneIcon },
    ],
  },
];

export default function SideNavigation({
  user: propUser,
  onCollapseChange,
  isCollapsed = false,
  isMobileMenuOpen = false,
  setIsMobileMenuOpen,
}: SideNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, signOut } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const { theme } = useTheme();

  // ✅ RESTORED: Missing state variables
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsedState, setIsCollapsed] = useState(isCollapsed);
  const [expandedCategories, setExpandedCategories] = useState({
    General: true,
    Account: false,
  });

  // ✅ RESTORED: Missing hasPermission function
  const hasPermission = (requiredRole: string) => {
    const userRole =
      propUser?.user_metadata?.role || authUser?.user_metadata?.role || "family";

    if (userRole === "manager" || userRole === "owner") return true;
    return requiredRole === "family";
  };

  // Mobile menu handlers
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLinkClick = (href?: string) => {
    setMobileMenuOpen(false);
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }

    if (href) {
      setTimeout(() => {
        router.push(href);
      }, 100);
    }
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
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Use either the passed user or the auth user
  const user = propUser || authUser;

  // Don't render navigation until auth is ready
  if (!user) {
    return null;
  }

  // ✅ RESTORED: Missing toggle functions
  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsedState;
    setIsCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);

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
    if (isCollapsedState) return;
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

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          id="mobile-menu-button"
          onClick={toggleMobileMenu}
          className="p-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700"
          style={{
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            minHeight: '44px',
            minWidth: '44px',
          }}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => handleLinkClick()}
          style={{
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'none',
          }}
        />
      )}

      {/* Sidebar */}
      <div
        id="mobile-sidebar"
        className={`
          fixed lg:static top-0 left-0 z-40 h-screen
          ${isCollapsedState ? "w-16" : "w-64"}
          ${isDarkMode ? "bg-gray-900" : "bg-white"}
          border-r ${isDarkMode ? "border-gray-800" : "border-gray-200"}
          transition-all duration-300 ease-in-out
          ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header with logo */}
          <div
            className={`p-4 border-b ${
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
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
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
          </div>

          {/* Navigation items */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {navigationStructure.map((section) => {
              const isExpanded =
                section.category === "General"
                  ? true
                  : expandedCategories[section.category] ?? true;

              return (
                <div key={section.category} className="space-y-1.5">
                  {/* Category header */}
                  {!isCollapsedState && section.category !== "General" && (
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

                  {!isCollapsedState && section.category === "General" && (
                    <div
                      className={`text-sm font-medium px-4 py-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      } mb-1`}
                    >
                      <span>{section.category}</span>
                    </div>
                  )}

                  {/* Navigation items */}
                  {(isExpanded || isCollapsedState) && (
                    <div className={`space-y-1 ${!isCollapsedState ? "pl-1" : ""}`}>
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
                            onClick={(e) => {
                              e.preventDefault();
                              handleLinkClick(item.href);
                            }}
                            className={`flex items-center ${
                              isCollapsedState ? "justify-center px-2" : "px-4"
                            } py-2 text-sm rounded-md group relative ${
                              isActive(item.href)
                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                            title={isCollapsedState ? item.name : undefined}
                            style={{
                              WebkitTapHighlightColor: 'transparent',
                              touchAction: 'manipulation',
                              minHeight: '44px',
                            }}
                          >
                            <IconComponent
                              className={`${
                                isCollapsedState ? "" : "mr-3"
                              } flex-shrink-0 h-5 w-5 ${
                                isActive(item.href)
                                  ? "text-gray-500"
                                  : "text-gray-400 group-hover:text-gray-500"
                              }`}
                            />
                            {!isCollapsedState && item.name}

                            {isCollapsedState && (
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
