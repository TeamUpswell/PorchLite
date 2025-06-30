"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { useWeather } from "@/lib/hooks/useWeather";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StandardCard from "@/components/ui/StandardCard";
import { ManualStyleCard } from "@/components/ui/StandardCard";
import { Home as HomeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import GoogleMapComponent from "@/components/GoogleMapComponent";
import { debugLog, debugError } from "@/lib/utils/debug";

interface UpcomingVisit {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  status: "good" | "low" | "critical";
}

interface TestUser {
  id: string;
  name: string;
  email: string;
}

export default function HomePage() {
  // CRITICAL: All hooks must be called unconditionally at the top level
  const {
    user,
    loading: authLoading,
    initialized: authInitialized,
  } = useAuth();
  const {
    currentProperty,
    userPropertiesCount,
    loading: propertyLoading,
  } = useProperty();

  // Add weather hook
  const {
    weather,
    loading: weatherLoading,
    error: weatherError,
  } = useWeather(
    currentProperty
      ? `${currentProperty.address}, ${currentProperty.city}, ${currentProperty.state}`
      : undefined
  );

  const router = useRouter();

  // All useState hooks first
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "priority" | "status">("date");
  const [isTestMode, setIsTestMode] = useState(false);
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryItem[]>([]);
  const [taskAlerts, setTaskAlerts] = useState<any[]>([]);
  const [totalInventoryCount, setTotalInventoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [componentLoading, setComponentLoading] = useState({
    visits: true,
    inventory: true,
    tasks: true,
  });

  // All useRef hooks
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  const initTimeRef = useRef<number>(Date.now());
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef<string | null>(null);

  // All useCallback hooks
  const handleFilterChange = useCallback((filter: string) => {
    setSelectedFilter(filter);
  }, []);

  const fetchDashboardData = useCallback(
    async (property_id: string, userId: string) => {
      // Prevent duplicate fetches for the same property
      if (fetchingRef.current || hasFetchedRef.current === property_id) {
        return;
      }

      fetchingRef.current = true;
      hasFetchedRef.current = property_id;

      try {
        debugLog(
          "🏠 Property and user loaded, fetching dashboard:",
          currentProperty?.name
        );

        const today = new Date().toISOString().split("T")[0];
        debugLog("🔍 Fetching dashboard data for property:", property_id);
        debugLog("🔍 Dashboard: Looking for reservations after:", today);

        // Fetch visits
        const visitsData = await supabase
          .from("reservations")
          .select("id, title, start_date, end_date, status")
          .eq("property_id", property_id)
          .gte("start_date", today)
          .order("start_date", { ascending: true })
          .limit(10);

        debugLog(
          "📊 Dashboard: Found reservations:",
          visitsData.data?.length || 0
        );
        setUpcomingVisits(visitsData.data || []);
        setComponentLoading((prev) => ({ ...prev, visits: false }));

        // Fetch inventory
        const inventoryData = await supabase
          .from("inventory")
          .select("id, name, quantity")
          .eq("property_id", property_id)
          .eq("is_active", true);

        const inventoryItems = inventoryData.data || [];
        const lowStockItems = inventoryItems
          .filter((item) => item.quantity !== null && item.quantity < 5)
          .map((item) => ({
            ...item,
            status: (item.quantity === 0
              ? "critical"
              : item.quantity < 2
              ? "critical"
              : "low") as "good" | "low" | "critical",
          }));

        setInventoryAlerts(lowStockItems);
        setTotalInventoryCount(inventoryItems.length);
        setComponentLoading((prev) => ({ ...prev, inventory: false }));

        // Fetch the tasks query to match your actual schema:
        const tasksData = await supabase
          .from("tasks")
          .select(
            "id, title, description, priority, status, created_at, due_date, assigned_to"
          )
          .eq("property_id", property_id)
          .in("status", ["pending", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(10);

        debugLog("📊 Dashboard: Found tasks:", tasksData.data?.length || 0);
        setTaskAlerts(tasksData.data || []);
        setComponentLoading((prev) => ({ ...prev, tasks: false }));

        debugLog("✅ Dashboard data fetched successfully");
      } catch (error) {
        debugError("❌ Error fetching dashboard data:", error);
        setComponentLoading({ visits: false, inventory: false, tasks: false });
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [currentProperty?.name]
  );

  // All useMemo hooks - MUST be called unconditionally
  const debugAuthState = useMemo(
    () => ({
      user: user?.id,
      authLoading,
      propertyLoading,
      currentProperty: currentProperty?.id,
      propertyName: currentProperty?.name,
    }),
    [
      user?.id,
      authLoading,
      propertyLoading,
      currentProperty?.id,
      currentProperty?.name,
    ]
  );

  const navigationHandlers = useMemo(
    () => ({
      handleUpcomingVisitsClick: () => router.push("/calendar"),
      handleLowStockClick: () => router.push("/inventory"),
      handleTasksClick: () => router.push("/tasks"),
      handleAddReservation: () => router.push("/calendar"),
      handleInventoryClick: () => router.push("/inventory"),
      handleCreateTaskClick: () => router.push("/tasks"),
    }),
    [router]
  );

  // All useEffect hooks
  useEffect(() => {
    debugLog("🔍 HomePage Full Debug:", {
      user: user ? user.email + " (" + user.id.slice(0, 8) + "...)" : null,
      authLoading,
      authInitialized,
      currentProperty: currentProperty ? currentProperty.name : null,
      userPropertiesCount,
      propertyLoading,
      hasUser: !!user,
      hasProperty: !!currentProperty,
      propertyId: currentProperty?.id || "missing",
      propertyName: currentProperty?.name,
    });
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    debugLog("🏠 HomePage useEffect:", {
      authLoading,
      propertyLoading,
      userId: user?.id ? "present" : "missing",
      propertyId: currentProperty?.id ? "present" : "missing",
      propertyName: currentProperty?.name,
    });

    const loadingTimeout = setTimeout(() => {
      debugLog(
        "⏰ HomePage: Loading timeout reached, showing dashboard anyway"
      );
      setLoading(false);
    }, 15000);

    if (authLoading) {
      debugLog("🔄 HomePage: Auth still loading, waiting...");
      return () => clearTimeout(loadingTimeout);
    }

    if (!user?.id) {
      debugLog("🔄 HomePage: No user, redirecting to auth...");
      router.push("/auth");
      return () => clearTimeout(loadingTimeout);
    }

    if (propertyLoading) {
      debugLog(
        "🔄 HomePage: Properties loading, will show dashboard when ready..."
      );
    }

    debugLog("✅ HomePage: Ready to show dashboard");
    clearTimeout(loadingTimeout);

    if (currentProperty?.id) {
      fetchDashboardData(currentProperty.id, user.id);
    } else {
      debugLog("📊 HomePage: No property selected, showing empty dashboard");
      setLoading(false);
    }

    return () => clearTimeout(loadingTimeout);
  }, [
    user?.id,
    currentProperty?.id,
    currentProperty?.name,
    authLoading,
    propertyLoading,
    fetchDashboardData,
    router,
  ]);

  useEffect(() => {
    debugLog("🔍 Debug - Auth state:", {
      user: user?.id,
      authLoading,
      propertyLoading,
      currentProperty: currentProperty?.id,
      propertyName: currentProperty?.name,
    });
  }, [user, authLoading, propertyLoading, currentProperty]);

  useEffect(() => {
    if (currentProperty?.id !== hasFetchedRef.current) {
      hasFetchedRef.current = null;
      fetchingRef.current = false;
      setComponentLoading({ visits: true, inventory: true, tasks: true });
      setLoading(true);
    }
  }, [currentProperty?.id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Early returns AFTER all hooks - FIX THE CONDITION
  if (authLoading || !authInitialized) {
    debugLog("🔄 HomePage: Auth still loading, waiting...", {
      authLoading,
      authInitialized,
    });
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">
            Loading your account...
          </p>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <StandardCard>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StandardCard>
    );
  }

  if (user?.id && propertyLoading) {
    return (
      <StandardCard>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">
              Loading your properties...
            </p>
          </div>
        </div>
      </StandardCard>
    );
  }

  if (!currentProperty) {
    return (
      <StandardCard>
        <div className="text-center py-8">
          <HomeIcon className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No Property Selected
          </h3>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Please select a property to view your dashboard.
          </p>
        </div>
      </StandardCard>
    );
  }

  if (
    user?.id &&
    !propertyLoading &&
    (!currentProperty || currentProperty === null)
  ) {
    return (
      <StandardCard>
        <div className="text-center py-8">
          <HomeIcon className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            No Properties Found
          </h3>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 mb-4">
            You don&apos;t have any properties yet. Create one to get started.
          </p>
          <button
            onClick={() => router.push("/properties/create")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Your First Property
          </button>
        </div>
      </StandardCard>
    );
  }

  // Main dashboard
  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="mb-6">
        <DashboardHeader
          title={currentProperty?.name || "Dashboard"}
          subtitle={
            currentProperty?.address || "Welcome to your property dashboard"
          }
          weather={weather}
          showWeather={true}
        />
      </div>

      {/* Stats Grid - 3 clickable cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Upcoming Visits */}
        <div
          onClick={navigationHandlers.handleUpcomingVisitsClick}
          className="cursor-pointer transform transition-all duration-200 hover:scale-105"
          role="button"
          tabIndex={0}
        >
          <ManualStyleCard
            title="Upcoming Visits"
            badge={`${upcomingVisits.length} visits`}
            icon={
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            }
          >
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {componentLoading.visits ? "..." : upcomingVisits.length}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-2">
                Click to view calendar →
              </p>
            </div>
          </ManualStyleCard>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={navigationHandlers.handleLowStockClick}
          className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 rounded-lg group"
          role="button"
          tabIndex={0}
        >
          <StandardCard className="h-full group-hover:shadow-lg transition-shadow bg-gray-800 dark:bg-gray-900 border-gray-700 dark:border-gray-600">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-200 dark:text-gray-300">
                  Low Stock Alerts
                </p>
                <p className="text-2xl font-semibold text-white dark:text-gray-100">
                  {componentLoading.inventory ? "..." : inventoryAlerts.length}
                </p>
                <p className="text-xs text-yellow-400 dark:text-yellow-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to manage inventory →
                </p>
              </div>
            </div>
          </StandardCard>
        </div>

        {/* Pending Tasks */}
        <div
          onClick={navigationHandlers.handleTasksClick}
          className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg group"
          role="button"
          tabIndex={0}
        >
          <StandardCard className="h-full group-hover:shadow-lg transition-shadow bg-gray-800 dark:bg-gray-900 border-gray-700 dark:border-gray-600">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-200 dark:text-gray-300">
                  Pending Tasks
                </p>
                <p className="text-2xl font-semibold text-white dark:text-gray-100">
                  {componentLoading.tasks ? "..." : taskAlerts.length}
                </p>
                <p className="text-xs text-red-400 dark:text-red-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to view →
                </p>
              </div>
            </div>
          </StandardCard>
        </div>
      </div>

      {/* Quick Actions */}
      <StandardCard
        title="Quick Actions"
        subtitle="Get started with common tasks"
        className="bg-gray-800 dark:bg-gray-900 border-gray-700 dark:border-gray-600"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={navigationHandlers.handleAddReservation}
            className="p-4 border-2 border-dashed border-gray-600 dark:border-gray-500 rounded-lg hover:border-blue-400 hover:bg-blue-900/20 dark:hover:border-blue-500 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="text-center">
              <svg
                className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span className="mt-2 block text-sm font-medium text-gray-200 dark:text-gray-300">
                Add Reservation
              </span>
            </div>
          </button>

          <button
            onClick={navigationHandlers.handleInventoryClick}
            className="p-4 border-2 border-dashed border-gray-600 dark:border-gray-500 rounded-lg hover:border-green-400 hover:bg-green-900/20 dark:hover:border-green-500 dark:hover:bg-green-900/30 transition-colors"
          >
            <div className="text-center">
              <svg
                className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <span className="mt-2 block text-sm font-medium text-gray-200 dark:text-gray-300">
                Manage Inventory
              </span>
            </div>
          </button>

          <button
            onClick={navigationHandlers.handleCreateTaskClick}
            className="p-4 border-2 border-dashed border-gray-600 dark:border-gray-500 rounded-lg hover:border-purple-400 hover:bg-purple-900/20 dark:hover:border-purple-500 dark:hover:bg-purple-900/30 transition-colors"
          >
            <div className="text-center">
              <svg
                className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span className="mt-2 block text-sm font-medium text-gray-200 dark:text-gray-300">
                Create Task
              </span>
            </div>
          </button>
        </div>
      </StandardCard>

      {/* Activity Summary */}
      <StandardCard
        title="Recent Activity"
        subtitle="Overview of your latest property activities"
        className="bg-gray-800 dark:bg-gray-900 border-gray-700 dark:border-gray-600"
      >
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
              <p className="text-sm text-gray-300 dark:text-gray-600 dark:text-gray-400">
                Loading activity...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-blue-400 dark:text-blue-400">
                  {upcomingVisits.length}
                </div>
                <div className="text-sm text-gray-300 dark:text-gray-600 dark:text-gray-400">
                  Upcoming Reservations
                </div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-green-400 dark:text-green-400">
                  {totalInventoryCount}
                </div>
                <div className="text-sm text-gray-300 dark:text-gray-600 dark:text-gray-400">
                  Total Inventory Items
                </div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-purple-400 dark:text-purple-400">
                  {taskAlerts.length}
                </div>
                <div className="text-sm text-gray-300 dark:text-gray-600 dark:text-gray-400">
                  Active Tasks
                </div>
              </div>
            </div>
          )}
        </div>
      </StandardCard>

      {/* Property Location Map */}
      {currentProperty?.latitude && currentProperty?.longitude && (
        <StandardCard
          title="Property Location"
          subtitle={`${currentProperty.address}, ${currentProperty.city}, ${currentProperty.state}`}
          className="bg-gray-800 dark:bg-gray-900 border-gray-700 dark:border-gray-600"
        >
          <div className="h-64 w-full">
            <GoogleMapComponent
              latitude={currentProperty.latitude}
              longitude={currentProperty.longitude}
              address={currentProperty.address || currentProperty.name}
              zoom={16}
              className="border border-gray-600 dark:border-gray-700 rounded-lg"
            />
          </div>
        </StandardCard>
      )}

      {/* Welcome Message (only show once) */}
      {showWelcome && (
        <StandardCard
          title="Welcome to PorchLite!"
          subtitle="Your property management dashboard is ready"
          className="bg-gray-800 dark:bg-gray-900 border-gray-700 dark:border-gray-600"
        >
          <div className="bg-blue-900/30 dark:bg-blue-900/20 border border-blue-600 dark:border-blue-700 rounded-lg p-4">
            <p className="text-blue-300 dark:text-blue-200 text-sm">
              🎉 You're all set! Use the navigation above to manage your
              properties, track reservations, monitor inventory, and stay on top
              of tasks.
            </p>
          </div>
        </StandardCard>
      )}
    </div>
  );
}
