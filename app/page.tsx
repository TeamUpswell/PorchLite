"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { v4 as uuidv4 } from "uuid";
import "@/styles/dashboard.css";
import {
  Calendar,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Plus,
  ShoppingCart,
  Cloud,
  Wrench,
  Thermometer,
  Wind,
  Eye,
  Clock,
  Home as HomeIcon,
  Wifi,
  Zap,
  Droplets,
  Shield,
  MapPin,
  Phone,
  Pencil,
  X,
  Camera,
  Upload,
  ChevronRight,
} from "lucide-react";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { useViewMode } from "@/lib/hooks/useViewMode";

// Define interfaces for our new dashboard data
interface Issue {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "maintenance" | "cleaning" | "inventory" | "safety";
  description: string;
  created_at: string;
  status: "open" | "in_progress" | "resolved";
}

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
  const { user, loading } = useAuth();
  const router = useRouter();
  const { currentProperty, properties, switchProperty } = useProperty();
  const { updateCurrentProperty } = useProperty();
  const {
    viewMode,
    isManagerView,
    isFamilyView,
    isGuestView,
    isViewingAsLowerRole,
  } = useViewMode();

  // State for dashboard content
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [taskAlerts, setTaskAlerts] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAddReservationModal, setShowAddReservationModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [userUploadedBanners, setUserUploadedBanners] = useState<
    Array<{
      id: string;
      url: string;
      name: string;
      uploaded_at: string;
    }>
  >([]);
  const [bannersLoaded, setBannersLoaded] = useState(false);

  // ✅ NEW: Add the missing banner photos state
  const [bannerPhotos, setBannerPhotos] = useState<string[]>([]);

  // ✅ SEPARATE LOADING STATES for each fetch operation
  const [isVisitsFetching, setIsVisitsFetching] = useState(false);
  const [isInventoryFetching, setIsInventoryFetching] = useState(false);
  const [isTasksFetching, setIsTasksFetching] = useState(false);

  const [totalInventoryCount, setTotalInventoryCount] = useState(0);

  // Add this state for predefined images:
  const [predefinedImages] = useState([
    {
      id: "beach-house",
      name: "Beach House",
      url: "/images/headers/presets/beach-house.jpg",
      thumbnail: "/images/headers/presets/thumbs/beach-house-thumb.jpg",
      category: "Beach",
    },
    {
      id: "city-apartment",
      name: "City Apartment",
      url: "/images/headers/presets/city-apartment.jpg",
      thumbnail: "/images/headers/presets/thumbs/city-apartment-thumb.jpg",
      category: "Urban",
    },
    {
      id: "modern-house",
      name: "Modern House",
      url: "/images/headers/presets/modern-house.jpg",
      thumbnail: "/images/headers/presets/thumbs/modern-house-thumb.jpg",
      category: "Modern",
    },
    {
      id: "cozy-cabin",
      name: "Cozy Cabin",
      url: "/images/headers/presets/cozy-cabin.jpg",
      thumbnail: "/images/headers/presets/thumbs/cozy-cabin-thumb.jpg",
      category: "Rustic",
    },
  ]);

  // ALL YOUR useEffect HOOKS GO HERE - DON'T MOVE THESE
  // Handle redirect after early return
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // ✅ NEW: Add useEffect to sync bannerPhotos with current property
  useEffect(() => {
    setBannerPhotos(
      currentProperty?.header_image_url
        ? [currentProperty.header_image_url]
        : []
    );
  }, [currentProperty?.header_image_url]);

  // Replace all separate useEffects with ONE master useEffect
  useEffect(() => {
    if (!currentProperty?.id) return;

    // Set all loading states
    setIsVisitsFetching(true);
    setIsInventoryFetching(true);
    setIsTasksFetching(true);

    // Fetch all data concurrently
    const fetchAllDashboardData = async () => {
      try {
        const [visitsData, inventoryData, tasksData] = await Promise.all([
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
            .eq("property_id", currentProperty.id)
            .gte("start_date", new Date().toISOString())
            .order("start_date", { ascending: true })
            .limit(10),

          // Inventory
          supabase
            .from("inventory")
            .select("*")
            .eq("property_id", currentProperty.id)
            .eq("is_active", true)
            .order("category", { ascending: true }),

          // Tasks
          supabase
            .from("tasks")
            .select("*")
            .eq("property_id", currentProperty.id)
            .in("status", ["pending", "in_progress"])
            .order("priority", { ascending: false }),
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
          setTotalInventoryCount(inventoryData.data.length);
          const alerts = inventoryData.data.filter(
            (item) => item.status === "low" || item.status === "out"
          );
          setInventoryAlerts(alerts);
        }

        if (tasksData.data) {
          setTaskAlerts(tasksData.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        // Clear all loading states together
        setIsVisitsFetching(false);
        setIsInventoryFetching(false);
        setIsTasksFetching(false);
      }
    };

    fetchAllDashboardData();
  }, [currentProperty?.id]); // Single dependency

  // Fetch weather data
  useEffect(() => {
    async function fetchWeather() {
      if (!currentProperty?.latitude || !currentProperty?.longitude) {
        // Show fallback weather for now
        setWeather({
          current: {
            temp: 72,
            condition: "Partly cloudy",
            humidity: 65,
            wind_speed: 8,
            icon: "02d",
          },
          forecast: [
            {
              date: "2024-05-25",
              high: 75,
              low: 60,
              condition: "Sunny",
              icon: "01d",
            },
            {
              date: "2024-05-26",
              high: 73,
              low: 58,
              condition: "Cloudy",
              icon: "03d",
            },
            {
              date: "2024-05-27",
              high: 68,
              low: 55,
              condition: "Rain",
              icon: "10d",
            },
          ],
        });
        return;
      }

      try {
        const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

        if (!API_KEY) {
          console.log("Weather API key not configured");
          return;
        }

        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${currentProperty.latitude}&lon=${currentProperty.longitude}&appid=${API_KEY}&units=imperial`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();

          setWeather({
            current: {
              temp: Math.round(data.list[0].main.temp),
              condition: data.list[0].weather[0].description,
              humidity: data.list[0].main.humidity,
              wind_speed: Math.round(data.list[0].wind.speed),
              icon: data.list[0].weather[0].icon,
            },
            forecast: data.list.slice(1, 6).map((item: any) => ({
              date: item.dt_txt.split(" ")[0],
              high: Math.round(item.main.temp_max),
              low: Math.round(item.main.temp_min),
              condition: item.weather[0].description,
              icon: item.weather[0].icon,
            })),
          });
        } else {
          console.error("Weather API error:", response.status);
        }
      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    }

    fetchWeather();
  }, [currentProperty]);

  // ALL YOUR FUNCTIONS GO HERE
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProperty) {
      toast.error("Please select a property first");
      return;
    }

    if (!file.type.match(/image\/(jpeg|jpg|png|webp|gif)/i)) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `property-${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("properties")
        .upload(filePath, file, {
          cacheControl: "31536000",
          upsert: true,
        });

      setUploadProgress(100);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("properties")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      await updateCurrentProperty(currentProperty.id, {
        image_url: publicUrl,
      });

      toast.success("Property image updated successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Banner image upload handler
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProperty) {
      toast.error("Please select a property first");
      return;
    }

    if (!file.type.match(/image\/(jpeg|jpg|png|webp|gif)/i)) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `banner-${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("properties")
        .upload(filePath, file, {
          cacheControl: "31536000",
          upsert: true,
        });

      setUploadProgress(100);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("properties")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      await updateCurrentProperty(currentProperty.id, {
        header_image_url: publicUrl,
      });

      toast.success("Banner image updated successfully!");
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error("Failed to upload banner. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle banner removal
  const handleBannerRemove = async () => {
    if (!currentProperty) return;

    try {
      // ✅ Use updateCurrentProperty instead of direct supabase call and page reload
      await updateCurrentProperty(currentProperty.id, {
        header_image_url: null,
      });

      toast.success("Banner image removed successfully!");
      // ✅ Remove window.location.reload() - the updateCurrentProperty will handle the state update
    } catch (error) {
      console.error("Error removing banner image:", error);
      toast.error("Failed to remove banner image. Please try again.");
    }
  };

  // ✅ NEW: Handle banner photo changes from PhotoUpload component
  const handleBannerPhotosChange = async (photos: string[]) => {
    setBannerPhotos(photos);

    if (photos.length > 0 && currentProperty) {
      try {
        // Update the property with the new banner image
        await updateCurrentProperty(currentProperty.id, {
          header_image_url: photos[0], // Use the first (and only) photo
        });

        toast.success("Banner updated successfully!");
        setShowBannerModal(false);
      } catch (error) {
        console.error("Error updating banner:", error);
        toast.error("Failed to update banner");
      }
    } else if (photos.length === 0 && currentProperty) {
      // Handle removal when photos array is empty
      try {
        await updateCurrentProperty(currentProperty.id, {
          header_image_url: null,
        });

        toast.success("Banner removed successfully!");
      } catch (error) {
        console.error("Error removing banner:", error);
        toast.error("Failed to remove banner");
      }
    }
  };

  // ✅ NEW: Handle removing current banner
  const handleRemoveCurrentBanner = async () => {
    if (!currentProperty) return;

    try {
      await updateCurrentProperty(currentProperty.id, {
        header_image_url: null,
      });

      setBannerPhotos([]);
      toast.success("Banner removed successfully!");
    } catch (error) {
      console.error("Error removing banner:", error);
      toast.error("Failed to remove banner");
    }
  };

  // Handle predefined banner selection
  const handlePredefinedBannerSelect = async (imageUrl: string) => {
    if (!currentProperty) return;

    try {
      await updateCurrentProperty(currentProperty.id, {
        header_image_url: imageUrl,
      });

      setBannerPhotos([imageUrl]);
      toast.success("Banner updated successfully!");
      setShowBannerModal(false);
    } catch (error) {
      console.error("Error updating banner:", error);
      toast.error("Failed to update banner");
    }
  };

  // Fetch user's previously uploaded banners
  const fetchUserBannersOnDemand = async () => {
    if (bannersLoaded || !currentProperty) return;

    setBannersLoaded(true);

    try {
      // Get all banner uploads for this property from storage
      const { data: files, error } = await supabase.storage
        .from("properties")
        .list("", {
          limit: 10, // ✅ Reduced from 50
          search: "banner-",
        });

      if (error) throw error;

      // Filter and format banner files
      const bannerFiles =
        files
          ?.filter((file) => file.name.startsWith("banner-"))
          ?.map((file) => {
            const { data: publicUrlData } = supabase.storage
              .from("properties")
              .getPublicUrl(file.name);

            return {
              id: file.name,
              url: publicUrlData.publicUrl,
              name: `Banner ${new Date(
                file.created_at || file.updated_at || Date.now()
              ).toLocaleDateString()}`,
              uploaded_at:
                file.created_at || file.updated_at || new Date().toISOString(),
            };
          })
          ?.sort(
            (a, b) =>
              new Date(b.uploaded_at).getTime() -
              new Date(a.uploaded_at).getTime()
          ) || [];

      setUserUploadedBanners(bannerFiles);
    } catch (error) {
      console.error("Error fetching user banners:", error);
    }
  };

  // Update the banner modal button:
  const openBannerModal = () => {
    setShowBannerModal(true);
    fetchUserBannersOnDemand(); // ✅ Only fetch when needed
  };

  // Task Overview component
  const TaskOverview = () => {
    const [taskStats, setTaskStats] = useState({
      open: 0,
      inProgress: 0,
      overdue: 0,
      completedToday: 0,
    });

    // ✅ ADD: Fetch real task data
    useEffect(() => {
      const fetchTaskStats = async () => {
        if (!currentProperty?.id) return;

        try {
          const today = new Date().toISOString().split("T")[0];

          const { data: tasks, error } = await supabase
            .from("tasks")
            .select("id, status, due_date, completed_at")
            .eq("property_id", currentProperty.id);

          if (error) throw error;

          const stats = {
            // ✅ Updated to match your actual status values
            open: tasks?.filter((t) => t.status === "pending").length || 0,
            inProgress:
              tasks?.filter((t) => t.status === "in_progress").length || 0,
            overdue:
              tasks?.filter(
                (t) =>
                  t.status !== "completed" &&
                  t.due_date &&
                  new Date(t.due_date) < new Date()
              ).length || 0,
            completedToday:
              tasks?.filter(
                (t) =>
                  t.status === "completed" && t.completed_at?.startsWith(today)
              ).length || 0,
          };

          setTaskStats(stats);
        } catch (error) {
          console.error("Error fetching task stats:", error);
        }
      };

      fetchTaskStats();
    }, [currentProperty]);

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Task Overview</h3>
          <Link
            href="/tasks"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All →
          </Link>
        </div>

        {taskStats.open === 0 && taskStats.inProgress === 0 ? (
          // All clear state
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-green-700 font-medium mb-1">
              All Tasks Complete!
            </p>
            <p className="text-sm text-gray-500">
              Your property is in great shape
            </p>
          </div>
        ) : (
          // Task stats grid
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {taskStats.open}
              </div>
              <div className="text-sm text-orange-700">Open</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {taskStats.inProgress}
              </div>
              <div className="text-sm text-blue-700">In Progress</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {taskStats.overdue}
              </div>
              <div className="text-sm text-red-700">Overdue</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {taskStats.completedToday}
              </div>
              <div className="text-sm text-green-700">Done Today</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Add skeleton components for smooth loading
  const LoadingSkeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  // NOW PUT THE EARLY RETURNS AT THE END - AFTER ALL HOOKS
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // No property selected
  if (!currentProperty) {
    return (
      <ProtectedPageWrapper>
        <div className="container mx-auto p-8 text-center">
          <div className="max-w-md mx-auto">
            <HomeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Property Selected
            </h2>
            <p className="text-gray-600 mb-6">
              Please select a property from the dropdown to view your dashboard.
            </p>
            <Link
              href="/properties/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Link>
          </div>
        </div>
      </ProtectedPageWrapper>
    );
  }

  // Main dashboard
  return (
    <ProtectedRoute>
      <ProtectedPageWrapper>
        <PageContainer className="max-w-none">
          {/* Show view mode indicator when viewing as lower role */}
          {isViewingAsLowerRole && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                👁️ Currently viewing as: <strong>{viewMode}</strong>
              </p>
            </div>
          )}

          {/* Banner Section with Weather Widget EMBEDDED ON the image */}
          <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg overflow-hidden mb-8">
            {/* Property Image as Background Layer (z-0) */}
            {currentProperty?.header_image_url && (
              <div
                className="absolute inset-0 bg-cover bg-center z-0"
                style={{
                  backgroundImage: `url(${currentProperty.header_image_url})`,
                }}
              />
            )}

            {/* Dark overlay for text readability (z-10) */}
            <div className="absolute inset-0 bg-black bg-opacity-60 z-10" />

            {/* Content Overlaid on Property Image (z-20) */}
            <div className="relative h-full flex items-center justify-between p-8 z-20">
              {/* Left side - Property name & address */}
              <div className="text-white">
                <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 inline-block">
                  <h1 className="text-5xl font-bold mb-2 text-white drop-shadow-lg text-shadow-lg">
                    {currentProperty?.name || "Property Dashboard"}
                  </h1>
                  <p className="text-blue-100 text-xl drop-shadow-md text-shadow-md">
                    {currentProperty?.address ||
                      "Manage your property efficiently"}
                  </p>
                </div>
              </div>

              {/* Right side - Weather Widget */}
              <div className="text-white">
                {weather && (
                  <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 min-w-[220px] shadow-2xl border border-white/10">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2 drop-shadow-lg text-shadow-lg">
                        {weather.current.temp}°F
                      </div>
                      <div className="text-base opacity-90 mb-3 capitalize drop-shadow-md text-shadow-sm">
                        {weather.current.condition}
                      </div>
                      <div className="flex justify-between text-sm opacity-80">
                        <span className="flex items-center">
                          <Droplets className="h-4 w-4 mr-1" />
                          {weather.current.humidity}%
                        </span>
                        <span className="flex items-center">
                          <Wind className="h-4 w-4 mr-1" />
                          {weather.current.wind_speed}mph
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Camera icon for banner management (z-30) */}
            <div className="absolute top-4 right-4 z-30">
              <button
                onClick={() => setShowBannerModal(true)}
                className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-3 rounded-full transition-all duration-200 border border-white/20 hover:border-white/40 group"
                title="Change banner image"
              >
                <Camera className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Loading overlay when uploading (z-40) */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
                <div className="bg-white/95 rounded-xl p-6 text-center shadow-2xl">
                  <div className="text-sm text-gray-700 mb-3">
                    Uploading banner...
                  </div>
                  <div className="w-40 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {uploadProgress}%
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dashboard Layout - BELOW the banner */}
          <DashboardLayout
            stats={{
              upcomingVisits,
              inventoryAlerts,
              maintenanceAlerts: taskAlerts,
              totalInventoryCount,
              // ✅ NO financial data here at all
            }}
            loading={{
              visits: isVisitsFetching,
              inventory: isInventoryFetching,
              tasks: isTasksFetching,
            }}
            onAddReservation={() => setShowAddReservationModal(true)}
            enabledComponents={[
              "stats",
              "visits",
              // Conditional components based on view mode
              ...(isManagerView || isFamilyView ? ["inventory"] : []),
              ...(isManagerView || isFamilyView ? ["tasks"] : []),
              // ✅ NO financial components here
            ]}
            showBanner={isManagerView} // Only managers can edit banner
            readOnly={isGuestView} // Guests get read-only mode
          />

          {/* Banner Selection Modal */}
          {showBannerModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Choose Banner Image</h3>
                  <button
                    onClick={() => setShowBannerModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* PhotoUpload Component for Custom Images */}
                <div className="mb-8">
                  <PhotoUpload
                    photos={bannerPhotos}
                    onPhotosChange={handleBannerPhotosChange}
                    storageBucket="properties"
                    maxPhotos={1}
                    maxSizeMB={5}
                    allowPreview={true}
                    gridCols="2"
                    label="Custom Banner Image"
                    required={false}
                  />
                </div>

                {/* Current Banner Preview */}
                {currentProperty?.header_image_url && (
                  <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-4 text-gray-900">
                      Current Banner
                    </h4>
                    <div className="relative">
                      <img
                        src={currentProperty.header_image_url}
                        alt="Current banner"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        onClick={handleRemoveCurrentBanner}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Predefined Images */}
                <div className="mb-8">
                  <h4 className="font-medium mb-4">Preset Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {predefinedImages.map((image) => (
                      <div
                        key={image.id}
                        className="cursor-pointer group"
                        onClick={() => handlePredefinedBannerSelect(image.url)}
                      >
                        <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-video">
                          <img
                            src={image.thumbnail}
                            alt={image.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="bg-blue-500 text-white rounded-lg px-3 py-1 text-sm font-medium">
                              Select
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-center mt-2">{image.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Uploaded Images */}
                {userUploadedBanners.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-4">Your Uploaded Images</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {userUploadedBanners.map((banner) => (
                        <div
                          key={banner.id}
                          className="cursor-pointer group"
                          onClick={() =>
                            handlePredefinedBannerSelect(banner.url)
                          }
                        >
                          <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-video">
                            <img
                              src={banner.url}
                              alt={banner.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="bg-blue-500 text-white rounded-lg px-3 py-1 text-sm font-medium">
                                Select
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-center mt-2">
                            {banner.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Reservation Modal */}
          {showAddReservationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Add Reservation</h3>
                  <button
                    onClick={() => setShowAddReservationModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-gray-600 mb-4">
                  Reservation functionality coming soon!
                </p>
                <button
                  onClick={() => setShowAddReservationModal(false)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </PageContainer>
      </ProtectedPageWrapper>
    </ProtectedRoute>
  );
}
