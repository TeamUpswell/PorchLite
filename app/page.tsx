"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import DashboardHeader from "@/components/dashboard/DashboardHeader"; // ✅ Add back banner
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StandardCard from "@/components/ui/StandardCard";
import { Home as HomeIcon } from "lucide-react";

// Simplified interfaces
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
  current_stock: number;
  status: "good" | "low" | "critical";
}

export default function HomePage() {
  // ✅ ALL HOOKS FIRST
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryItem[]>([]);
  const [taskAlerts, setTaskAlerts] = useState<any[]>([]);
  const [totalInventoryCount, setTotalInventoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Loading states for individual components
  const [componentLoading, setComponentLoading] = useState({
    visits: true,
    inventory: true,
    tasks: true,
  });

  // Mock weather data (you can replace with real API)
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

  // Fetch dashboard data function
  const fetchDashboardData = async () => {
    if (!currentProperty?.id) {
      console.log("❌ No current property, skipping dashboard fetch");
      return;
    }

    console.log("🔍 Fetching dashboard data for property:", currentProperty.id);
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
        .select("id, name, current_stock")
        .eq("property_id", currentProperty.id)
        .eq("is_active", true);

      const inventoryItems = inventoryData.data || [];
      const lowStockItems = inventoryItems.filter(
        (item) => item.current_stock !== null && item.current_stock < 5
      );

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

      console.log("✅ Dashboard data fetched successfully");
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      setComponentLoading({ visits: false, inventory: false, tasks: false });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Effect with proper timing
  useEffect(() => {
    if (authLoading || propertyLoading) {
      return;
    }

    if (!user?.id || !currentProperty?.id) {
      console.log("⏳ Waiting for user and property to load...");
      setLoading(false);
      setHasInitialized(true);
      return;
    }

    console.log(
      "🏠 Property and user loaded, fetching dashboard:",
      currentProperty.name
    );
    setHasInitialized(true);
    fetchDashboardData();
  }, [currentProperty?.id, user?.id, authLoading, propertyLoading]);

  // Handle new reservation callback
  const handleAddReservation = () => {
    console.log("➕ Add reservation triggered");
    // You can add navigation to calendar page or open a modal here
    window.location.href = "/calendar";
  };

  // ✅ Early returns AFTER all hooks
  if (authLoading || propertyLoading) {
    return (
      <ProtectedPageWrapper>
        <Header title="Dashboard" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </StandardCard>
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  if (!user) {
    return null;
  }

  if (!currentProperty) {
    return (
      <ProtectedPageWrapper>
        <Header title="Dashboard" />
        <PageContainer>
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
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  // ✅ Main dashboard with BOTH Header and DashboardHeader
  return (
    <ProtectedPageWrapper>
      <Header title="Dashboard" />

      {/* ✅ Beautiful banner with weather and property info */}
      <DashboardHeader weather={mockWeather} showWeather={true}>
        <h1 className="text-3xl md:text-4xl font-bold mb-1 text-white drop-shadow-lg tracking-tight">
          {currentProperty.name}
        </h1>
        <p className="text-white/90 text-lg md:text-xl drop-shadow-md font-light tracking-wide">
          {currentProperty.address}
        </p>
      </DashboardHeader>

      <PageContainer>
        <div className="mt-6">
          {" "}
          {/* Add margin top for spacing after banner */}
          <DashboardLayout
            stats={{
              upcomingVisits,
              inventoryAlerts,
              maintenanceAlerts: taskAlerts,
              totalInventoryCount,
            }}
            loading={componentLoading}
            onAddReservation={handleAddReservation}
            enabledComponents={["stats", "visits", "inventory", "tasks"]}
            showBanner={false} // Don't show DashboardLayout banner since we're using DashboardHeader
          />
        </div>
      </PageContainer>
    </ProtectedPageWrapper>
  );
}
