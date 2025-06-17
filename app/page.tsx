"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StandardCard from "@/components/ui/StandardCard";
import { Home as HomeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import GoogleMapComponent from "@/components/GoogleMapComponent";
import { debug } from "@/lib/utils/debug";

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
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
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

  const mockWeather = {
    current: {
      temp: 72,
      condition: "Partly Cloudy",
      humidity: 65,
      wind_speed: 8,
      icon: "partly-cloudy",
    },
    forecast: [
      { date: "Today", high: 75, low: 62, condition: "Sunny", icon: "sunny" },
      {
        date: "Tomorrow",
        high: 78,
        low: 64,
        condition: "Partly Cloudy",
        icon: "partly-cloudy",
      },
      { date: "Wed", high: 73, low: 60, condition: "Rain", icon: "rain" },
    ],
  };

  // ✅ Restore your original fetchDashboardData
  const fetchDashboardData = useCallback(async () => {
    if (!currentProperty?.id) {
      debug.log("❌ No current property, skipping dashboard fetch");
      return;
    }

    debug.log("🔍 Fetching dashboard data for property:", currentProperty.id);
    setLoading(true);

    try {
      // Visits
      setComponentLoading((prev) => ({ ...prev, visits: true }));
      const visitsData = await supabase
        .from("reservations")
        .select("id, title, start_date, end_date, status")
        .eq("property_id", currentProperty.id)
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(10);

      setUpcomingVisits(visitsData.data || []);
      setComponentLoading((prev) => ({ ...prev, visits: false }));

      // Inventory
      setComponentLoading((prev) => ({ ...prev, inventory: true }));
      const inventoryData = await supabase
        .from("inventory")
        .select("id, name, quantity")
        .eq("property_id", currentProperty.id)
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

      // Tasks
      setComponentLoading((prev) => ({ ...prev, tasks: true }));
      const tasksData = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date")
        .eq("property_id", currentProperty.id)
        .in("status", ["pending", "in_progress"])
        .order("due_date", { ascending: true })
        .limit(10);

      setTaskAlerts(tasksData.data || []);
      setComponentLoading((prev) => ({ ...prev, tasks: false }));

      debug.log("✅ Dashboard data fetched successfully");
    } catch (error) {
      debug.error("❌ Error fetching dashboard data:", error);
      setComponentLoading({ visits: false, inventory: false, tasks: false });
    } finally {
      setLoading(false);
    }
  }, [currentProperty?.id]);

  // ✅ Keep all your existing useEffect hooks
  useEffect(() => {
    if (authLoading || propertyLoading) {
      return;
    }

    if (!user?.id || !currentProperty?.id) {
      debug.log("⏳ Waiting for user and property to load...");
      setLoading(false);
      return;
    }

    debug.log(
      "🏠 Property and user loaded, fetching dashboard:",
      currentProperty.name
    );
    fetchDashboardData();
  }, [
    currentProperty?.id,
    currentProperty?.name,
    user?.id,
    authLoading,
    propertyLoading,
    fetchDashboardData,
  ]);

  const handleAddReservation = () => {
    debug.log("➕ Add reservation triggered");
    router.push("/calendar");
  };

  useEffect(() => {
    if (!authLoading && !user) {
      debug.log("🔄 No user found, redirecting to auth...");
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      debug.log("🏠 HomePage render - Auth state:", {
        user: user?.email || "none",
        authLoading,
        propertyLoading,
        currentProperty: currentProperty?.name || "none",
      });
    }
  }, [user?.email, authLoading, propertyLoading, currentProperty?.name]);

  // ✅ Loading states - exactly as you had them
  if (authLoading) {
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

  if (user && propertyLoading) {
    return (
      <StandardPageLayout theme="dark" showHeader={false}>
        <StandardCard>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading your property...</p>
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

  // ✅ Main dashboard - exactly as you had it!
  return (
    <StandardPageLayout theme="dark" showHeader={false}>
      {/* ✅ Beautiful DashboardHeader with property name and weather */}
      <div className="mb-6">
        <DashboardHeader weather={mockWeather} showWeather={true}>
          <h1 className="text-3xl md:text-4xl font-bold mb-1 text-white drop-shadow-lg tracking-tight">
            {currentProperty.name}
          </h1>
          <p className="text-white/90 text-lg md:text-xl drop-shadow-md font-light tracking-wide">
            {currentProperty.address || "Your beautiful property"}
          </p>
        </DashboardHeader>
      </div>

      <div className="space-y-6">
        {/* ✅ Stats Grid - exactly as you had it */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StandardCard>
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
              </div>
            </div>
          </StandardCard>

          <StandardCard>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Inventory
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {componentLoading.inventory ? "..." : totalInventoryCount}
                </p>
              </div>
            </div>
          </StandardCard>

          <StandardCard>
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
                  {componentLoading.inventory ? "..." : inventoryAlerts.length}
                </p>
              </div>
            </div>
          </StandardCard>

          <StandardCard>
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
              </div>
            </div>
          </StandardCard>
        </div>

        {/* ✅ Quick Actions - exactly as you had it */}
        <StandardCard title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleAddReservation}
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
              onClick={() => router.push("/inventory")}
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
              onClick={() => router.push("/tasks")}
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

        {/* ✅ Property Location Map - exactly as you had it */}
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
