"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StandardCard from "@/components/ui/StandardCard";
import { Home as HomeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import GoogleMapComponent from "@/components/GoogleMapComponent";

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

interface DashboardCache {
  upcomingVisits: UpcomingVisit[];
  inventoryAlerts: InventoryItem[];
  taskAlerts: any[];
  totalInventoryCount: number;
  timestamp: number;
  propertyId: string;
}

// Cache key for localStorage
const DASHBOARD_CACHE_KEY = 'porchlite_dashboard_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryItem[]>([]);
  const [taskAlerts, setTaskAlerts] = useState<any[]>([]);
  const [totalInventoryCount, setTotalInventoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [componentLoading, setComponentLoading] = useState({
    visits: true,
    inventory: true,
    tasks: true,
  });

  const router = useRouter();
  const lastPropertyId = useRef<string | null>(null);
  const fetchInProgress = useRef(false);

  // Enhanced state for data persistence
  const [lastDataFetch, setLastDataFetch] = useState<number>(0);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [showRecovery, setShowRecovery] = useState(false);
  const dataBackupRef = useRef<{
    visits: UpcomingVisit[];
    inventory: InventoryItem[];
    tasks: any[];
    totalCount: number;
  } | null>(null);

  // ✅ REDUCED: Only enable debug logs in development mode
  const isDebugEnabled = process.env.NODE_ENV === 'development';

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

  // ✅ SIMPLIFIED: Basic data backup
  const backupCurrentData = useCallback(() => {
    if (upcomingVisits.length > 0 || inventoryAlerts.length > 0 || taskAlerts.length > 0) {
      dataBackupRef.current = {
        visits: [...upcomingVisits],
        inventory: [...inventoryAlerts],
        tasks: [...taskAlerts],
        totalCount: totalInventoryCount
      };
      
      if (isDebugEnabled) {
        console.log("💾 Dashboard data backed up");
      }
    }
  }, [upcomingVisits, inventoryAlerts, taskAlerts, totalInventoryCount, isDebugEnabled]);

  // ✅ SIMPLIFIED: Data recovery
  const recoverData = useCallback(() => {
    if (dataBackupRef.current) {
      if (isDebugEnabled) {
        console.log("🔄 Recovering dashboard data from backup");
      }
      setUpcomingVisits(dataBackupRef.current.visits);
      setInventoryAlerts(dataBackupRef.current.inventory);
      setTaskAlerts(dataBackupRef.current.tasks);
      setTotalInventoryCount(dataBackupRef.current.totalCount);
      setComponentLoading({ visits: false, inventory: false, tasks: false });
      return true;
    }
    return false;
  }, [isDebugEnabled]);

  // ✅ REMOVED: Verbose state change logging - too noisy for production

  // ✅ SIMPLIFIED: Cache loading with error handling
  const loadCachedData = useCallback(() => {
    if (!currentProperty?.id) return false;

    try {
      const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
      if (!cached) {
        return recoverData();
      }

      const parsedCache: DashboardCache = JSON.parse(cached);
      const cacheAge = Date.now() - parsedCache.timestamp;
      const isValidProperty = parsedCache.propertyId === currentProperty.id;
      const isRecentEnough = cacheAge < (CACHE_DURATION * 2);
      
      if (isValidProperty && isRecentEnough) {
        if (isDebugEnabled) {
          console.log("📦 Loading cached dashboard data");
        }
        
        setUpcomingVisits(parsedCache.upcomingVisits || []);
        setInventoryAlerts(parsedCache.inventoryAlerts || []);
        setTaskAlerts(parsedCache.taskAlerts || []);
        setTotalInventoryCount(parsedCache.totalInventoryCount || 0);
        setComponentLoading({ visits: false, inventory: false, tasks: false });
        setHasLoadedOnce(true);
        
        dataBackupRef.current = {
          visits: parsedCache.upcomingVisits || [],
          inventory: parsedCache.inventoryAlerts || [],
          tasks: parsedCache.taskAlerts || [],
          totalCount: parsedCache.totalInventoryCount || 0
        };
        
        return true;
      } else {
        if (!isValidProperty) {
          localStorage.removeItem(DASHBOARD_CACHE_KEY);
        }
        return recoverData();
      }
    } catch (error) {
      if (isDebugEnabled) {
        console.error("❌ Error loading cached data:", error);
      }
      localStorage.removeItem(DASHBOARD_CACHE_KEY);
      return recoverData();
    }
  }, [currentProperty?.id, recoverData, isDebugEnabled]);

  // ✅ SIMPLIFIED: Cache saving
  const saveCacheData = useCallback((data: {
    upcomingVisits: UpcomingVisit[];
    inventoryAlerts: InventoryItem[];
    taskAlerts: any[];
    totalInventoryCount: number;
  }) => {
    if (!currentProperty?.id) return;

    try {
      const cacheData: DashboardCache = {
        ...data,
        timestamp: Date.now(),
        propertyId: currentProperty.id,
      };
      localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(cacheData));
      
      if (isDebugEnabled) {
        console.log("💾 Dashboard data cached");
      }
    } catch (error) {
      if (isDebugEnabled) {
        console.error("❌ Error saving cache:", error);
      }
    }
  }, [currentProperty?.id, isDebugEnabled]);

  // ✅ SIMPLIFIED: Navigation handlers
  const handleUpcomingVisitsClick = () => {
    try {
      localStorage.removeItem('calendar_stuck_state');
    } catch (error) {
      // Silent fail
    }
    router.push("/calendar");
  };

  const handleLowStockClick = () => {
    router.push("/inventory");
  };

  const handleTasksClick = () => {
    router.push("/tasks");
  };

  // ✅ SIMPLIFIED: Fetch with reduced logging
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    if (!currentProperty?.id) {
      return;
    }

    if (fetchInProgress.current && !forceRefresh) {
      return;
    }

    // Check cache first (unless forced refresh)
    if (!forceRefresh && loadCachedData()) {
      setLoading(false);
      return;
    }

    fetchInProgress.current = true;
    if (isDebugEnabled) {
      console.log("🔍 Fetching dashboard data for:", currentProperty.name);
    }
    setLoading(true);

    try {
      setComponentLoading({
        visits: true,
        inventory: true,
        tasks: true,
      });

      // Visits
      const today = new Date().toISOString().split("T")[0];

      const { data: visitsData, error: visitsError } = await supabase
        .from("reservations")
        .select("id, title, start_date, end_date, status")
        .eq("property_id", currentProperty.id)
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(10);

      if (visitsError) {
        console.error("❌ Error fetching visits:", visitsError);
      } else {
        setUpcomingVisits(visitsData || []);
      }
      setComponentLoading((prev) => ({ ...prev, visits: false }));

      // Inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select("id, name, quantity")
        .eq("property_id", currentProperty.id)
        .eq("is_active", true);

      if (inventoryError) {
        console.error("❌ Error fetching inventory:", inventoryError);
        setInventoryAlerts([]);
        setTotalInventoryCount(0);
      } else {
        const inventoryItems = inventoryData || [];
        const lowStockItems = inventoryItems
          .filter((item) => item.quantity !== null && item.quantity < 5)
          .map((item) => ({
            ...item,
            status:
              (item.quantity === 0
                ? "critical"
                : item.quantity < 2
                ? "critical"
                : "low") as "good" | "low" | "critical",
          }));

        setInventoryAlerts(lowStockItems);
        setTotalInventoryCount(inventoryItems.length);
      }
      setComponentLoading((prev) => ({ ...prev, inventory: false }));

      // Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date")
        .eq("property_id", currentProperty.id)
        .in("status", ["pending", "in_progress"])
        .order("due_date", { ascending: true })
        .limit(10);

      if (tasksError) {
        console.error("❌ Error fetching tasks:", tasksError);
        setTaskAlerts([]);
      } else {
        setTaskAlerts(tasksData || []);
      }
      setComponentLoading((prev) => ({ ...prev, tasks: false }));

      setLastDataFetch(Date.now());

      // Save to cache and backup
      if (visitsData !== undefined && inventoryData !== undefined && tasksData !== undefined) {
        const cacheData = {
          upcomingVisits: visitsData || [],
          inventoryAlerts: inventoryData ? inventoryData
            .filter((item) => item.quantity !== null && item.quantity < 5)
            .map((item) => ({
              ...item,
              status: (item.quantity === 0 ? "critical" : item.quantity < 2 ? "critical" : "low") as "good" | "low" | "critical",
            })) : [],
          taskAlerts: tasksData || [],
          totalInventoryCount: inventoryData?.length || 0,
        };
        
        saveCacheData(cacheData);
        
        dataBackupRef.current = {
          visits: visitsData || [],
          inventory: cacheData.inventoryAlerts,
          tasks: tasksData || [],
          totalCount: inventoryData?.length || 0,
        };
      }

      lastPropertyId.current = currentProperty.id;
      setHasLoadedOnce(true);

      if (isDebugEnabled) {
        console.log("✅ Dashboard data fetched successfully");
      }
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      setComponentLoading({ visits: false, inventory: false, tasks: false });
      
      if (!hasLoadedOnce) {
        loadCachedData();
      }
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [currentProperty?.id, currentProperty?.name, loadCachedData, saveCacheData, hasLoadedOnce, isDebugEnabled]);

  // ✅ SIMPLIFIED: Visibility handling with reduced logging
  useEffect(() => {
    let visibilityTimeout: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setIsPageVisible(isVisible);
      
      if (isVisible && hasLoadedOnce && currentProperty?.id) {
        if (isDebugEnabled) {
          console.log("👁️ Page became visible, restoring data");
        }
        
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
        }
        
        visibilityTimeout = setTimeout(() => {
          if (!loadCachedData()) {
            fetchDashboardData(true);
          }
        }, 100);
      } else if (!isVisible && hasLoadedOnce) {
        backupCurrentData();
      }
    };

    const handleFocus = () => {
      if (hasLoadedOnce && currentProperty?.id) {
        const hasEmptyData = upcomingVisits.length === 0 && 
                            inventoryAlerts.length === 0 && 
                            taskAlerts.length === 0;
        
        if (hasEmptyData) {
          if (!loadCachedData()) {
            fetchDashboardData(true);
          }
        }
      }
    };

    const handleBeforeUnload = () => {
      backupCurrentData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    const backupInterval = setInterval(() => {
      if (isPageVisible && hasLoadedOnce) {
        backupCurrentData();
      }
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(backupInterval);
      if (visibilityTimeout) clearTimeout(visibilityTimeout);
    };
  }, [hasLoadedOnce, currentProperty?.id, loadCachedData, fetchDashboardData, backupCurrentData, isPageVisible, upcomingVisits.length, inventoryAlerts.length, taskAlerts.length, isDebugEnabled]);

  // ✅ SIMPLIFIED: Data staleness detection
  useEffect(() => {
    if (!hasLoadedOnce || !currentProperty?.id) return;

    const checkDataStaleness = () => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastDataFetch;
      const hasData = upcomingVisits.length > 0 || inventoryAlerts.length > 0 || taskAlerts.length > 0;
      
      // Refresh if no data for 2+ minutes
      if (!hasData && timeSinceLastFetch > 2 * 60 * 1000) {
        fetchDashboardData(true);
      }
      
      // Background refresh if data is 10+ minutes old
      if (hasData && timeSinceLastFetch > 10 * 60 * 1000 && isPageVisible) {
        fetchDashboardData(true);
      }
    };

    const stalenessInterval = setInterval(checkDataStaleness, 30000);
    return () => clearInterval(stalenessInterval);
  }, [hasLoadedOnce, currentProperty?.id, lastDataFetch, fetchDashboardData, upcomingVisits.length, inventoryAlerts.length, taskAlerts.length, isPageVisible]);

  // Recovery state management
  useEffect(() => {
    const hasEmptyData = upcomingVisits.length === 0 && 
                        inventoryAlerts.length === 0 && 
                        taskAlerts.length === 0;
    const hasBeenLoaded = hasLoadedOnce;
    const notCurrentlyLoading = !loading && !componentLoading.visits && !componentLoading.inventory && !componentLoading.tasks;
    
    setShowRecovery(hasEmptyData && hasBeenLoaded && notCurrentlyLoading);
  }, [upcomingVisits.length, inventoryAlerts.length, taskAlerts.length, hasLoadedOnce, loading, componentLoading]);

  // Main effect to load data when component mounts or property changes
  useEffect(() => {
    if (authLoading || propertyLoading) {
      return;
    }

    if (!user?.id || !currentProperty?.id) {
      setLoading(false);
      return;
    }

    // Check if property changed
    const propertyChanged = lastPropertyId.current !== currentProperty.id;
    if (propertyChanged) {
      if (isDebugEnabled) {
        console.log("🏠 Property changed, fetching fresh data");
      }
      localStorage.removeItem(DASHBOARD_CACHE_KEY);
      setHasLoadedOnce(false);
    }

    fetchDashboardData(propertyChanged);
  }, [
    currentProperty?.id,
    currentProperty?.name,
    user?.id,
    authLoading,
    propertyLoading,
    fetchDashboardData,
    isDebugEnabled,
  ]);

  const handleAddReservation = () => {
    router.push("/calendar");
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Loading states
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

  // Recovery screen when data is empty
  if (showRecovery) {
    return (
      <StandardPageLayout theme="dark" showHeader={false}>
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
        
        <StandardCard>
          <div className="text-center py-8">
            <div className="text-gray-600 mb-4">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <h3 className="text-lg font-medium mb-2">Dashboard Data Unavailable</h3>
              <p className="text-sm text-gray-500 mb-6">
                Your dashboard data appears to be empty. This sometimes happens when returning to the page after a while.
              </p>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => {
                  if (loadCachedData()) {
                    setShowRecovery(false);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Recovery
              </button>
              <button
                onClick={() => {
                  setShowRecovery(false);
                  fetchDashboardData(true);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  // Main dashboard
  return (
    <StandardPageLayout theme="dark" showHeader={false}>
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
        {/* Stats Grid - 3 clickable cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Upcoming Visits */}
          <div
            onClick={handleUpcomingVisitsClick}
            className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleUpcomingVisitsClick();
              }
            }}
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
                    {componentLoading.visits ? "..." : (upcomingVisits?.length ?? 0)}
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
            onClick={handleLowStockClick}
            className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 rounded-lg group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLowStockClick();
              }
            }}
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
                    {componentLoading.inventory ? "..." : (inventoryAlerts?.length ?? 0)}
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
            onClick={handleTasksClick}
            className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTasksClick();
              }
            }}
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
                    {componentLoading.tasks ? "..." : (taskAlerts?.length ?? 0)}
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