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

// Keep all your existing interfaces and state...
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
  const { user, loading, initialized } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryItem[]>([]);
  const [taskAlerts, setTaskAlerts] = useState<any[]>([]);
  const [totalInventoryCount, setTotalInventoryCount] = useState(0);
  const [loadingState, setLoadingState] = useState(true);

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

  // ✅ Move fetchDashboardData outside of useEffect dependencies
  const fetchDashboardData = useCallback(async (propertyId: string) => {
    if (!propertyId) {
      debug.log("❌ No property ID provided");
      return;
    }

    debug.log("🔍 Fetching dashboard data for property:", propertyId);
    setLoadingState(true);

    try {
      // Visits
      setComponentLoading((prev) => ({ ...prev, visits: true }));
      const visitsData = await supabase
        .from("reservations")
        .select("id, title, start_date, end_date, status")
        .eq("property_id", propertyId)
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
        .eq("property_id", propertyId)
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
        .eq("property_id", propertyId)
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
      setLoadingState(false);
    }
  }, []); // ✅ Empty dependency array

  // ✅ Better loading state management
  useEffect(() => {
    // Wait for auth to initialize
    if (!initialized) {
      debug.log("⏳ Auth not initialized yet...");
      return;
    }

    // Handle no user case
    if (!user) {
      debug.log("🔄 No user found, redirecting to auth...");
      router.push("/auth");
      return;
    }

    // Wait for property to load
    if (propertyLoading) {
      debug.log("⏳ Property still loading...");
      return;
    }

    // Handle no property case
    if (!currentProperty?.id) {
      debug.log("⏳ No property selected, showing property selection...");
      setLoadingState(false);
      return;
    }

    // ✅ All conditions met - fetch dashboard data
    debug.log("🏠 Ready to load dashboard for:", currentProperty.name);
    fetchDashboardData(currentProperty.id);
  }, [
    initialized, // ✅ Use initialized instead of authLoading
    user?.id, // ✅ Only the ID matters
    propertyLoading,
    currentProperty?.id, // ✅ Only the ID matters
    fetchDashboardData,
    router,
  ]);

  const handleAddReservation = () => {
    debug.log("➕ Add reservation triggered");
    router.push("/calendar");
  };

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      debug.log("🏠 HomePage render - Auth state:", {
        user: user?.email || "none",
        loading,
        propertyLoading,
        currentProperty: currentProperty?.name || "none",
      });
    }
  }, [user?.email, loading, propertyLoading, currentProperty?.name]);

  // ✅ Loading states - remove page titles
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!initialized ? "Connecting to PorchLite..." : "Loading..."}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            This should only take a moment
          </p>
        </div>
      </div>
    );
  }

  // ✅ Show content even if properties are still loading
  return (
    <StandardPageLayout theme="dark" showHeader={true}>
      <div className="space-y-6">
        <StandardCard
          title="Welcome to PorchLite"
          subtitle={
            user ? `Hello, ${user.email}` : "Please sign in to continue"
          }
        >
          {propertyLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading your properties...</div>
            </div>
          ) : (
            <div>
              {/* Your main content */}
              {currentProperty ? (
                <p>Current property: {currentProperty.name}</p>
              ) : (
                <p>No property selected</p>
              )}
            </div>
          )}
        </StandardCard>
      </div>
    </StandardPageLayout>
  );
}
