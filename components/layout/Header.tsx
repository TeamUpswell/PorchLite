"use client";

import { useAuth } from "@/components/auth";
import { useTheme } from "@/components/ThemeProvider";
import { usePathname } from "next/navigation";
import {
  User as UserIcon,
  Settings as CogIcon,
  Users as UserGroupIcon,
  LogOut,
  ChevronDown,
  Home as HomeIcon,
  Calendar as CalendarIcon,
  Building2 as HouseIcon,
  BookOpen as BookOpenIcon,
  CheckSquare as CheckSquareIcon,
  Heart as HeartIcon,
  Star as StarIcon,
  Package as PackageIcon,
  Phone as PhoneIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import ViewToggle from "./ViewToggle";

const accountSection = {
  category: "Account",
  items: [
    { name: "Profile", href: "/profile", icon: UserIcon },
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

// Page titles and icons mapping
const pageInfo: Record<
  string,
  { title: string; icon: any; description?: string }
> = {
  "/": {
    title: "Dashboard",
    icon: HomeIcon,
    description: "Overview of your property",
  },
  "/calendar": {
    title: "Calendar",
    icon: CalendarIcon,
    description: "Manage bookings and events",
  },
  "/house": {
    title: "The House",
    icon: HouseIcon,
    description: "Property information and amenities",
  },
  "/manual": {
    title: "Instructions",
    icon: BookOpenIcon,
    description: "House manual and guides",
  },
  "/tasks": {
    title: "Tasks",
    icon: CheckSquareIcon,
    description: "Manage property tasks",
  },
  "/guest-book": {
    title: "Guest Book",
    icon: HeartIcon,
    description: "Guest messages and feedback",
  },
  "/recommendations": {
    title: "Nearby Places",
    icon: StarIcon,
    description: "Local recommendations",
  },
  "/inventory": {
    title: "Inventory",
    icon: PackageIcon,
    description: "Property inventory management",
  },
  "/contacts": {
    title: "Contacts",
    icon: PhoneIcon,
    description: "Important contact information",
  },
  "/profile": {
    title: "Profile",
    icon: UserIcon,
    description: "Your account settings",
  },
  "/account/properties": {
    title: "Property Settings",
    icon: CogIcon,
    description: "Manage property configuration",
  },
  "/account/users": {
    title: "User Management",
    icon: UserGroupIcon,
    description: "Manage user access",
  },
};

// Alternative version with name-based colors:

function UserAvatar({
  user,
  className = "w-8 h-8",
}: {
  user: any;
  className?: string;
}) {
  const [showFallback, setShowFallback] = useState(false);

  // ✅ Updated to check more avatar sources including profile table
  const avatarUrl =
    user?.profile?.avatar_url || // ✅ Check profile table first
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.image ||
    user?.user_metadata?.photo ||
    user?.avatar_url ||
    user?.picture ||
    user?.image;

  const userName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  // Generate consistent colors based on name
  const getGradientFromName = (name: string) => {
    const colors = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-blue-600",
      "from-purple-500 to-pink-600",
      "from-orange-500 to-red-600",
      "from-teal-500 to-cyan-600",
      "from-indigo-500 to-purple-600",
    ];

    const hash = name.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  // If no avatar URL or we should show fallback, show initials
  if (!avatarUrl || showFallback) {
    const gradientClass = getGradientFromName(userName);

    return (
      <div
        className={`${className} rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg ring-2 ring-white/20`}
      >
        {userName ? (
          <span className="text-sm font-bold text-white drop-shadow-sm">
            {userName.charAt(0).toUpperCase()}
          </span>
        ) : (
          <UserIcon className="h-4 w-4 text-white drop-shadow-sm" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`${className} rounded-full overflow-hidden bg-gray-700 shadow-lg ring-2 ring-white/20`}
    >
      <img
        src={avatarUrl}
        alt={userName}
        className="w-full h-full object-cover"
        onError={() => setShowFallback(true)}
      />
    </div>
  );
}

export default function Header() {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDarkMode = theme === "dark";

  // Simple permission checker
  const hasPermission = (requiredRole: string) => {
    if (!user) return false;
    if (!requiredRole) return true;

    const userRole = user.user_metadata?.role || "family";
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userRole = user?.user_metadata?.role || "Member";

  // Get current page info
  const currentPage = pageInfo[pathname] || { title: "Page", icon: HomeIcon };
  const IconComponent = currentPage.icon;

  return (
    <header
      className={`
      border-b px-6 py-4
      ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}
    `}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Page title and icon */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div
              className={`
              p-2 rounded-lg
              ${isDarkMode ? "bg-gray-800" : "bg-gray-800"}
            `}
            >
              <IconComponent className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1
                className={`
                text-xl font-semibold
                ${isDarkMode ? "text-white" : "text-gray-900"}
              `}
              >
                {currentPage.title}
              </h1>
              {currentPage.description && (
                <p
                  className={`
                  text-sm
                  ${isDarkMode ? "text-gray-400" : "text-gray-600"}
                `}
                >
                  {currentPage.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center gap-4">
          {/* ViewToggle component */}
          <ViewToggle />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`
                flex items-center space-x-3 p-2 rounded-lg transition-colors
                ${
                  isDarkMode
                    ? "hover:bg-gray-800 text-gray-200"
                    : "hover:bg-gray-100 text-gray-700"
                }
              `}
            >
              {/* User Avatar */}
              <UserAvatar user={user} />

              {/* User Info */}
              <div className="hidden md:block text-left">
                <p
                  className={`
                  text-sm font-medium
                  ${isDarkMode ? "text-white" : "text-gray-900"}
                `}
                >
                  {userName}
                </p>
                <p
                  className={`
                  text-xs
                  ${isDarkMode ? "text-gray-400" : "text-gray-600"}
                `}
                >
                  {userRole}
                </p>
              </div>

              {/* Dropdown Arrow */}
              <ChevronDown
                className={`
                  h-4 w-4 transition-transform
                  ${isDropdownOpen ? "rotate-180" : ""}
                  ${isDarkMode ? "text-gray-400" : "text-gray-500"}
                `}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                className={`
                absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg py-2 z-50
                ${
                  isDarkMode
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }
              `}
              >
                {accountSection.items.map((item) => {
                  if (item.requiredRole && !hasPermission(item.requiredRole)) {
                    return null;
                  }

                  const IconComponent = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsDropdownOpen(false)}
                      className={`
                        flex items-center px-4 py-2 text-sm transition-colors
                        ${
                          isDarkMode
                            ? "text-gray-200 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      <IconComponent
                        className={`
                        mr-3 h-4 w-4
                        ${isDarkMode ? "text-gray-400" : "text-gray-500"}
                      `}
                      />
                      {item.name}
                    </Link>
                  );
                })}

                <hr
                  className={`
                  my-2
                  ${isDarkMode ? "border-gray-700" : "border-gray-200"}
                `}
                />

                <button
                  onClick={async () => {
                    try {
                      await signOut();
                      setIsDropdownOpen(false);
                    } catch (error) {
                      console.error("Error signing out:", error);
                    }
                  }}
                  className={`
                    w-full flex items-center px-4 py-2 text-sm transition-colors
                    ${
                      isDarkMode
                        ? "text-gray-200 hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <LogOut
                    className={`
                    mr-3 h-4 w-4
                    ${isDarkMode ? "text-gray-400" : "text-gray-500"}
                  `}
                  />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
