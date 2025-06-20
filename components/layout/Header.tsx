// components/layout/Header.tsx - Complete fix
"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import {
  getUserRole,
  canManageProperties,
  canManageUsers,
} from "@/lib/utils/roles";
import {
  User as UserIcon,
  Settings as CogIcon,
  Users as UserGroupIcon,
  LogOut,
  ChevronDown,
  Home as HomeIcon,
  Calendar as CalendarIcon,
  Building as HouseIcon,
  BookOpen as BookOpenIcon,
  CheckSquare as CheckSquareIcon,
  Heart as HeartIcon,
  Star as StarIcon,
  Package as PackageIcon,
  Phone as PhoneIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ✅ Move gradient colors outside component
const GRADIENT_COLORS = [
  "from-blue-500 to-purple-600",
  "from-green-500 to-blue-600",
  "from-purple-500 to-pink-600",
  "from-orange-500 to-red-600",
  "from-teal-500 to-cyan-600",
  "from-indigo-500 to-purple-600",
];

// ✅ Move static data outside component
const accountSection = {
  category: "Account",
  items: [
    { name: "Account", href: "/account", icon: UserIcon },
    {
      name: "Property Settings",
      href: "/account/properties",
      icon: CogIcon,
      permissionCheck: (user: any) => canManageProperties(user),
    },
    {
      name: "User Management",
      href: "/account/users",
      icon: UserGroupIcon,
      permissionCheck: (user: any) => canManageUsers(user),
    },
  ],
};

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
  "/account": {
    title: "Account",
    icon: UserIcon,
    description: "Account settings and preferences",
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

// ✅ FIXED UserAvatar component
const UserAvatar = ({ user, className = "w-8 h-8" }) => {
  const [showFallback, setShowFallback] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);
  const { profileData, profileLoading } = useAuth();

  console.log("🖼️ UserAvatar: Computing avatar URL...");
  console.log("🖼️ Profile data:", profileData);
  console.log("🖼️ Profile avatar_url:", profileData?.avatar_url);

  // ✅ Get avatar URL with cache busting
  const avatarUrl = useMemo(() => {
    if (profileData?.avatar_url) {
      const url = `${profileData.avatar_url}?t=${Date.now()}&key=${avatarKey}`;
      console.log("🖼️ Final avatar URL:", url);
      return url;
    }
    console.log("🖼️ No avatar URL found, will show fallback");
    return null;
  }, [profileData?.avatar_url, avatarKey]);

  // ✅ Get user name
  const userName = useMemo(() => {
    const name =
      profileData?.full_name ||
      user?.user_metadata?.name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "User";
    console.log("👤 UserAvatar: Display name:", name);
    return name;
  }, [profileData?.full_name, user]);

  // ✅ Generate gradient class based on name - FIXED!
  const gradientClass = useMemo(() => {
    if (!userName) return GRADIENT_COLORS[0];

    const hash = userName.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length];
  }, [userName]);

  // ✅ Listen for profile data changes
  useEffect(() => {
    const handleProfileChange = (event: CustomEvent) => {
      console.log("🔄 Header Avatar: Profile data changed:", event.detail);
      setShowFallback(false);
      setAvatarKey((prev) => prev + 1);
    };

    window.addEventListener(
      "profileDataChanged",
      handleProfileChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "profileDataChanged",
        handleProfileChange as EventListener
      );
    };
  }, []);

  // ✅ Handle image load error
  const handleImageError = useCallback(() => {
    console.log("❌ UserAvatar: Image failed to load:", avatarUrl);
    setShowFallback(true);
  }, [avatarUrl]);

  // ✅ Handle image load success
  const handleImageLoad = useCallback(() => {
    console.log("✅ UserAvatar: Image loaded successfully:", avatarUrl);
    setShowFallback(false);
  }, [avatarUrl]);

  if (profileLoading) {
    return (
      <div
        className={`${className} rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse`}
      />
    );
  }

  if (!avatarUrl || showFallback) {
    return (
      <div
        className={`${className} rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg ring-2 ring-white/20`}
      >
        <span className="text-sm font-bold text-white drop-shadow-sm">
          {userName ? userName.charAt(0).toUpperCase() : "U"}
        </span>
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={`${userName}'s avatar`}
      className={`${className} rounded-full object-cover shadow-lg ring-2 ring-white/20`}
      onLoad={handleImageLoad}
      onError={handleImageError}
      key={`avatar-${avatarKey}`}
    />
  );
};

export default function Header() {
  const { user, signOut, profileData } = useAuth();
  const { actualTheme } = useTheme();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDarkMode = actualTheme === "dark";

  const currentPage = useMemo(() => {
    return pageInfo[pathname] || { title: "Page", icon: HomeIcon };
  }, [pathname]);

  const userName = useMemo(() => {
    return (
      profileData?.full_name ||
      user?.user_metadata?.name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "User"
    );
  }, [profileData?.full_name, user]);

  const userRole = useMemo(() => getUserRole(user), [user]);

  const filteredAccountItems = useMemo(() => {
    return accountSection.items.filter((item) => {
      if (item.permissionCheck && !item.permissionCheck(user)) {
        return false;
      }
      return true;
    });
  }, [user]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsDropdownOpen(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [signOut]);

  const handleDropdownToggle = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleCloseDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const IconComponent = currentPage.icon;

  return (
    <header
      className={`
        border-b px-6 py-4 transition-colors duration-200
        ${
          isDarkMode
            ? "bg-gray-900 border-gray-700"
            : "bg-white border-gray-200"
        }
      `}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Page title and icon */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gray-800">
              <IconComponent className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1
                className={`
                text-xl font-semibold transition-colors duration-200
                ${isDarkMode ? "text-white" : "text-gray-900"}
              `}
              >
                {currentPage.title}
              </h1>
              {currentPage.description && (
                <p
                  className={`
                  text-sm transition-colors duration-200
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
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleDropdownToggle}
              className={`
                flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200
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
                  text-sm font-medium transition-colors duration-200
                  ${isDarkMode ? "text-white" : "text-gray-900"}
                `}
                >
                  {userName}
                </p>
                <p
                  className={`
                  text-xs transition-colors duration-200
                  ${isDarkMode ? "text-gray-400" : "text-gray-600"}
                `}
                >
                  {userRole}
                </p>
              </div>

              {/* Dropdown Arrow */}
              <ChevronDown
                className={`
                  h-4 w-4 transition-all duration-200
                  ${isDropdownOpen ? "rotate-180" : ""}
                  ${isDarkMode ? "text-gray-400" : "text-gray-500"}
                `}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                className={`
                absolute right-0 top-full mt-2 w-56 rounded-lg shadow-lg py-2 z-50
                border transition-colors duration-200
                ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }
              `}
              >
                {/* Profile info in dropdown */}
                <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <UserAvatar user={user} className="w-10 h-10" />
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {userName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                    <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full mt-1">
                      {userRole.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Account Items */}
                {filteredAccountItems.map((item) => {
                  const IconComponent = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={handleCloseDropdown}
                      className={`
                        flex items-center px-4 py-2 text-sm transition-colors duration-200
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
                  my-2 transition-colors duration-200
                  ${isDarkMode ? "border-gray-700" : "border-gray-200"}
                `}
                />

                <button
                  onClick={handleSignOut}
                  className={`
                    w-full flex items-center px-4 py-2 text-sm transition-colors duration-200
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
