// app/page.tsx - Optimized version
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StandardCard from "@/components/ui/StandardCard";
import { Home as HomeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import GoogleMapComponent from "@/components/GoogleMapComponent";
import { usePropertyWeather } from "@/components/dashboard/WeatherWidget";

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

export default function HomePage() {
  const { user, loading: authLoading, initialized: authInitialized } = useAuth();
  const { 
    currentProperty, 
    userProperties, 
    loading: propertyLoading, 
    error: propertyError,
    hasInitialized: propertyInitialized 
  } = useProperty();

  // ✅ Enhanced debugging
  useEffect(() => {
    console.log("🔍 HomePage Full Debug:", {
      // Auth state
      user: user ? { id: user.id, email: user.email } : null,
      authLoading,
      authInitialized,
      
      // Property state
      currentProperty: currentProperty ? { 
        id: currentProperty.id, 
        name: currentProperty.name 
      } : null,
      userPropertiesCount: userProperties?.length || 0,
      propertyLoading,
      propertyError,
      propertyInitialized,
      
      // Combined state
      readyToLoad: !authLoading && user?.id && propertyInitialized,
      hasAllData: !authLoading && user?.id && currentProperty?.id,
    });
  }, [
    user, authLoading, authInitialized,
    currentProperty, userProperties, propertyLoading, propertyError, propertyInitialized
  ]);

  // Prevent multiple simultaneous fetches
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef<string | null>(null);

  // ✅ RESTORED weather hook
  const {
    weather: weatherData,
    loading: weatherLoading,
    error: weatherError,
  } = usePropertyWeather();

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

  const router = useRouter();

  // Memoize the fetch function - REMOVED from useEffect dependency
  const fetchDashboardData = useCallback(
    async (property_id: string, userId: string) => {
      // Prevent duplicate fetches for the same property
      if (fetchingRef.current || hasFetchedRef.current === property_id) {
        return;
      }

      fetchingRef.current = true;
      hasFetchedRef.current = property_id;

      try {
        console.log(
          "🏠 Property and user loaded, fetching dashboard:",
          currentProperty?.name
        );

        const today = new Date().toISOString().split("T")[0];
        console.log("🔍 Fetching dashboard data for property:", property_id);
        console.log("🔍 Dashboard: Looking for reservations after:", today);

        // Fetch visits
        const visitsData = await supabase
          .from("reservations")
          .select("id, title, start_date, end_date, status")
          .eq("property_id", property_id)
          .gte("start_date", today)
          .order("start_date", { ascending: true })
          .limit(10);

        console.log(
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

        // ✅ Fix the tasks query to match your actual schema:
        const tasksData = await supabase
          .from("tasks")
          .select(
            "id, title, description, priority, status, created_at, due_date, assigned_to"
          )
          .eq("property_id", property_id)
          .in("status", ["pending", "in_progress"]) // ✅ Use actual status values
          .order("created_at", { ascending: false })
          .limit(10);

        console.log("📊 Dashboard: Found tasks:", tasksData.data?.length || 0);
        setTaskAlerts(tasksData.data || []);
        setComponentLoading((prev) => ({ ...prev, tasks: false }));

        console.log("✅ Dashboard data fetched successfully");
      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
        setComponentLoading({ visits: false, inventory: false, tasks: false });
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [currentProperty?.name]
  ); // Minimal dependencies

  // Initial loading effect
  useEffect(() => {
    console.log("🏠 HomePage useEffect:", {
      authLoading,
      propertyLoading,
      userId: user?.id ? "present" : "missing",
      propertyId: currentProperty?.id ? "present" : "missing",
      propertyName: currentProperty?.name,
    });

    // ✅ LONGER TIMEOUT - 15 seconds for slow connections
    const loadingTimeout = setTimeout(() => {
      console.log("⏰ HomePage: Loading timeout reached, showing dashboard anyway");
      setLoading(false);
    }, 15000); // 15 second timeout

    // Wait for auth first
    if (authLoading) {
      console.log("🔄 HomePage: Auth still loading, waiting...");
      return () => clearTimeout(loadingTimeout);
    }

    // Redirect if no user
    if (!user?.id) {
      console.log("🔄 HomePage: No user, redirecting to auth...");
      router.push("/auth");
      return () => clearTimeout(loadingTimeout);
    }

    // ✅ FIXED: Show dashboard even if properties are loading
    if (propertyLoading) {
      console.log("🔄 HomePage: Properties loading, will show dashboard when ready...");
      // Don't return here - let it continue to show dashboard
    }

    console.log("✅ HomePage: Ready to show dashboard");
    clearTimeout(loadingTimeout);

    // Fetch dashboard data if we have a property
    if (currentProperty?.id) {
      fetchDashboardData(currentProperty.id, user.id);
    } else {
      // Show dashboard even without property selected
      console.log("📊 HomePage: No property selected, showing empty dashboard");
      setLoading(false);
    }

    return () => clearTimeout(loadingTimeout);
  }, [user?.id, currentProperty?.id, authLoading, propertyLoading, fetchDashboardData, router]);

  // Debugging effect for auth state
  useEffect(() => {
    console.log("🔍 Debug - Auth state:", {
      user: user?.id,
      authLoading,
      propertyLoading,
      currentProperty: currentProperty?.id,
      propertyName: currentProperty?.name
    });
  }, [user, authLoading, propertyLoading, currentProperty]);

  // Reset fetch tracking when property changes
  useEffect(() => {
    if (currentProperty?.id !== hasFetchedRef.current) {
      hasFetchedRef.current = null;
      fetchingRef.current = false;
      // Reset loading states when property changes
      setComponentLoading({ visits: true, inventory: true, tasks: true });
      setLoading(true);
    }
  }, [currentProperty?.id]);

  // Memoize navigation handlers to prevent re-creation
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

  // Auth redirect effect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Memoize loading states to prevent unnecessary re-renders
  const isAuthLoading = authLoading;
  const isPropertyLoading = propertyLoading;

  // Loading states - SIMPLIFIED
  if (!user?.id) {
    return (
      <StandardPageLayout theme="dark" showHeader={false}>
        <StandardCard>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (user?.id && propertyLoading) {
    return (
      <StandardPageLayout theme="dark" showHeader={false}>
        <StandardCard>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading your properties...</p>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!user) {
    return (
      <StandardPageLayout theme="dark" showHeader={false}>
        <StandardCard>
          <div className="flex items-center justify-center py-12">
            <div>Redirecting to login...</div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!currentProperty) {
    return (
      <StandardPageLayout theme="dark" showHeader={false}>
        <StandardCard>
          <div className="text-center py-8">
            <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No Property Selected
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Please select a property to view your dashboard.
            </p>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  // ✅ Show property selection if user has no properties
  if (user?.id && !propertyLoading && (!currentProperty || currentProperty === null)) {
    return (
      <StandardPageLayout theme="dark" showHeader={false}>
        <StandardCard>
          <div className="text-center py-8">
            <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No Properties Found
            </h3>
            <p className="mt-1 text-sm text-gray-500 mb-4">
              You don't have any properties yet. Create one to get started.
            </p>
            <button
              onClick={() => router.push("/properties/create")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Your First Property
            </button>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  // Main dashboard
  return (
    <StandardPageLayout theme="dark" showHeader={false}>
      <div className="mb-6">
        <DashboardHeader weather={weatherData} showWeather={true}>
          <h1 className="text-3xl md:text-4xl font-bold mb-1 text-white drop-shadow-lg tracking-tight">
            {currentProperty.name}
          </h1>
          <p className="text-white/90 text-lg md:text-xl drop-shadow-md font-light tracking-wide">
            {currentProperty.address || "Your beautiful property"}
          </p>
          {weatherLoading && (
            <p className="text-white/80 text-sm drop-shadow-md">
              Loading weather data...
            </p>
          )}
          {weatherError && (
            <p className="text-white/80 text-sm drop-shadow-md">
              Weather unavailable: {weatherError}
            </p>
          )}
          {weatherData?.location && !weatherLoading && (
            <p className="text-white/80 text-sm drop-shadow-md">
              Current weather for {weatherData.location}
            </p>
          )}
        </DashboardHeader>
      </div>

      <div className="space-y-6">
        {/* Stats Grid - 3 clickable cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Upcoming Visits */}
          <div
            onClick={navigationHandlers.handleUpcomingVisitsClick}
            className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg group"
            role="button"
            tabIndex={0}
          >
            <StandardCard className="h-full group-hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-600"
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
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Upcoming Visits
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {componentLoading.visits ? "..." : upcomingVisits.length}
                  </p>
                  <p className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to view calendar →
                  </p>
                </div>
              </div>
            </StandardCard>
          </div>

          {/* Low Stock Alerts */}
          <div
            onClick={navigationHandlers.handleLowStockClick}
            className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 rounded-lg group"
            role="button"
            tabIndex={0}
          >
            <StandardCard className="h-full group-hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-yellow-600"
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
                  <p className="text-sm font-medium text-gray-600">
                    Low Stock Alerts
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {componentLoading.inventory
                      ? "..."
                      : inventoryAlerts.length}
                  </p>
                  <p className="text-xs text-yellow-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
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
            <StandardCard className="h-full group-hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-red-600"
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
                  <p className="text-sm font-medium text-gray-600">
                    Pending Tasks
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {componentLoading.tasks ? "..." : taskAlerts.length}
                  </p>
                  <p className="text-xs text-red-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to view →
                  </p>
                </div>
              </div>
            </StandardCard>
          </div>
        </div>

        {/* Quick Actions */}
        <StandardCard>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={navigationHandlers.handleAddReservation}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="text-center">
                <svg
                  className="mx-auto h-8 w-8 text-gray-400"
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
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Add Reservation
                </span>
              </div>
            </button>

            <button
              onClick={navigationHandlers.handleInventoryClick}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="text-center">
                <svg
                  className="mx-auto h-8 w-8 text-gray-400"
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
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Manage Inventory
                </span>
              </div>
            </button>

            <button
              onClick={navigationHandlers.handleCreateTaskClick}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className="text-center">
                <svg
                  className="mx-auto h-8 w-8 text-gray-400"
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
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Create Task
                </span>
              </div>
            </button>
          </div>
        </StandardCard>

        {/* Property Location Map */}
        {currentProperty?.latitude && currentProperty?.longitude && (
          <StandardCard title="Property Location">
            <div className="h-64 w-full">
              <GoogleMapComponent
                latitude={currentProperty.latitude}
                longitude={currentProperty.longitude}
                address={currentProperty.address || currentProperty.name}
                zoom={16}
                className="border border-gray-200 rounded-lg"
              />
            </div>
          </StandardCard>
        )}
      </div>
    </StandardPageLayout>
  );
}
