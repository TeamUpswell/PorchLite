"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Users,
  CheckSquare,
  Package,
  AlertTriangle,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  TrendingUp,
  Clock,
  Star,
  Plus,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { toast } from "react-hot-toast";

interface UpcomingVisit {
  id: string;
  title: string;
  guest_name?: string;
  start_date: string;
  end_date: string;
  guests?: number;
  status: "confirmed" | "pending" | "cancelled" | "requested";
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  type?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  category: "essentials" | "cleaning" | "amenities" | "maintenance";
  last_restocked: string;
  status: "good" | "low" | "critical";
}

interface WeatherData {
  current: {
    temp: number;
    condition: string;
    humidity: number;
    wind_speed: number;
    icon: string;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
  }>;
}

export default function HomePage() {
  // ✅ CRITICAL FIX: ALL HOOKS FIRST - No early returns before hooks
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { currentProperty, loading: propertyLoading } = useProperty();

  // State hooks
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryItem[]>([]);
  const [openTasks, setOpenTasks] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);

  // Memoized values
  const propertyId = useMemo(() => currentProperty?.id, [currentProperty?.id]);
  const userId = useMemo(() => user?.id, [user?.id]);

  // Your existing functions (fetchAllDashboardData, etc.)
  const fetchAllDashboardData = async () => {
    if (!propertyId || !userId || hasDataLoaded) {
      return;
    }

    setIsDataLoading(true);
    console.log("🔍 Fetching dashboard data for property:", currentProperty?.name);

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      );

      const dataPromise = Promise.all([
        // Visits
        supabase
          .from("reservations")
          .select(
            `
            id, title, description, start_date, end_date, guests, 
            companion_count, status, user_id, created_at,
            reservation_companions (name, email, phone, relationship)
          `
          )
          .eq("property_id", propertyId)
          .gte("start_date", new Date().toISOString())
          .order("start_date", { ascending: true })
          .limit(5), // Reduce limit for faster loading

        // Inventory
        supabase
          .from("inventory")
          .select("id, name, current_stock, min_stock, status") // Only essential fields
          .eq("property_id", propertyId)
          .eq("is_active", true)
          .limit(50), // Add limit

        // Tasks
        supabase
          .from("tasks")
          .select("id, title, status, priority") // Only essential fields
          .eq("property_id", propertyId)
          .in("status", ["pending", "in_progress"])
          .limit(20), // Add limit
      ]);

      const [visitsData, inventoryData, tasksData] = await Promise.race([
        dataPromise,
        timeoutPromise,
      ]);

      // Process all data at once
      if (visitsData.data) {
        const formattedVisits = visitsData.data.map((v) => ({
          id: v.id,
          title:
            v.title ||
            `Reservation - ${new Date(v.start_date).toLocaleDateString()}`,
          guest_name:
            v.reservation_companions?.[0]?.name || v.title || "Guest",
          start_date: v.start_date,
          end_date: v.end_date,
          guests: (v.guests || 0) + (v.companion_count || 0) || 1,
          status: v.status || "pending",
          contact_email: v.reservation_companions?.[0]?.email || "",
          contact_phone: v.reservation_companions?.[0]?.phone || "",
          notes: v.description || "",
          type: "reservation",
        }));
        setUpcomingVisits(formattedVisits);
      }

      if (inventoryData.data) {
        const alerts = inventoryData.data.filter(
          (item) => item.status === "low" || item.status === "out"
        );
        setInventoryAlerts(alerts);
      }

      if (tasksData.data) {
        setOpenTasks(tasksData.data);
      }

      setHasDataLoaded(true);
      console.log("✅ Dashboard data loaded successfully");
    } catch (error) {
      console.error("❌ Dashboard fetch error:", error);
      // Don't show error toast immediately, set fallback state
      setHasDataLoaded(true); // Prevent infinite loading
    } finally {
      setIsDataLoading(false);
    }
  };

  // ✅ FIXED: Effect with proper timing and dependency array
  useEffect(() => {
    // Don't fetch if still loading auth/property
    if (authLoading || propertyLoading) {
      return;
    }

    // Don't fetch if no user or property
    if (!userId || !propertyId) {
      console.log("⏳ Waiting for user and property to load...");
      setIsDataLoading(false);
      setHasDataLoaded(true);
      return;
    }

    console.log(
      "🏠 Property and user loaded, fetching dashboard data:",
      currentProperty?.name
    );

    // Add debounce to prevent multiple rapid calls
    const timeoutId = setTimeout(fetchAllDashboardData, 100);
    return () => clearTimeout(timeoutId);
  }, [userId, propertyId, authLoading, propertyLoading]);

  // ✅ CRITICAL FIX: Early returns AFTER all hooks
  if (authLoading || propertyLoading) {
    return (
      <ProtectedPageWrapper>
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
        <PageContainer>
          <StandardCard>
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No Property Selected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Please select a property to view the dashboard.
              </p>
            </div>
          </StandardCard>
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  if (isDataLoading) {
    return (
      <ProtectedPageWrapper>
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading dashboard...</span>
            </div>
          </StandardCard>
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  return (
    <ProtectedPageWrapper>
      <PageContainer>
        {/* Simplified Banner - Remove banner management for now */}
        <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg overflow-hidden">
          {currentProperty?.header_image_url && (
            <div
              className="absolute inset-0 bg-cover bg-center z-0"
              style={{
                backgroundImage: `url(${currentProperty.header_image_url})`,
              }}
            />
          )}

          <div className="absolute inset-0 bg-black bg-opacity-60 z-10" />

          <div className="relative h-full flex items-center justify-between p-8 z-20">
            <div className="text-white">
              <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 inline-block">
                <h1 className="text-5xl font-bold mb-2 text-white drop-shadow-lg">
                  {currentProperty?.name || "Property Dashboard"}
                </h1>
                <p className="text-blue-100 text-xl drop-shadow-md">
                  {currentProperty?.address ||
                    "Manage your property efficiently"}
                </p>
              </div>
            </div>

            {/* Weather Widget */}
            <div className="text-white">
              {weatherData && (
                <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 min-w-[220px] shadow-2xl border border-white/10">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2 drop-shadow-lg">
                      {weatherData.current.temp}°F
                    </div>
                    <div className="text-base opacity-90 mb-3 capitalize drop-shadow-md">
                      {weatherData.current.condition}
                    </div>
                    <div className="flex justify-between text-sm opacity-80">
                      <span className="flex items-center">
                        <Droplets className="h-4 w-4 mr-1" />
                        {weatherData.current.humidity}%
                      </span>
                      <span className="flex items-center">
                        <Wind className="h-4 w-4 mr-1" />
                        {weatherData.current.wind_speed}mph
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upcoming Visits */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upcoming Visits</h3>
                <CalendarDays className="h-5 w-5 text-gray-400" />
              </div>
              {upcomingVisits.length > 0 ? (
                <div className="space-y-3">
                  {upcomingVisits.slice(0, 3).map((visit) => (
                    <div key={visit.id} className="text-sm">
                      <div className="font-medium">{visit.title}</div>
                      <div className="text-gray-600">
                        {new Date(visit.start_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No upcoming visits</p>
              )}
            </div>

            {/* Inventory Alerts */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Inventory</h3>
                <Package className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {inventoryAlerts.length}
              </div>
              <p className="text-sm text-gray-600">Items low in stock</p>
            </div>

            {/* Tasks */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Open Tasks</h3>
                <CheckSquare className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {openTasks.length}
              </div>
              <p className="text-sm text-gray-600">Total open tasks</p>
            </div>
          </div>

          {/* Recent Activity - You can expand this */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <CalendarDays className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Welcome to your dashboard!</p>
                  <p className="text-sm text-gray-600">
                    Start managing your property
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/tasks"
                className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
              >
                📋 Manage Tasks
              </Link>
              <Link
                href="/recommendations"
                className="block p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
              >
                ⭐ View Recommendations
              </Link>
              <Link
                href="/calendar"
                className="block p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
              >
                📅 Check Calendar
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </ProtectedPageWrapper>
  );
}
